import { cn } from "@/lib/utils";

interface Props {
  label: string;
  tone?: "red" | "green" | "blue" | "ink";
  className?: string;
  rotate?: number;
}

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  red: "var(--stamp-red)",
  green: "var(--stamp-green)",
  blue: "var(--stamp-blue)",
  ink: "var(--surface-ink)",
};

/**
 * Wax-seal style stamp badge — purely decorative. Use to label passport
 * sections (e.g. "Technical", "Verified").
 */
export function StampBadge({ label, tone = "ink", className, rotate = -6 }: Props) {
  return (
    <span
      className={cn("stamp", className)}
      style={{ color: TONE[tone], transform: `rotate(${rotate}deg)` }}
    >
      {label}
    </span>
  );
}