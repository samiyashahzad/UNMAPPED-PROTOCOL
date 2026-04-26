import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Globe2, Languages, Save, Settings2 } from "lucide-react";
import { COUNTRY_CONFIGS, type CountryConfig, type Region } from "@/data/passport";
import { loadActiveRegion, setActiveRegion } from "@/lib/profile-store";
import { REGION_NAMES } from "@/data/regions";

export const Route = createFileRoute("/config")({
  head: () => ({
    meta: [
      { title: "Country configuration — UNMAPPED" },
      {
        name: "description",
        content:
          "The country-agnostic control panel: data source, education taxonomy, language, calibration, and enabled opportunity types.",
      },
    ],
  }),
  component: ConfigPage,
});

const ALL_TYPES: CountryConfig["enabledOpportunityTypes"] = [
  "Formal job",
  "Gig",
  "Freelance",
  "Training",
  "Fellowship",
];

function ConfigPage() {
  const [region, setRegion] = useState<Region>("Sub-Saharan Africa");
  const [config, setConfig] = useState<CountryConfig>(COUNTRY_CONFIGS["Sub-Saharan Africa"]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const r = loadActiveRegion();
    setRegion(r);
    setConfig(COUNTRY_CONFIGS[r]);
  }, []);

  function switchRegion(r: Region) {
    setRegion(r);
    setConfig(COUNTRY_CONFIGS[r]);
    setActiveRegion(r);
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  }

  function toggleType(t: CountryConfig["enabledOpportunityTypes"][number]) {
    setConfig((c) => ({
      ...c,
      enabledOpportunityTypes: c.enabledOpportunityTypes.includes(t)
        ? c.enabledOpportunityTypes.filter((x) => x !== t)
        : [...c.enabledOpportunityTypes, t],
    }));
  }

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Infrastructure · Country-agnostic by design
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Switch the country.
          <br />
          The platform reconfigures.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          This panel proves the infrastructure argument: data sources, taxonomies, language,
          and calibration adapt without re-deploying the product.
        </p>

        {/* Region switcher */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {REGION_NAMES.map((r) => {
            const active = region === r;
            const c = COUNTRY_CONFIGS[r];
            return (
              <button
                key={r}
                onClick={() => switchRegion(r)}
                className="rounded-2xl border p-4 text-left transition-colors"
                style={{
                  background: active ? "var(--surface-ink)" : "var(--card)",
                  color: active ? "var(--surface-ink-foreground)" : "var(--foreground)",
                  borderColor: active ? "var(--surface-ink)" : "var(--border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <Globe2 className="h-4 w-4 opacity-70" />
                  {active && <Check className="h-4 w-4" />}
                </div>
                <p className="mt-3 font-display text-lg font-semibold">{c.country}</p>
                <p className="text-xs opacity-70">{c.region}</p>
              </button>
            );
          })}
        </div>

        {/* Config rows */}
        <motion.section
          key={region}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]"
        >
          <Row icon={<Settings2 className="h-4 w-4" />} label="Active data source" value={config.dataSource} />
          <Row icon={<Settings2 className="h-4 w-4" />} label="Education taxonomy" value={config.educationTaxonomy} />
          <Row icon={<Languages className="h-4 w-4" />} label="Language / script" value={config.language} />
          <Row
            icon={<Settings2 className="h-4 w-4" />}
            label="Automation risk calibration"
            value={config.calibration}
            options={["LMIC urban", "LMIC rural", "Other"] as const}
            onChange={(v) =>
              setConfig((c) => ({ ...c, calibration: v as CountryConfig["calibration"] }))
            }
          />

          <div className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Opportunity types enabled
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {ALL_TYPES.map((t) => {
                const active = config.enabledOpportunityTypes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{
                      background: active ? "var(--surface-ink)" : "var(--card)",
                      color: active ? "var(--surface-ink-foreground)" : "var(--muted-foreground)",
                      borderColor: active ? "var(--surface-ink)" : "var(--border)",
                    }}
                  >
                    {active ? "✓ " : "+ "}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </motion.section>

        <div className="mt-6 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Changes apply to the live demo immediately.
          </p>
          {saved && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: "var(--risk-low)", color: "var(--risk-low-foreground)" }}
            >
              <Save className="h-3 w-3" /> Region switched
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

function Row({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options?: readonly string[];
  onChange?: (v: string) => void;
}) {
  return (
    <div className="grid items-center gap-3 p-5 sm:grid-cols-[200px_1fr]">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>{icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em]">{label}</span>
      </div>
      {options && onChange ? (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = value === o;
            return (
              <button
                key={o}
                onClick={() => onChange(o)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-ink)" : "var(--card)",
                  color: active ? "var(--surface-ink-foreground)" : "var(--foreground)",
                  borderColor: active ? "var(--surface-ink)" : "var(--border)",
                }}
              >
                {o}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="font-display text-base font-semibold">{value}</p>
      )}
    </div>
  );
}