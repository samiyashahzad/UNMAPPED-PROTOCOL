import { Link } from "@tanstack/react-router";
import { Compass, ArrowRight } from "lucide-react";

/**
 * Friendly empty state shown on pages that depend on the assessment payload
 * when the global store is empty (e.g. after a hard refresh).
 */
export function NoAssessmentData({ pageLabel }: { pageLabel: string }) {
  return (
    <main className="pb-20">
      <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6 sm:pt-24">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {pageLabel}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight">
          No data found.
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          We couldn&apos;t find your assessment yet. Please complete the
          onboarding so we can build your skills passport.
        </p>

        <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-3">
            <span
              className="flex h-10 w-10 items-center justify-center rounded-2xl"
              style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
            >
              <Compass className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-base font-semibold">Start the onboarding</p>
              <p className="text-xs text-muted-foreground">
                Takes ~2 minutes. Your words, your context.
              </p>
            </div>
          </div>

          <Link
            to="/onboarding"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-card)]"
            style={{
              background: "var(--gradient-ink)",
              color: "var(--surface-ink-foreground)",
            }}
          >
            Go to step 1 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </main>
  );
}