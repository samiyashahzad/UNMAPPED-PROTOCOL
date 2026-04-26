import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { RiskLevel, SkillPassport } from "@/data/passport";

interface Props {
  passport: SkillPassport;
}

const RISK_META: Record<
  RiskLevel,
  { position: number; token: string; label: string; bg: string; fg: string }
> = {
  Low: {
    position: 16,
    token: "risk-low",
    label: "Resilient",
    bg: "var(--risk-low)",
    fg: "var(--risk-low-foreground)",
  },
  Medium: {
    position: 50,
    token: "risk-medium",
    label: "Mixed exposure",
    bg: "var(--risk-medium)",
    fg: "var(--risk-medium-foreground)",
  },
  High: {
    position: 84,
    token: "risk-high",
    label: "High exposure",
    bg: "var(--risk-high)",
    fg: "var(--risk-high-foreground)",
  },
};

export function RiskGauge({ passport }: Props) {
  const meta = RISK_META[passport.automation_risk_level];

  return (
    <motion.section
      layout
      className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
      style={{ background: "var(--gradient-ink)" }}
    >
      <div className="space-y-6 p-5 text-surface-ink-foreground sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
              Automation risk index
            </p>
            <h3 className="mt-1 font-display text-2xl font-semibold leading-tight">
              {meta.label}
            </h3>
          </div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: meta.bg, color: meta.fg }}
          >
            {passport.automation_risk_level}
          </span>
        </div>

        {/* Meter */}
        <div className="space-y-2">
          <div className="relative h-3 overflow-hidden rounded-full">
            <div
              className="absolute inset-0 opacity-40"
              style={{ background: "var(--gradient-risk-meter)" }}
            />
            <motion.div
              className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-surface-ink-foreground shadow-[var(--shadow-elevated)]"
              style={{ background: meta.bg }}
              initial={{ left: "0%" }}
              animate={{ left: `${meta.position}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
            />
          </div>
          <div className="flex justify-between font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/50">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>
        </div>

        {/* Analysis */}
        <p className="text-sm leading-relaxed text-surface-ink-foreground/85">
          {passport.automation_analysis}
        </p>

        {/* Econometric signal */}
        <div className="flex items-start gap-3 rounded-2xl border border-surface-ink-foreground/10 bg-surface-ink-foreground/5 p-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            <TrendingUp className="h-4 w-4" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
              Econometric signal
            </p>
            <p className="mt-0.5 text-sm leading-snug text-surface-ink-foreground">
              {passport.econometric_signal}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
}