import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import {
  COUNTRY_CONFIGS,
  PASSPORTS,
  type Region,
  type SkillPassport,
} from "@/data/passport";
import { REGIONS, SETTINGS, getEducationLevels, getRegion } from "@/data/regions";
import {
  DEFAULT_DRAFT,
  notifyProfileChange,
  saveProfile,
  setActiveRegion,
  type OnboardingDraft,
} from "@/lib/profile-store";
import { useAssessment } from "@/context/AssessmentContext";
import type { AgentResponse } from "@/lib/agent-response";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — UNMAPPED" },
      {
        name: "description",
        content:
          "A conversational, low-bandwidth onboarding flow that turns plain-language experience into a structured Skills Profile.",
      },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = ["Context", "Education", "Experience", "Confirm", "Passport"] as const;

function OnboardingPage() {
  const navigate = useNavigate();
  const { setData: setAssessmentData } = useAssessment();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);
  const [interpreting, setInterpreting] = useState(false);
  const [interpreted, setInterpreted] = useState<string[]>([]);
  const [mapping, setMapping] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);

  const seed = PASSPORTS[draft.region];

  const canAdvance = useMemo(() => {
    if (step === 0) return !!draft.country && !!draft.region && !!draft.setting;
    if (step === 1) return !!draft.educationLevel;
    if (step === 2) return draft.experience.trim().length >= 10;
    if (step === 3) return draft.confirmedSkills.length > 0;
    return true;
  }, [step, draft]);

  function next() {
    if (step === 2) {
      // Call the skill-mapping agent, persist the response, then jump to the Skills Profile.
      setMapping(true);
      setMappingError(null);
      (async () => {
        try {
          const res = await fetch(
            "https://sofiajeon-unmapped-backend.hf.space/ask-agent",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                informal_text: draft.experience,
                region: draft.country,
                config: {
                  labor_data_source: "ILO ILOSTAT",
                  taxonomy: "ISCO-08",
                  language: "English",
                  automation_model: "Frey-Osborne",
                },
              }),
            }
          );
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          const raw = (await res.json()) as
            | AgentResponse
            | { response: AgentResponse };
          // Surface raw payload so the backend dev can verify shape.
          // eslint-disable-next-line no-console
          console.log("API Response:", raw);

          // The API wraps the payload as { response: {...} }. Unwrap it; fall
          // back to the raw object for older shapes.
          const payload: AgentResponse =
            raw && typeof raw === "object" && "response" in raw && raw.response
              ? (raw as { response: AgentResponse }).response
              : (raw as AgentResponse);

          // Single source of truth: write into global state (also persists).
          setAssessmentData(payload);

          // Persist a passport rooted in the user's actual input so /profile reflects it.
          const passport: SkillPassport = {
            ...seed,
            informal_input: draft.experience || seed.informal_input,
          };
          saveProfile(passport);
          setActiveRegion(draft.region);
          notifyProfileChange();

          // Only navigate AFTER the global state has been updated and persisted.
          // setAssessmentData writes synchronously to localStorage, so /profile
          // hydrates from it immediately on mount.
          navigate({ to: "/profile" });
        } catch (err) {
          setMappingError(
            err instanceof Error ? err.message : "Could not reach the skills agent."
          );
        } finally {
          setMapping(false);
        }
      })();
      return;
    }
    if (step === 3) {
      // Build the passport and persist
      const passport: SkillPassport = {
        ...seed,
        informal_input: draft.experience || seed.informal_input,
        formal_skills: draft.confirmedSkills,
      };
      saveProfile(passport);
      setActiveRegion(draft.region);
      notifyProfileChange();
      setStep(4);
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function toggleSkill(skill: string) {
    setDraft((d) => ({
      ...d,
      confirmedSkills: d.confirmedSkills.includes(skill)
        ? d.confirmedSkills.filter((s) => s !== skill)
        : [...d.confirmedSkills, skill],
    }));
  }

  function addCustomSkill(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDraft((d) =>
      d.confirmedSkills.includes(trimmed)
        ? d
        : { ...d, confirmedSkills: [...d.confirmedSkills, trimmed] }
    );
  }

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-2xl px-4 pt-8 sm:px-6 sm:pt-12">
        {mapping && (
          <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background/85 backdrop-blur-sm"
          >
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
            <p className="font-display text-lg font-semibold">Mapping your skills…</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Translating your words into ISCO-08
            </p>
          </div>
        )}
        {mappingError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {mappingError}
          </div>
        )}
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2">
          {STEPS.map((label, i) => {
            const reached = i <= step;
            const current = i === step;
            return (
              <div key={label} className="flex flex-1 items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-[10px] font-semibold transition-all"
                  style={{
                    borderColor: reached
                      ? "var(--surface-ink)"
                      : "color-mix(in oklab, var(--border) 80%, transparent)",
                    background: reached ? "var(--surface-ink)" : "transparent",
                    color: reached ? "var(--surface-ink-foreground)" : "var(--muted-foreground)",
                    transform: current ? "rotate(-6deg) scale(1.05)" : "rotate(-6deg)",
                    boxShadow: reached ? "var(--shadow-stamp)" : "none",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-px flex-1"
                    style={{
                      background: reached
                        ? "var(--surface-ink)"
                        : "color-mix(in oklab, var(--border) 70%, transparent)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Step {step + 1} of {STEPS.length} · {STEPS[step]}
        </p>

        <AnimatePresence mode="wait">
          <motion.section
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3"
          >
            {step === 0 && (
              <ContextStep
                draft={draft}
                onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))}
              />
            )}
            {step === 1 && (
              <EducationStep
                region={draft.region}
                value={draft.educationLevel}
                onChange={(v) => setDraft((d) => ({ ...d, educationLevel: v }))}
              />
            )}
            {step === 2 && (
              <ExperienceStep
                value={draft.experience}
                onChange={(v) => setDraft((d) => ({ ...d, experience: v }))}
                example={seed.informal_input}
                interpreting={interpreting}
              />
            )}
            {step === 3 && (
              <ConfirmStep
                interpreted={interpreted}
                confirmed={draft.confirmedSkills}
                onToggle={toggleSkill}
                onAdd={addCustomSkill}
              />
            )}
            {step === 4 && (
              <PassportStep
                draft={draft}
                onContinue={() => navigate({ to: "/profile" })}
              />
            )}
          </motion.section>
        </AnimatePresence>

        {/* Nav buttons */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
            <button
              onClick={next}
              disabled={!canAdvance || interpreting || mapping}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-card)] disabled:opacity-40"
              style={{
                background: "var(--gradient-ink)",
                color: "var(--surface-ink-foreground)",
              }}
            >
              {mapping ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mapping your skills…
                </>
              ) : interpreting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Interpreting…
                </>
              ) : step === 3 ? (
                <>Generate passport <Sparkles className="h-3.5 w-3.5" /></>
              ) : (
                <>Continue <ArrowRight className="h-3.5 w-3.5" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function ContextStep({
  draft,
  onChange,
}: {
  draft: OnboardingDraft;
  onChange: (patch: Partial<OnboardingDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Where do you live and work?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We calibrate your passport for your local labour market — not a Western default.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {REGIONS.map((r) => {
          const active = draft.region === r.name;
          const cfg = COUNTRY_CONFIGS[r.name];
          return (
            <button
              key={r.name}
              onClick={() =>
                onChange({
                  region: r.name,
                  country: r.defaultCountry,
                  language: cfg.language,
                })
              }
              className="rounded-2xl border p-4 text-left transition-colors"
              style={{
                background: active ? "var(--surface-ink)" : "var(--card)",
                color: active ? "var(--surface-ink-foreground)" : "var(--foreground)",
                borderColor: active ? "var(--surface-ink)" : "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{r.flag}</span>
                {active && <Check className="h-4 w-4" />}
              </div>
              <p className="mt-3 font-display text-base font-semibold">{r.defaultCountry}</p>
              <p className="text-xs opacity-70">{r.name}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] opacity-60">
                {r.sub}
              </p>
            </button>
          );
        })}
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Country
        </p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.find((r) => r.name === draft.region)?.countries.map((c) => {
            const active = draft.country === c.name;
            return (
              <button
                key={c.name}
                onClick={() => onChange({ country: c.name, language: c.language })}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-ink)" : "var(--card)",
                  color: active ? "var(--surface-ink-foreground)" : "var(--foreground)",
                  borderColor: active ? "var(--surface-ink)" : "var(--border)",
                }}
              >
                <span className="mr-1">{c.flag}</span>
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Setting
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SETTINGS.map((s) => {
            const active = draft.setting === s;
            return (
              <button
                key={s}
                onClick={() => onChange({ setting: s })}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-ink)" : "var(--card)",
                  color: active ? "var(--surface-ink-foreground)" : "var(--foreground)",
                  borderColor: active ? "var(--surface-ink)" : "var(--border)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EducationStep({
  region,
  value,
  onChange,
}: {
  region: Region;
  value: string;
  onChange: (v: string) => void;
}) {
  const options = getEducationLevels(region);
  const taxonomyLabel = getRegion(region).educationTaxonomyLabel;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          What's your education background?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Mapped to the {taxonomyLabel} — not a Western equivalent.
        </p>
      </div>

      <div className="space-y-2">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onChange(opt)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors"
              style={{
                background: active ? "var(--surface-ink)" : "var(--card)",
                color: active ? "var(--surface-ink-foreground)" : "var(--foreground)",
                borderColor: active ? "var(--surface-ink)" : "var(--border)",
              }}
            >
              <span className="font-medium">{opt}</span>
              {active && <Check className="h-4 w-4" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExperienceStep({
  value,
  onChange,
  example,
  interpreting,
}: {
  value: string;
  onChange: (v: string) => void;
  example: string;
  interpreting: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Tell us what you do.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Plain language, your words. The AI will read between the lines.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Example
        </p>
        <p className="mt-1 font-display italic text-sm text-foreground">"{example}"</p>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe what you do or have done — paid, unpaid, learning, side projects…"
        rows={6}
        disabled={interpreting}
        className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-base leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {value.length} chars · minimum 10
      </p>
    </div>
  );
}

function ConfirmStep({
  interpreted,
  confirmed,
  onToggle,
  onAdd,
}: {
  interpreted: string[];
  confirmed: string[];
  onToggle: (s: string) => void;
  onAdd: (s: string) => void;
}) {
  const [custom, setCustom] = useState("");
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight">
          Did we get it right?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap to keep or remove. Add anything we missed — in your own words.
        </p>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          AI interpreted these skills
        </p>
        <div className="flex flex-wrap gap-2">
          {interpreted.map((s) => {
            const active = confirmed.includes(s);
            return (
              <button
                key={s}
                onClick={() => onToggle(s)}
                className="rounded-full border px-3 py-1.5 text-sm font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-ink)" : "var(--card)",
                  color: active ? "var(--surface-ink-foreground)" : "var(--muted-foreground)",
                  borderColor: active ? "var(--surface-ink)" : "var(--border)",
                }}
              >
                {active ? "✓ " : "+ "}
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Add a skill in your own words
        </p>
        <div className="flex gap-2">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="e.g. Knows how to negotiate with suppliers"
            className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onAdd(custom);
                setCustom("");
              }
            }}
          />
          <button
            onClick={() => {
              onAdd(custom);
              setCustom("");
            }}
            className="rounded-full px-4 py-2.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
          >
            Add
          </button>
        </div>
      </div>

      {confirmed.filter((c) => !interpreted.includes(c)).length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            You added
          </p>
          <div className="flex flex-wrap gap-2">
            {confirmed
              .filter((c) => !interpreted.includes(c))
              .map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-sm font-medium text-foreground"
                >
                  {s}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PassportStep({
  draft,
  onContinue,
}: {
  draft: OnboardingDraft;
  onContinue: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Your skills profile card
        </p>
        <h2 className="mt-1 font-display text-3xl font-semibold leading-tight tracking-tight">
          Portable. Honest. Yours.
        </h2>
      </div>

      <div
        className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
        style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
      >
        <div className="border-b border-surface-ink-foreground/10 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
            UNMAPPED · {draft.country}
          </p>
          <p className="mt-2 font-display text-2xl font-semibold">
            {draft.educationLevel || "—"}
          </p>
          <p className="text-xs text-surface-ink-foreground/70">
            {draft.setting} · {draft.language}
          </p>
        </div>
        <div className="space-y-3 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
            Confirmed skills
          </p>
          <div className="flex flex-wrap gap-2">
            {draft.confirmedSkills.map((s) => (
              <span
                key={s}
                className="rounded-full border border-surface-ink-foreground/20 bg-surface-ink-foreground/5 px-3 py-1 text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[var(--shadow-elevated)]"
        style={{
          background: "var(--gradient-ink)",
          color: "var(--surface-ink-foreground)",
        }}
      >
        Open my Skills Profile <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}