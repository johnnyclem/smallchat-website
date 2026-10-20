-- The public truth ledger on stenographer.smallchat.dev: one hash-chained
-- stream anyone can read, written only by the site's API through
-- steno_ledger_append, which holds a shared secret and continues the stream
-- after the tail the caller read. Lines are insert-only. Approvals wait
-- beside the stream until a promotion writes them into a TB.
--
-- Applied to the Supabase project the site's SUPABASE_URL names. The write
-- secret is one row in steno_ledger_config (key 'write_secret') and the same
-- value in the site's STENO_LEDGER_SECRET environment variable.

create table if not exists public.steno_ledger_lines (
  seq integer primary key check (seq >= 1),
  id text not null,
  type text not null check (type in ('TB', 'UV', 'ADDENDUM', 'RULING', 'TRANSITION')),
  line jsonb not null,
  hash text not null unique,
  prev_hash text,
  author text not null,
  created_at timestamptz not null default now()
);
create index if not exists steno_ledger_lines_id_idx on public.steno_ledger_lines (id);

create table if not exists public.steno_ledger_approvals (
  id text primary key,
  uv_id text not null,
  by text not null,
  role text not null check (role in ('human', 'agent')),
  agent_session_id text,
  approver_key text not null,
  evidence jsonb not null default '[]'::jsonb,
  note text,
  ts timestamptz not null,
  consumed_by text,
  created_at timestamptz not null default now()
);
create unique index if not exists steno_ledger_approvals_one_per_approver
  on public.steno_ledger_approvals (uv_id, approver_key) where consumed_by is null;
create index if not exists steno_ledger_approvals_uv_idx on public.steno_ledger_approvals (uv_id);

create table if not exists public.steno_ledger_config (
  key text primary key,
  value text not null
);

-- A line is never updated or deleted.
create or replace function public.steno_ledger_lines_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'steno_ledger_lines is append-only' using errcode = 'P0008';
end;
$$;
drop trigger if exists steno_ledger_lines_immutable on public.steno_ledger_lines;
create trigger steno_ledger_lines_immutable
  before update or delete on public.steno_ledger_lines
  for each row execute function public.steno_ledger_lines_immutable();

alter table public.steno_ledger_lines enable row level security;
alter table public.steno_ledger_approvals enable row level security;
alter table public.steno_ledger_config enable row level security;

drop policy if exists steno_ledger_lines_public_read on public.steno_ledger_lines;
create policy steno_ledger_lines_public_read on public.steno_ledger_lines for select using (true);
drop policy if exists steno_ledger_approvals_public_read on public.steno_ledger_approvals;
create policy steno_ledger_approvals_public_read on public.steno_ledger_approvals for select using (true);
-- steno_ledger_config: no policy, so nobody reads it through the API.

-- The one write. The caller read the tail (p_from_seq), chained the new
-- lines after it and folded; this appends them, records new approvals and
-- marks the consumed ones, in one transaction under a lock. If the tail
-- moved, nothing is written (P0007) and the caller reads again.
create or replace function public.steno_ledger_append(
  p_secret text,
  p_from_seq integer,
  p_lines jsonb,
  p_approvals jsonb,
  p_consume text[],
  p_consumed_by text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_secret text;
  v_tail integer;
  v_recent integer;
  v_lines integer := 0;
  v_approvals integer := 0;
  v_seq integer;
  v_hash text;
begin
  select value into v_secret from public.steno_ledger_config where key = 'write_secret';
  if v_secret is null or p_secret is null or v_secret <> p_secret then
    raise exception 'not the ledger''s writer' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('steno_ledger'));

  select coalesce(max(seq), 0) into v_tail from public.steno_ledger_lines;
  if v_tail <> p_from_seq then
    raise exception 'the ledger moved (now at seq %); read it again', v_tail using errcode = 'P0007';
  end if;

  -- A public ledger takes a crowd, not a flood.
  select count(*) into v_recent from public.steno_ledger_lines where created_at > now() - interval '10 minutes';
  if v_recent + jsonb_array_length(coalesce(p_lines, '[]'::jsonb)) > 200 then
    raise exception 'the ledger is busy: more than 200 lines in ten minutes. Try again shortly' using errcode = 'P0009';
  end if;

  insert into public.steno_ledger_lines (seq, id, type, line, hash, prev_hash, author)
  select (l ->> 'seq')::integer, l ->> 'id', l ->> 'type', l, l ->> 'hash', l ->> 'prevHash', coalesce(l ->> 'author', '')
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) l;
  get diagnostics v_lines = row_count;

  select (l ->> 'seq')::integer, l ->> 'hash' into v_seq, v_hash
  from jsonb_array_elements(coalesce(p_lines, '[]'::jsonb)) l
  order by (l ->> 'seq')::integer desc limit 1;

  if p_consume is not null and array_length(p_consume, 1) > 0 then
    update public.steno_ledger_approvals set consumed_by = p_consumed_by where id = any(p_consume) and consumed_by is null;
  end if;

  insert into public.steno_ledger_approvals (id, uv_id, by, role, agent_session_id, approver_key, evidence, note, ts, consumed_by)
  select a ->> 'id', a ->> 'uvId', a ->> 'by', a ->> 'role', a ->> 'agentSessionId', a ->> 'approverKey',
         coalesce(a -> 'evidence', '[]'::jsonb), a ->> 'note', (a ->> 'ts')::timestamptz, a ->> 'consumedBy'
  from jsonb_array_elements(coalesce(p_approvals, '[]'::jsonb)) a;
  get diagnostics v_approvals = row_count;

  return jsonb_build_object('lines', v_lines, 'approvals', v_approvals, 'seq', coalesce(v_seq, p_from_seq), 'hash', v_hash);
end;
$$;

revoke all on function public.steno_ledger_append(text, integer, jsonb, jsonb, text[], text) from public;
grant execute on function public.steno_ledger_append(text, integer, jsonb, jsonb, text[], text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
