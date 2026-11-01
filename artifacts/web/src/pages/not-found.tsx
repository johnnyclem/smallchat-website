import { Link, useLocation } from "wouter";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  const [location] = useLocation();
  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-lg space-y-8">
        <Link href="/" className="inline-flex items-center gap-2 text-base font-medium text-foreground" aria-label="smallchat, home">
          <span aria-hidden className="h-5 w-5 rounded bg-accent" />
          smallchat
        </Link>

        <div className="space-y-3">
          <p className="font-mono text-xs text-muted-foreground">404</p>
          <h1 className="text-[28px] font-medium leading-tight md:text-[40px] md:tracking-[-0.02em]">Unrecognized intent</h1>
        </div>

        <figure className="overflow-hidden rounded-xl border bg-deep">
          <div className="space-y-1 p-5 font-mono text-[13px] leading-6">
            <div className="break-words text-subtle">
              <span className="text-muted-foreground">Intent: </span>
              {location}
            </div>
            <div className="text-subtle">
              <span className="text-negative">Error: </span>No tool available for intent.
            </div>
            <div className="text-subtle">
              <span className="text-muted-foreground">Suggestion: </span>Return to the main registry.
            </div>
          </div>
        </figure>

        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Return home
        </Link>
      </div>
    </main>
  );
}
