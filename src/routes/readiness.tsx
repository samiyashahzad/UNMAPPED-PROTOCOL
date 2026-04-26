import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";
import { useAssessment } from "@/context/AssessmentContext";
import { NoAssessmentData } from "@/components/NoAssessmentData";
import { EconometricSignals } from "@/components/EconometricSignals";

export const Route = createFileRoute("/readiness")({
  head: () => ({
    meta: [
      { title: "AI Readiness — UNMAPPED" },
      {
        name: "description",
        content:
          "An honest assessment of which skills are at risk, durable, and emerging — calibrated for LMIC task composition.",
      },
    ],
  }),
  component: ReadinessPage,
});

function ReadinessPage() {
  const { data: agent } = useAssessment();

  if (!agent) {
    return <NoAssessmentData pageLabel="Module 02 · AI Readiness" />;
  }

  const riskLevel = agent?.automation_risk_level;
  const gaugePosition = riskLevel === "Low" ? 16 : riskLevel === "Medium" ? 50 : 84;
  const gaugeTone =
    riskLevel === "High"
      ? { bg: "var(--risk-high)", fg: "var(--risk-high-foreground)", label: "High exposure" }
      : riskLevel === "Medium"
      ? { bg: "var(--risk-medium)", fg: "var(--risk-medium-foreground)", label: "Mixed exposure" }
      : { bg: "var(--risk-low)", fg: "var(--risk-low-foreground)", label: "Resilient" };

  const roles = agent?.isco_matched_roles ?? [];

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Module 02 · AI Readiness & displacement risk
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Honest, not alarming.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          We tell you what&apos;s shifting and what isn&apos;t — calibrated for your context.
        </p>

        {/* Automation risk gauge — driven by agent response when available */}
        <section
          className="mt-6 overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
          style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
        >
          <div className="space-y-5 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
                  Automation risk index
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">
                  {gaugeTone.label}
                </h3>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold"
                style={{ background: gaugeTone.bg, color: gaugeTone.fg }}
              >
                {riskLevel ?? "Unknown"}
              </span>
            </div>
            <div className="space-y-2">
              <div className="relative h-3 overflow-hidden rounded-full">
                <div
                  className="absolute inset-0 opacity-40"
                  style={{ background: "var(--gradient-risk-meter)" }}
                />
                <motion.div
                  className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface-ink-foreground shadow-[var(--shadow-elevated)]"
                  style={{ background: gaugeTone.bg }}
                  initial={{ left: "0%" }}
                  animate={{ left: `${gaugePosition}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/50">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </section>

        {/* ISCO matched role cards — automation probability per role from API */}
        {roles.length > 0 && (
          <section className="mt-8">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                Roles & their automation exposure
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {roles.length} roles
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {roles.map((role, i) => {
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

        {/* Econometric signals from the API */}
        {(agent?.econometric_signals?.length ?? 0) > 0 && (
          <div className="mt-8">
            <EconometricSignals
              signals={agent?.econometric_signals ?? []}
              title="Econometric signals · ILO ILOSTAT"
            />
          </div>
        )}

        {/* Transparency */}
        <p className="mt-8 rounded-2xl border border-dashed border-border bg-card/50 p-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Uses Frey-Osborne automation scores · re-weighted for LMIC task composition · no
          single number captures a person.
        </p>
      </div>
    </main>
  );
}