import type { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  className?: string;
  variant?: "paper" | "ink";
  edge?: boolean;
  style?: CSSProperties;
}

/**
 * Visual wrapper styled like a passport page. Pure presentation — no logic.
 * `paper` is the cream surface; `ink` flips to the dark interior cover.
 */
export function PassportCard({
  children,
  className,
  variant = "paper",
  edge = false,
  style,
}: Props) {
  const isInk = variant === "ink";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border shadow-[var(--shadow-card)]",
        edge && "passport-edge",
        className,
      )}
      style={{
        background: isInk ? "var(--gradient-ink)" : "var(--gradient-paper)",
        color: isInk ? "var(--surface-ink-foreground)" : "var(--foreground)",
        borderColor: isInk
          ? "color-mix(in oklab, var(--surface-ink-foreground) 12%, transparent)"
          : "var(--border)",
        ...style,
      }}
    >
      {/* Guilloche corner watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-[0.18]"
        style={{ backgroundImage: "var(--guilloche)" }}
      />
      {children}
    </div>
  );
}