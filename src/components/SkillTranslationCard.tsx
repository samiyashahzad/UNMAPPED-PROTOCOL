import { motion } from "framer-motion";
import { ArrowRight, Quote } from "lucide-react";
import type { SkillPassport } from "@/data/passport";

interface Props {
  passport: SkillPassport;
}

export function SkillTranslationCard({ passport }: Props) {
  return (
    <motion.section
      layout
      className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
    >
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Skill Translation
          </p>
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          ISCO-08
        </p>
      </div>

      <div className="space-y-6 p-5 sm:p-6">
        {/* Informal input */}
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Informal input
          </p>
          <div className="relative rounded-2xl bg-muted/60 p-4 pl-10">
            <Quote className="absolute left-3 top-3 h-4 w-4 text-accent" />
            <p className="font-display text-base italic leading-snug text-foreground">
              {passport.informal_input}
            </p>
          </div>
        </div>

        {/* Arrow divider */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <ArrowRight className="h-4 w-4" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em]">
            Formalized
          </p>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Formal skills */}
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Formal skills
          </p>
          <div className="flex flex-wrap gap-2">
            {passport.formal_skills.map((skill, i) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>

        {/* ISCO roles */}
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Matched ISCO roles
          </p>
          <ul className="space-y-2">
            {passport.isco_matched_roles.map((role) => {
              const match = role.match(/^(.*?)\s*\((ISCO\s*\d+)\)$/);
              const title = match ? match[1] : role;
              const code = match ? match[2] : "";
              return (
                <li
                  key={role}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-paper px-4 py-3"
                >
                  <span className="font-display text-sm font-semibold text-foreground">
                    {title}
                  </span>
                  {code && (
                    <span className="shrink-0 rounded-md bg-primary px-2 py-0.5 font-mono text-[10px] tracking-wider text-primary-foreground">
                      {code.replace(/\s+/g, " ")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}