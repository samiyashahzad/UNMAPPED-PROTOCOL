import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Briefcase, Pencil, Plus, Save, Shield, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/jobs")({
  head: () => ({
    meta: [
      { title: "Admin · Manage jobs" },
      { name: "description", content: "Add and manage jobs available across the platform." },
    ],
  }),
  component: JobsPage,
});

const JOB_CATEGORIES = ["Formal job", "Gig", "Freelance", "Training", "Fellowship"];

interface Country {
  id: string;
  name: string;
}

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

function JobsPage() {
  const { hasRole, loading, user } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[]>([]);
  const [jobs, setJobs] = useState<AdminJob[]>([]);

  const [jCategory, setJCategory] = useState(JOB_CATEGORIES[0]);
  const [jTitle, setJTitle] = useState("");
  const [jCompany, setJCompany] = useState("");
  const [jCity, setJCity] = useState("");
  const [jCountry, setJCountry] = useState("");
  const [jWage, setJWage] = useState("");
  const [jContact, setJContact] = useState("");
  const [jDescription, setJDescription] = useState("");
  const [savingJob, setSavingJob] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Partial<AdminJob>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    const [{ data: countryRows }, { data: jobRows }] = await Promise.all([
      supabase.from("countries").select("id,name").order("name"),
      supabase.from("admin_jobs").select("*").order("created_at", { ascending: false }),
    ]);
    setCountries((countryRows as Country[]) ?? []);
    setJobs((jobRows as AdminJob[]) ?? []);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!hasRole("admin")) {
      navigate({ to: "/" });
      toast.error("Admin access required");
      return;
    }
    load();
  }, [loading, user, hasRole, navigate, load]);

  async function addJob(e: FormEvent) {
    e.preventDefault();
    if (!jTitle.trim() || !jCompany.trim() || !jCity.trim() || !jCountry || !jWage.trim() || !jContact.trim()) {
      toast.error("Please fill every required field");
      return;
    }
    setSavingJob(true);
    const { error } = await supabase.from("admin_jobs").insert({
      category: jCategory,
      title: jTitle.trim(),
      company: jCompany.trim(),
      city: jCity.trim(),
      country: jCountry,
      wage_range: jWage.trim(),
      employer_contact: jContact.trim(),
      description: jDescription.trim() || null,
      created_by: user?.id,
    });
    setSavingJob(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Posted “${jTitle.trim()}”`);
    setJTitle("");
    setJCompany("");
    setJCity("");
    setJWage("");
    setJContact("");
    setJDescription("");
    load();
  }

  async function deleteJob(id: string, title: string) {
    if (!confirm(`Remove “${title}”?`)) return;
    const { error } = await supabase.from("admin_jobs").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Job removed");
    load();
  }

  function startEdit(j: AdminJob) {
    setEditingId(j.id);
    setEdit({
      category: j.category,
      title: j.title,
      company: j.company,
      city: j.city,
      country: j.country,
      wage_range: j.wage_range,
      employer_contact: j.employer_contact,
      description: j.description ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEdit({});
  }

  async function saveEdit(id: string) {
    if (
      !edit.title?.toString().trim() ||
      !edit.company?.toString().trim() ||
      !edit.city?.toString().trim() ||
      !edit.country ||
      !edit.wage_range?.toString().trim() ||
      !edit.employer_contact?.toString().trim()
    ) {
      toast.error("Please fill every required field");
      return;
    }
    setSavingEdit(true);
    const { error } = await supabase
      .from("admin_jobs")
      .update({
        category: edit.category,
        title: edit.title!.toString().trim(),
        company: edit.company!.toString().trim(),
        city: edit.city!.toString().trim(),
        country: edit.country,
        wage_range: edit.wage_range!.toString().trim(),
        employer_contact: edit.employer_contact!.toString().trim(),
        description: edit.description?.toString().trim() || null,
      })
      .eq("id", id);
    setSavingEdit(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Job updated");
    cancelEdit();
    load();
  }

  if (loading || !user) {
    return <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin · Jobs</h1>
      </div>
      <AdminTabs active="jobs" />

      {countries.length === 0 && (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          No countries yet — <Link to="/admin/countries" className="underline">add one</Link> before posting a job.
        </p>
      )}

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold tracking-tight">Post a job</h2>
        </div>
        <form className="mt-4 grid gap-3" onSubmit={addJob}>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={jCategory}
              onChange={(e) => setJCategory(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              {JOB_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={jCountry}
              onChange={(e) => setJCountry(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            >
              <option value="">Select country…</option>
              {countries.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <input
            value={jTitle}
            onChange={(e) => setJTitle(e.target.value)}
            placeholder="Job title"
            maxLength={120}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <input
            value={jCompany}
            onChange={(e) => setJCompany(e.target.value)}
            placeholder="Company hiring"
            maxLength={120}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={jCity}
              onChange={(e) => setJCity(e.target.value)}
              placeholder="City"
              maxLength={80}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
            <input
              value={jWage}
              onChange={(e) => setJWage(e.target.value)}
              placeholder="Wage range (e.g. KES 40k–60k/mo)"
              maxLength={80}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>
          <input
            value={jContact}
            onChange={(e) => setJContact(e.target.value)}
            placeholder="Employer ID or email"
            maxLength={160}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <textarea
            value={jDescription}
            onChange={(e) => setJDescription(e.target.value)}
            placeholder="Short description (optional)"
            maxLength={500}
            rows={3}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <Button type="submit" disabled={savingJob} className="rounded-full">
            <Plus className="mr-1 h-3.5 w-3.5" />
            {savingJob ? "Posting…" : "Post job"}
          </Button>
        </form>
      </section>

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-display text-lg font-semibold tracking-tight">Posted jobs</h2>
        {jobs.length === 0 ? (
          <p className="mt-3 text-xs italic text-muted-foreground">No jobs posted yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {jobs.map((j) => (
              <li key={j.id} className="py-3">
                {editingId === j.id ? (
                  <div className="grid gap-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={edit.category as string}
                        onChange={(e) => setEdit((s) => ({ ...s, category: e.target.value }))}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                      >
                        {JOB_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <select
                        value={edit.country as string}
                        onChange={(e) => setEdit((s) => ({ ...s, country: e.target.value }))}
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                      >
                        <option value="">Select country…</option>
                        {countries.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      value={(edit.title as string) ?? ""}
                      onChange={(e) => setEdit((s) => ({ ...s, title: e.target.value }))}
                      placeholder="Job title"
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                    />
                    <input
                      value={(edit.company as string) ?? ""}
                      onChange={(e) => setEdit((s) => ({ ...s, company: e.target.value }))}
                      placeholder="Company hiring"
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        value={(edit.city as string) ?? ""}
                        onChange={(e) => setEdit((s) => ({ ...s, city: e.target.value }))}
                        placeholder="City"
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                      />
                      <input
                        value={(edit.wage_range as string) ?? ""}
                        onChange={(e) => setEdit((s) => ({ ...s, wage_range: e.target.value }))}
                        placeholder="Wage range"
                        className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                      />
                    </div>
                    <input
                      value={(edit.employer_contact as string) ?? ""}
                      onChange={(e) => setEdit((s) => ({ ...s, employer_contact: e.target.value }))}
                      placeholder="Employer ID or email"
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                    />
                    <textarea
                      value={(edit.description as string) ?? ""}
                      onChange={(e) => setEdit((s) => ({ ...s, description: e.target.value }))}
                      placeholder="Short description (optional)"
                      rows={2}
                      className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={cancelEdit} className="rounded-full">
                        <X className="mr-1 h-3.5 w-3.5" /> Cancel
                      </Button>
                      <Button type="button" size="sm" disabled={savingEdit} onClick={() => saveEdit(j.id)} className="rounded-full">
                        <Save className="mr-1 h-3.5 w-3.5" />
                        {savingEdit ? "Saving…" : "Save changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-sm font-semibold leading-snug">{j.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {j.company} · {j.city}, {j.country}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        <span className="rounded-full bg-muted px-2 py-0.5">{j.category}</span>
                        <span>· {j.wage_range}</span>
                        <span>· {j.employer_contact}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        onClick={() => startEdit(j)}
                        aria-label={`Edit ${j.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteJob(j.id, j.title)}
                        aria-label={`Remove ${j.title}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AdminTabs({ active }: { active: "accounts" | "jobs" | "countries" }) {
  const base = "rounded-full px-4 py-1.5 text-xs font-medium";
  const on = "bg-foreground text-background";
  const off = "border border-border text-muted-foreground hover:bg-muted";
  return (
    <div className="mb-2 mt-4 flex flex-wrap gap-2">
      <Link to="/admin" className={`${base} ${active === "accounts" ? on : off}`}>Accounts</Link>
      <Link to="/admin/jobs" className={`${base} ${active === "jobs" ? on : off}`}>Jobs</Link>
      <Link to="/admin/countries" className={`${base} ${active === "countries" ? on : off}`}>Countries</Link>
    </div>
  );
}