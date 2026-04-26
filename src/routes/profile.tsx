import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, Download, Edit3, ExternalLink, Share2 } from "lucide-react";
import type { SkillCategory } from "@/data/passport";
import { EconometricSignals } from "@/components/EconometricSignals";
import { useAssessment } from "@/context/AssessmentContext";
import { NoAssessmentData } from "@/components/NoAssessmentData";
import { StampBadge } from "@/components/ornaments/StampBadge";
import { Guilloche } from "@/components/ornaments/Guilloche";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Skills Profile — UNMAPPED" },
      {
        name: "description",
        content:
          "A portable, human-readable skills credential grouped by technical, interpersonal, and entrepreneurial work.",
      },
    ],
  }),
  component: ProfilePage,
});

const CATEGORY_LABEL: Record<SkillCategory, string> = {
  technical: "Technical",
  interpersonal: "Interpersonal",
  entrepreneurial: "Entrepreneurial",
};

const CATEGORY_TONE: Record<SkillCategory, "red" | "green" | "blue"> = {
  technical: "blue",
  interpersonal: "green",
  entrepreneurial: "red",
};

function ProfilePage() {
  const { data: agent } = useAssessment();

  // Diagnostic: verify exactly what the page is trying to render.
  // eslint-disable-next-line no-console
  console.log("Current Global State:", agent);

  // Strict: pages render from global state only. No demo fallback.
  if (!agent) {
    return <NoAssessmentData pageLabel="Module 01 · Skills Profile" />;
  }

  const agentGrouped = agent?.skills_by_category;
  const totalMapped =
    (agentGrouped?.technical?.length ?? 0) +
    (agentGrouped?.interpersonal?.length ?? 0) +
    (agentGrouped?.entrepreneurial?.length ?? 0);

  function copyShareLink() {
    if (typeof window === "undefined") return;
    navigator.clipboard?.writeText(window.location.href);
  }

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="flex items-baseline justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Module 01 · Skills Profile
          </p>
        </div>

        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Your portable credential.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Grouped in plain language — not jargon. ISCO-08 codes are present for
          systems that need them, but you stay in the driver's seat.
        </p>

        {/* Action bar */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Share2 className="h-3.5 w-3.5" /> Copy share link
          </button>
          <button
            onClick={() => typeof window !== "undefined" && window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Export PDF
          </button>
          <Link
            to="/onboarding"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Edit3 className="h-3.5 w-3.5" /> Edit
          </Link>
        </div>

        {/* Header card */}
        <motion.section
          layout
          className="mt-6 overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
          style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
        >
          <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
                ISCO-08 · Frey-Osborne automation model
              </p>
              {(agent?.formal_skills?.length ?? 0) > 0 && (
                <p className="mt-3 font-display text-xl italic leading-snug">
                  {agent?.formal_skills?.length ?? 0} formal skills detected
                </p>
              )}
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <span className="rounded-full bg-surface-ink-foreground/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em]">
                ISCO-08 aligned
              </span>
              <span className="font-display text-lg font-semibold">
                {totalMapped} skills mapped
              </span>
            </div>
          </div>
        </motion.section>

        {/* Visual map */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {(["technical", "interpersonal", "entrepreneurial"] as SkillCategory[]).map((cat) => {
            const agentSkills = agentGrouped?.[cat] ?? [];
            const count = agentSkills.length;
            return (
            <section
              key={cat}
              className="passport-edge relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.15]"
                style={{ backgroundImage: "var(--guilloche)" }}
              />
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {CATEGORY_LABEL[cat]}
                </h2>
                <StampBadge label={String(count)} tone={CATEGORY_TONE[cat]} />
              </div>
              <Guilloche className="mt-3" height={10} />
              <ul className="mt-4 space-y-3">
                {count === 0 ? (
                  <li className="text-xs italic text-muted-foreground">
                    No skills in this category yet.
                  </li>
                ) : (
                  agentSkills.map((name) => (
                    <li
                      key={name}
                      className="rounded-2xl border border-border/70 bg-surface-paper p-3"
                    >
                      <p className="font-display text-sm font-semibold leading-snug">
                        {name}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </section>
            );
          })}
        </div>

        {/* ISCO matched role cards from agent response */}
        {(agent?.isco_matched_roles?.length ?? 0) > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Matched ISCO-08 roles
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {agent?.isco_matched_roles?.length ?? 0} roles
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {agent?.isco_matched_roles?.map((role, i) => {
                const pct = Math.round((role.automation_probability ?? 0) * 100);
                const tone =
                  role.automation_risk_label === "High"
                    ? { bg: "var(--risk-high)", fg: "var(--risk-high-foreground)" }
                    : role.automation_risk_label === "Medium"
                    ? { bg: "var(--risk-medium)", fg: "var(--risk-medium-foreground)" }
                    : { bg: "var(--risk-low)", fg: "var(--risk-low-foreground)" };
                return (
                  <motion.article
                    key={`${role.isco_code}-${i}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-xl"
                          style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
                        >
                          <Briefcase className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                            ISCO {role.isco_code}
                          </p>
                          <h3 className="font-display text-base font-semibold leading-tight">
                            {role.title}
                          </h3>
                        </div>
                      </div>
                      <span
                        className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ background: tone.bg, color: tone.fg }}
                      >
                        {role.automation_risk_label}
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-baseline justify-between">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Automation probability
                        </p>
                        <p className="font-display text-sm font-semibold">{pct}%</p>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          style={{ background: tone.bg }}
                          className="h-full"
                        />
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        )}

        {/* Econometric signals from agent response */}
        {(agent?.econometric_signals?.length ?? 0) > 0 && (
          <div className="mt-8">
            <EconometricSignals
              signals={agent?.econometric_signals ?? []}
              title="Econometric signals · ILO ILOSTAT"
            />
          </div>
        )}

        {/* Next steps */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            to="/readiness"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] hover:bg-muted"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Next
              </p>
              <p className="font-display text-base font-semibold">AI Readiness assessment</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/opportunities"
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] hover:bg-muted"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Then
              </p>
              <p className="font-display text-base font-semibold">Matched opportunities</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </main>
  );
}