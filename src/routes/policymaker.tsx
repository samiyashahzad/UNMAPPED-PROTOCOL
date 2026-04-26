import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Download, Filter, Users } from "lucide-react";
import { AGGREGATE_SUPPLY_DEMAND, REGION_ECONOMETRICS, type Region } from "@/data/passport";
import { loadActiveRegion } from "@/lib/profile-store";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/policymaker")({
  head: () => ({
    meta: [
      { title: "Policymaker dashboard — UNMAPPED" },
      {
        name: "description",
        content:
          "Aggregate skills supply, demand-gap analysis, and econometric signals for program officers and policymakers.",
      },
    ],
  }),
  component: PolicymakerPage,
});

function PolicymakerPage() {
  const { user, profile, hasRole, loading } = useAuth();
  const navigate = useNavigate();
  const [region, setRegion] = useState<Region>("Sub-Saharan Africa");
  const [gender, setGender] = useState<"All" | "Women" | "Men">("All");
  const [education, setEducation] = useState("All");

  useEffect(() => setRegion(loadActiveRegion()), []);

  // Auth gate: must be admin OR approved policymaker
  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Sign-in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The policymaker dashboard is restricted to approved institutional accounts.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link to="/auth" className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">
            Sign in
          </Link>
          <Link
            to="/signup/policymaker"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Apply
          </Link>
        </div>
      </div>
    );
  }
  if (profile?.status === "pending") {
    navigate({ to: "/pending" });
    return null;
  }
  if (!hasRole("admin") && !hasRole("policymaker")) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This dashboard is for approved policymakers. Apply for access if your institution uses the UNMAPPED.
        </p>
        <Link
          to="/signup/policymaker"
          className="mt-5 inline-block rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Apply for access
        </Link>
      </div>
    );
  }

  const data = AGGREGATE_SUPPLY_DEMAND[region];
  const econ = REGION_ECONOMETRICS[region];

  const handleExportCSV = () => {
    const escape = (v: string | number) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines: string[] = [];
    lines.push(`UNMAPPED Policymaker Export`);
    lines.push(`Generated,${new Date().toISOString()}`);
    lines.push(`Region,${escape(region)}`);
    lines.push(`Gender filter,${escape(gender)}`);
    lines.push(`Education filter,${escape(education)}`);
    lines.push("");
    lines.push("Section,Skills supply vs. employer demand");
    lines.push("Skill,Supply (%),Demand (%),Gap");
    data.forEach((row) => {
      lines.push([escape(row.label), row.supply, row.demand, row.demand - row.supply].join(","));
    });
    lines.push("");
    lines.push("Section,Econometric signals");
    lines.push("Metric,Value");
    lines.push(`Youth NEET,${escape(econ.neet)}`);
    lines.push(`Sector trend,${escape(econ.sectorTrend)}`);
    lines.push(`Wage floor,${escape(econ.wageFloor)}`);
    lines.push(`Source,${escape(econ.source)}`);
    lines.push("");
    lines.push("Section,Top stats");
    lines.push("Metric,Value,Note");
    lines.push(`Active profiles,14820,${escape(`${region}, last 30d`)}`);
    lines.push(`Median match score,71,Across surfaced opportunities`);
    lines.push(`At-risk share,34%,Skills exposed to AI displacement`);
    lines.push(`Demand-gap roles,6,Where supply trails demand >10 pts`);

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const slug = region.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unmapped-policymaker-${slug}-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Institutional view</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Where supply meets need.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Same data Amara sees — different lens. Designed for program officers building evidence-based
              interventions.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          <FilterPill
            label="Region"
            value={region}
            options={["Sub-Saharan Africa", "South Asia"] as Region[]}
            onChange={(v) => setRegion(v as Region)}
          />
          <FilterPill
            label="Gender"
            value={gender}
            options={["All", "Women", "Men"] as const}
            onChange={(v) => setGender(v as "All" | "Women" | "Men")}
          />
          <FilterPill
            label="Education"
            value={education}
            options={["All", "Secondary", "Tertiary", "Self-taught"] as const}
            onChange={setEducation}
          />
        </div>

        {/* Top stats */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Active profiles" value="14,820" sub={`${region}, last 30d`} />
          <Stat label="Median match score" value="71" sub="Across surfaced opportunities" />
          <Stat label="At-risk share" value="34%" sub="Skills exposed to AI displacement" />
          <Stat label="Demand-gap roles" value="6" sub="Where supply trails demand >10 pts" />
        </div>

        {/* Supply vs demand */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight">Skills supply vs. employer demand</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Aggregated from active profiles + employer postings · {region}
              </p>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <Legend label="Supply" color="var(--surface-ink)" />
              <Legend label="Demand" color="var(--accent)" />
            </div>
          </div>

          <ul className="mt-5 space-y-4">
            {data.map((row) => {
              const gap = row.demand - row.supply;
              return (
                <li key={row.label}>
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-sm font-semibold">{row.label}</p>
                    <span
                      className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider"
                      style={{
                        background: gap > 10 ? "var(--risk-high)" : gap < -10 ? "var(--risk-low)" : "var(--muted)",
                        color:
                          gap > 10
                            ? "var(--risk-high-foreground)"
                            : gap < -10
                              ? "var(--risk-low-foreground)"
                              : "var(--muted-foreground)",
                      }}
                    >
                      {gap > 0 ? `+${gap} demand gap` : gap < 0 ? `${gap} oversupply` : "balanced"}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1">
                    <Bar pct={row.supply} color="var(--surface-ink)" tone="dark" />
                    <Bar pct={row.demand} color="var(--accent)" tone="dark" />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Econometric panel */}
        <section
          className="mt-8 overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
          style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
        >
          <div className="border-b border-surface-ink-foreground/10 px-5 py-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
              Econometric signals · {region}
            </p>
          </div>
          <div className="grid gap-4 p-5 sm:grid-cols-3">
            <SignalCard label="Youth NEET" value={econ.neet} />
            <SignalCard label="Sector trend" value={econ.sectorTrend} />
            <SignalCard label="Wage floor" value={econ.wageFloor} />
          </div>
          <p className="border-t border-surface-ink-foreground/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
            Source: {econ.source}
          </p>
        </section>

        <div className="mt-8 flex items-center gap-2 rounded-2xl border border-dashed border-border bg-card/60 p-4 text-xs text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          Aggregations are anonymized and updated nightly. No individual is identifiable.
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function Bar({ pct, color }: { pct: number; color: string; tone?: "dark" | "light" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

function Legend({ label, color }: { label: string; color: string }) {
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function SignalCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-surface-ink-foreground/10 bg-surface-ink-foreground/5 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">{label}</p>
      <p className="mt-2 font-display text-base font-semibold leading-snug">{value}</p>
    </div>
  );
}

function FilterPill<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="bg-transparent text-xs font-medium focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
