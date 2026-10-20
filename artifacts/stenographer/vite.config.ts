import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import type { IncomingMessage, ServerResponse } from "http";

/**
 * In `pnpm dev`, serve the public ledger's API from the same handlers Vercel
 * runs in production (api/ledger/*), so the page can be tried locally. Needs
 * SUPABASE_URL, SUPABASE_ANON_KEY and STENO_LEDGER_SECRET in the environment.
 */
function ledgerApiPlugin(): Plugin {
  const routes: Record<string, string> = {
    "/api/ledger": "/api/ledger/index.ts",
    "/api/ledger/export": "/api/ledger/export.ts",
    "/api/ledger/act": "/api/ledger/act.ts",
  };
  return {
    name: "ledger-api",
    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const file = routes[url.pathname];
        if (!file) return next();
        try {
          const mod = (await server.ssrLoadModule(file)) as Record<string, (r: Request) => Promise<Response>>;
          const handler = mod[req.method ?? "GET"];
          if (!handler) {
            res.statusCode = 405;
            res.end("method not allowed");
            return;
          }
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method,
            headers: Object.entries(req.headers).filter((e): e is [string, string] => typeof e[1] === "string"),
            body: body && req.method !== "GET" && req.method !== "HEAD" ? body : undefined,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          res.statusCode = 500;
          res.end(err instanceof Error ? err.stack ?? err.message : String(err));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ledgerApiPlugin()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: { port: Number(process.env.PORT) || 5174 },
});
