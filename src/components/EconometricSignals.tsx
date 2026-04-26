import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { AgentEconometricSignal } from "@/lib/agent-response";

interface Props {
  signals: AgentEconometricSignal[];
  title?: string;
  variant?: "light" | "dark";
}

export function EconometricSignals({
  signals,
  title = "Econometric signals",
  variant = "light",
}: Props) {
  if (!signals || signals.length === 0) return null;

  const isDark = variant === "dark";

  return (
    <section
      className={
        isDark
          ? "overflow-hidden rounded-3xl border border-surface-ink-foreground/10 shadow-[var(--shadow-elevated)]"
          : "overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
      }
      style={isDark ? { background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" } : undefined}
    >
      <div
        className={
          isDark
            ? "border-b border-surface-ink-foreground/10 px-5 py-4"
            : "border-b border-border px-5 py-4"
        }
      >
        <div className="flex items-center gap-2">
          <Activity
            className={isDark ? "h-3.5 w-3.5 text-surface-ink-foreground/70" : "h-3.5 w-3.5 text-muted-foreground"}
          />
          <p
            className={
              isDark
                ? "font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60"
                : "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
            }
          >
            {title}
          </p>
        </div>
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {signals.map((s, i) => (
          <motion.div
            key={`${s.label}-${i}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={
              isDark
                ? "rounded-2xl border border-surface-ink-foreground/10 bg-surface-ink-foreground/5 p-4"
                : "rounded-2xl border border-border/70 bg-surface-paper p-4"
            }
          >
            <p
              className={
                isDark
                  ? "font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60"
                  : "font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
              }
            >
              {s.label}
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-display text-2xl font-semibold leading-none">
                {s.value}
              </span>
              {s.unit && (
                <span
                  className={
                    isDark
                      ? "text-xs text-surface-ink-foreground/70"
                      : "text-xs text-muted-foreground"
                  }
                >
                  {s.unit}
                </span>
              )}
              {s.year && (
                <span
                  className={
                    isDark
                      ? "ml-auto font-mono text-[10px] text-surface-ink-foreground/60"
                      : "ml-auto font-mono text-[10px] text-muted-foreground"
                  }
                >
                  {s.year}
                </span>
              )}
            </p>
            <p
              className={
                isDark
                  ? "mt-2 border-t border-surface-ink-foreground/10 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-surface-ink-foreground/55"
                  : "mt-2 border-t border-border/60 pt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/80"
              }
            >
              Source · {s.source}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}