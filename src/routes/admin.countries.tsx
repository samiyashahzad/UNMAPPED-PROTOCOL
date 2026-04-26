import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Globe2, Plus, Shield, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/countries")({
  head: () => ({
    meta: [
      { title: "Admin · Manage countries" },
      { name: "description", content: "Add countries available across the platform." },
    ],
  }),
  component: CountriesPage,
});

interface Country {
  id: string;
  name: string;
  region: string | null;
  iso_code: string | null;
}

function CountriesPage() {
  const { hasRole, loading, user } = useAuth();
  const navigate = useNavigate();

  const [countries, setCountries] = useState<Country[]>([]);
  const [cName, setCName] = useState("");
  const [cRegion, setCRegion] = useState("");
  const [cIso, setCIso] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from("countries").select("*").order("name");
    setCountries((data as Country[]) ?? []);
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

  async function addCountry(e: FormEvent) {
    e.preventDefault();
    if (!cName.trim()) {
      toast.error("Country name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("countries").insert({
      name: cName.trim(),
      region: cRegion.trim() || null,
      iso_code: cIso.trim().toUpperCase() || null,
      created_by: user?.id,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Added ${cName.trim()}`);
    setCName("");
    setCRegion("");
    setCIso("");
    load();
  }

  async function deleteCountry(id: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    const { error } = await supabase.from("countries").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Removed ${name}`);
    load();
  }

  if (loading || !user) {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6"><p className="text-sm text-muted-foreground">Loading…</p></div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin · Countries</h1>
      </div>
      <AdminTabs active="countries" />

      <section className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2">
          <Globe2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold tracking-tight">Add country</h2>
        </div>
        <form className="mt-4 grid gap-3" onSubmit={addCountry}>
          <input
            value={cName}
            onChange={(e) => setCName(e.target.value)}
            placeholder="Country name (e.g. Kenya)"
            maxLength={80}
            className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={cRegion}
              onChange={(e) => setCRegion(e.target.value)}
              placeholder="Region (optional)"
              maxLength={80}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
            <input
              value={cIso}
              onChange={(e) => setCIso(e.target.value)}
              placeholder="ISO code (e.g. KE)"
              maxLength={3}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
            />
          </div>
          <Button type="submit" disabled={saving} className="rounded-full">
            <Plus className="mr-1 h-3.5 w-3.5" />
            {saving ? "Adding…" : "Add country"}
          </Button>
        </form>

        <ul className="mt-5 divide-y divide-border">
          {countries.length === 0 ? (
            <li className="py-3 text-xs italic text-muted-foreground">No countries yet.</li>
          ) : (
            countries.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                    {c.iso_code ? `${c.iso_code} · ` : ""}{c.region ?? "—"}
                  </p>
                </div>
                <button
                  onClick={() => deleteCountry(c.id, c.name)}
                  aria-label={`Remove ${c.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))
          )}
        </ul>
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