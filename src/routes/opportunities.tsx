import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Check, GraduationCap, MapPin, Plus, Sparkles, Target, TrendingUp, Wallet, Lock, Mail } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useActiveProfile } from "@/lib/profile-store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/data/passport";
import { useAgentResponse } from "@/lib/agent-response";
import { EconometricSignals } from "@/components/EconometricSignals";

interface AdminJob {
  id: string;
  category: string;
  title: string;
  company: string;
  city: string;
  country: string;
  wage_range: string;
  employer_contact: string;
  description: string | null;
  created_at: string;
}

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — UNMAPPED" },
      {
        name: "description",
        content:
          "Matched jobs, gigs, freelance work, training, and fellowships — with real wage ranges and reach indicators.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

const TYPES: Opportunity["type"][] = ["Formal job", "Gig", "Freelance", "Training", "Fellowship"];

const REACH_TONE: Record<Opportunity["reach"], { bg: string; fg: string }> = {
  "Within reach": { bg: "var(--risk-low)", fg: "var(--risk-low-foreground)" },
  Stretch: { bg: "var(--risk-medium)", fg: "var(--risk-medium-foreground)" },
  Aspirational: { bg: "var(--risk-high)", fg: "var(--risk-high-foreground)" },
};

const TYPE_ICON: Record<Opportunity["type"], typeof Briefcase> = {
  "Formal job": Briefcase,
  Gig: Target,
  Freelance: Sparkles,
  Training: GraduationCap,
  Fellowship: Wallet,
};

function OpportunitiesPage() {
  const { passport } = useActiveProfile();
  const agent = useAgentResponse();
  const [filter, setFilter] = useState<Opportunity["type"] | "All">("All");
  const { user, loading, hasRole } = useAuth();
  const isAdmin = hasRole("admin");
  const navigate = useNavigate();
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [adminJobs, setAdminJobs] = useState<AdminJob[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>("All");

  useEffect(() => {
    if (!user) {
      setAppliedIds(new Set());
      return;
    }
    supabase
      .from("applications")
      .select("opportunity_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setAppliedIds(new Set(data.map((r) => r.opportunity_id)));
      });
  }, [user]);

  // Load admin-posted jobs (visible to everyone, including signed-out visitors)
  useEffect(() => {
    supabase
      .from("admin_jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setAdminJobs(data as AdminJob[]);
      });
  }, []);

  async function handleApply(o: Opportunity) {
    if (loading) return;
    if (!user) {
      toast.info("Sign in to apply", {
        description: "Create an account or sign in to apply for opportunities.",
      });
      navigate({ to: "/auth" });
      return;
    }
    if (appliedIds.has(o.id)) return;
    setSubmittingId(o.id);
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      opportunity_id: o.id,
      opportunity_title: o.title,
      employer: o.employer,
      opportunity_type: o.type,
    });
    setSubmittingId(null);
    if (error) {
      toast.error("Could not submit application", { description: error.message });
      return;
    }
    setAppliedIds((s) => new Set(s).add(o.id));
    toast.success("Application submitted", {
      description: `“${o.title}” at ${o.employer} added to your account.`,
    });
  }

  async function handleApplyAdminJob(j: AdminJob) {
    if (loading) return;
    if (!user) {
      toast.info("Sign in to apply", { description: "Create an account or sign in to apply." });
      navigate({ to: "/auth" });
      return;
    }
    const oid = `admin-${j.id}`;
    if (appliedIds.has(oid)) return;
    setSubmittingId(oid);
    const { error } = await supabase.from("applications").insert({
      user_id: user.id,
      opportunity_id: oid,
      opportunity_title: j.title,
      employer: j.company,
      opportunity_type: j.category,
    });
    setSubmittingId(null);
    if (error) {
      toast.error("Could not submit application", { description: error.message });
      return;
    }
    setAppliedIds((s) => new Set(s).add(oid));
    toast.success("Application submitted", {
      description: `“${j.title}” at ${j.company} added to your account.`,
    });
  }

  const visible = useMemo(
    () =>
      passport.opportunities
        .filter((o) => filter === "All" || o.type === filter)
        .sort((a, b) => (isAdmin ? 0 : b.matchScore - a.matchScore)),
    [filter, passport.opportunities, isAdmin]
  );

  const visibleAdminJobs = useMemo(() => {
    return adminJobs
      .filter((j) => countryFilter === "All" || j.country === countryFilter)
      .filter((j) => filter === "All" || j.category === filter);
  }, [adminJobs, countryFilter, filter]);

  const countries = useMemo(
    () => Array.from(new Set(adminJobs.map((j) => j.country))).sort(),
    [adminJobs]
  );

  // ── Matched opportunities ──────────────────────────────────────────────
  // Score each admin job against the user's formal skills (from the agent
  // assessment). A skill counts as "matched" if it appears as a whole word
  // inside the job's title / category / description. Missing skills are the
  // job-derived keywords the user does not yet have. Risk level reflects how
  // confident the match is.
  interface MatchedJob {
    job: AdminJob;
    matchPercent: number;
    matchedSkills: string[];
    missingSkills: string[];
    riskLevel: "Low" | "Medium" | "High";
  }

  const matchedJobs = useMemo<MatchedJob[]>(() => {
    const userSkills = (agent?.formal_skills ?? []).map((s) => s.trim()).filter(Boolean);
    if (userSkills.length === 0 || adminJobs.length === 0) return [];

    const STOPWORDS = new Set([
      "and","or","the","a","an","of","for","to","with","in","on","at","by",
      "is","are","be","as","from","into","via","using","you","we","our","your",
      "will","can","must","should","this","that","these","those","job","role",
      "work","experience","required","preferred","strong","good","ability",
    ]);
    const tokenize = (text: string): string[] =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s+#./-]/g, " ")
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 2 && !STOPWORDS.has(w));

    const containsWord = (haystack: string, needle: string) =>
      new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(haystack);

    return adminJobs
      .map<MatchedJob>((job) => {
        const haystack = `${job.title} ${job.category} ${job.description ?? ""}`;
        const jobKeywords = Array.from(new Set(tokenize(haystack)));

        const matched = userSkills.filter((s) => containsWord(haystack, s));
        const userSkillTokens = new Set(
          userSkills.flatMap((s) => tokenize(s))
        );
        const missing = jobKeywords
          .filter((k) => !userSkillTokens.has(k))
          .slice(0, 6)
          .map((k) => k.charAt(0).toUpperCase() + k.slice(1));

        const denom = Math.max(jobKeywords.length, userSkills.length, 1);
        const rawPercent = Math.round((matched.length / denom) * 100);
        // Boost so a few real overlaps still feel meaningful
        const matchPercent = Math.min(
          100,
          matched.length === 0 ? 0 : Math.max(rawPercent, matched.length * 18)
        );

        const riskLevel: MatchedJob["riskLevel"] =
          matchPercent >= 65 ? "Low" : matchPercent >= 35 ? "Medium" : "High";

        return { job, matchPercent, matchedSkills: matched, missingSkills: missing, riskLevel };
      })
      .filter((m) => m.matchPercent > 0)
      .sort((a, b) => b.matchPercent - a.matchPercent)
      .slice(0, 6);
  }, [agent?.formal_skills, adminJobs]);

  const RISK_TONE: Record<MatchedJob["riskLevel"], { bg: string; fg: string }> = {
    Low: { bg: "var(--risk-low)", fg: "var(--risk-low-foreground)" },
    Medium: { bg: "var(--risk-medium)", fg: "var(--risk-medium-foreground)" },
    High: { bg: "var(--risk-high)", fg: "var(--risk-high-foreground)" },
  };

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          {isAdmin ? "Admin · All opportunities" : "Module 03 · Opportunity matching"}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          {isAdmin ? "Every opportunity, all countries." : "Grounded, not aspirational."}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          {isAdmin
            ? "Browse every posted opportunity across all countries. Use filters to narrow by type or country."
            : `Every card shows wage range, sector growth, and how attainable it really is for you in ${passport.country}.`}
        </p>

        {isAdmin && (
          <div className="mt-5">
            <Link
              to="/admin/jobs"
              className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add opportunity
            </Link>
          </div>
        )}

        {/* Econometric signals from the agent — context for opportunity decisions */}
        {!isAdmin && agent?.econometric_signals && agent.econometric_signals.length > 0 && (
          <div className="mt-6">
            <EconometricSignals
              signals={agent.econometric_signals}
              title="Labor market signals · ILO ILOSTAT"
            />
          </div>
        )}

        {/* Filter chips */}
        <div className="mt-6 flex flex-wrap gap-2">
          {(["All", ...TYPES] as const).map((t) => {
            const active = filter === t;
            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: active ? "var(--surface-ink)" : "var(--card)",
                  color: active ? "var(--surface-ink-foreground)" : "var(--muted-foreground)",
                  borderColor: active ? "var(--surface-ink)" : "var(--border)",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {isAdmin && countries.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Country
            </span>
            {(["All", ...countries]).map((c) => {
              const active = countryFilter === c;
              return (
                <button
                  key={c}
                  onClick={() => setCountryFilter(c)}
                  className="rounded-full border px-3 py-1 text-[11px] font-medium transition-colors"
                  style={{
                    background: active ? "var(--surface-ink)" : "var(--card)",
                    color: active ? "var(--surface-ink-foreground)" : "var(--muted-foreground)",
                    borderColor: active ? "var(--surface-ink)" : "var(--border)",
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {/* Matched opportunities — based on user skills vs posted jobs */}
        {!isAdmin && user && matchedJobs.length > 0 && (
          <>
            <h2 className="mt-8 font-display text-lg font-semibold tracking-tight">
              Matched opportunities
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ranked by overlap between your skills and posted jobs.
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {matchedJobs.map((m, i) => {
                const oid = `admin-${m.job.id}`;
                const applied = appliedIds.has(oid);
                const tone = RISK_TONE[m.riskLevel];
                return (
                  <motion.article
                    key={`match-${m.job.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {m.job.category} · {m.job.company}
                        </p>
                        <h3 className="font-display text-base font-semibold leading-tight">
                          {m.job.title}
                        </h3>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {m.job.city}, {m.job.country}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Match
                        </p>
                        <p className="font-display text-2xl font-semibold leading-none">
                          {m.matchPercent}%
                        </p>
                        <span
                          className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          {m.riskLevel} risk
                        </span>
                      </div>
                    </div>

                    {/* Match progress bar */}
                    <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${m.matchPercent}%` }}
                        transition={{ duration: 0.6, delay: i * 0.05 }}
                        className="h-full rounded-full"
                        style={{ background: tone.bg }}
                      />
                    </div>

                    {m.matchedSkills.length > 0 && (
                      <div className="mt-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Skills you have
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.matchedSkills.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
                            >
                              <Check className="h-3 w-3" /> {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.missingSkills.length > 0 && (
                      <div className="mt-3 rounded-2xl border border-dashed border-border bg-background p-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          Skills you're lacking
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.missingSkills.map((g) => (
                            <span
                              key={g}
                              className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-foreground"
                            >
                              + {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{m.job.wage_range}</p>
                      <Button
                        onClick={() => handleApplyAdminJob(m.job)}
                        disabled={loading || submittingId === oid || applied}
                        size="sm"
                        className="rounded-full"
                        variant={applied ? "secondary" : "default"}
                      >
                        {applied ? (
                          <><Check className="mr-1 h-3.5 w-3.5" /> Applied</>
                        ) : (
                          submittingId === oid ? "Submitting…" : "Apply now"
                        )}
                      </Button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </>
        )}

        {/* All admin-posted jobs */}
        {visibleAdminJobs.length > 0 && (
          <>
            <h2 className="mt-8 font-display text-lg font-semibold tracking-tight">
              All posted opportunities
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {visibleAdminJobs.map((j, i) => {
                const oid = `admin-${j.id}`;
                const applied = appliedIds.has(oid);
                return (
                  <motion.article
                    key={j.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {j.category}
                        </p>
                        <h3 className="font-display text-base font-semibold leading-tight">
                          {j.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">{j.company}</p>
                      </div>
                    </div>
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {j.city}, {j.country}
                    </p>
                    <div className="mt-3 rounded-2xl bg-muted/60 px-4 py-3">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Wage range
                      </p>
                      <p className="font-display text-base font-semibold">{j.wage_range}</p>
                    </div>
                    {j.description && (
                      <p className="mt-3 text-xs leading-snug text-muted-foreground">{j.description}</p>
                    )}
                    <p className="mt-3 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Mail className="h-3 w-3" /> {j.employer_contact}
                    </p>
                    {!isAdmin && (
                      <div className="mt-4 flex items-center justify-end">
                        <Button
                          onClick={() => handleApplyAdminJob(j)}
                          disabled={loading || submittingId === oid || applied}
                          size="sm"
                          className="rounded-full"
                          variant={applied ? "secondary" : "default"}
                        >
                          {applied ? (
                            <><Check className="mr-1 h-3.5 w-3.5" /> Applied</>
                          ) : user ? (
                            submittingId === oid ? "Submitting…" : "Apply now"
                          ) : (
                            "Sign in to apply"
                          )}
                        </Button>
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </div>
          </>
        )}

        {/* Demo / matched cards — hidden for admins and signed-out visitors */}
        {!isAdmin && user && (
          <>
            <h2 className="mt-8 font-display text-lg font-semibold tracking-tight">
              Matched for you
            </h2>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {visible.map((o, i) => {
            const Icon = TYPE_ICON[o.type];
            const reach = REACH_TONE[o.reach];
            return (
              <motion.article
                key={o.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {o.type}
                      </p>
                      <h3 className="font-display text-base font-semibold leading-tight">
                        {o.title}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Match
                    </p>
                    <p className="font-display text-xl font-semibold">{o.matchScore}</p>
                  </div>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{o.employer}</p>

                {/* Wage */}
                <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/60 px-4 py-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      Wage range · ILOSTAT
                    </p>
                    <p className="font-display text-base font-semibold">{o.wageRange}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ background: reach.bg, color: reach.fg }}
                  >
                    {o.reach}
                  </span>
                </div>

                {/* Econometric signals */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-border/70 bg-surface-paper p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em]">
                        Sector growth
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-semibold">{o.sectorGrowth}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-surface-paper p-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Wallet className="h-3 w-3" />
                      <p className="font-mono text-[9px] uppercase tracking-[0.18em]">
                        Wage floor
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-semibold">{o.wageFloor}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs leading-snug text-muted-foreground">
                  <span className="font-semibold text-foreground">Why matched: </span>
                  {o.whyMatched}
                </p>

                {o.skillGap && o.skillGap.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-background p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                      What would get you there
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {o.skillGap.map((g) => (
                        <span
                          key={g}
                          className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-medium text-foreground"
                        >
                          + {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between gap-3">
                    {!user && !loading && (
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Sign in required
                      </p>
                    )}
                    <Button
                      onClick={() => handleApply(o)}
                      disabled={loading || submittingId === o.id || appliedIds.has(o.id)}
                      size="sm"
                      className="ml-auto rounded-full"
                      variant={appliedIds.has(o.id) ? "secondary" : "default"}
                    >
                      {appliedIds.has(o.id) ? (
                        <><Check className="mr-1 h-3.5 w-3.5" /> Applied</>
                      ) : user ? (
                        submittingId === o.id ? "Submitting…" : "Apply now"
                      ) : (
                        "Sign in to apply"
                      )}
                    </Button>
                </div>
              </motion.article>
            );
              })}
            </div>
          </>
        )}

        {((isAdmin && visibleAdminJobs.length === 0) || (!isAdmin && visible.length === 0 && visibleAdminJobs.length === 0)) && (
          <p className="mt-12 text-center text-sm text-muted-foreground">
            No opportunities of this type for your profile yet.
          </p>
        )}
      </div>
    </main>
  );
}