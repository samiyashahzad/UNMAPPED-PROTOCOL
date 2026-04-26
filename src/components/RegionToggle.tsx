import { motion } from "framer-motion";
import type { Region } from "@/data/passport";
import { REGION_NAMES } from "@/data/regions";

interface Props {
  value: Region;
  onChange: (region: Region) => void;
}

export function RegionToggle({ value, onChange }: Props) {
  return (
    <div className="rounded-full border border-border bg-card/60 p-1 shadow-[var(--shadow-card)] backdrop-blur">
      <div className="relative grid grid-cols-2 gap-1">
        {REGION_NAMES.map((region) => {
          const active = region === value;
          return (
            <button
              key={region}
              onClick={() => onChange(region)}
              className="relative z-10 rounded-full px-3 py-2.5 text-xs font-medium tracking-wide transition-colors sm:text-sm"
              style={{
                color: active
                  ? "var(--surface-ink-foreground)"
                  : "var(--muted-foreground)",
              }}
            >
              {active && (
                <motion.span
                  layoutId="region-pill"
                  className="absolute inset-0 -z-10 rounded-full"
                  style={{ background: "var(--gradient-ink)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              {region}
            </button>
          );
        })}
      </div>
    </div>
  );
}