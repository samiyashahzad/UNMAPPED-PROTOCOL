import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuth, type Profile } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, X, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin — Approval queue" },
      { name: "description", content: "Review and approve policymaker accounts." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { hasRole, loading, user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Profile[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const load = useCallback(async () => {
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (tab === "pending") query = query.eq("status", "pending");
    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((data ?? []) as Profile[]);
  }, [tab]);

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

  async function approve(p: Profile) {
    setBusy(p.id);
    const { error: e1 } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", p.id);
    if (e1) {
      toast.error(e1.message);
      setBusy(null);
      return;
    }
    const { error: e2 } = await supabase
      .from("user_roles")
      .insert({ user_id: p.id, role: p.account_type });
    setBusy(null);
    if (e2 && !e2.message.includes("duplicate")) {
      toast.error(e2.message);
      return;
    }
    toast.success(`Approved ${p.email}`);
    load();
  }

  async function reject(p: Profile) {
    setBusy(p.id);
    const { error } = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", p.id);
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Rejected ${p.email}`);
    load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-2 flex items-center gap-3">
        <Shield className="h-5 w-5" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin · Accounts</h1>
      </div>
      <div className="mb-6 flex gap-2">
        <Link
          to="/admin"
          className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background"
        >
          Accounts
        </Link>
        <Link
          to="/admin/jobs"
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Jobs
        </Link>
        <Link
          to="/admin/countries"
          className="rounded-full border border-border px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
        >
          Countries
        </Link>
      </div>
      <div className="mb-4 flex gap-2">
        {(["pending", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              tab === t
                ? "bg-foreground text-background"
                : "border border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t === "pending" ? "Pending policymakers" : "All accounts"}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No accounts to show.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{p.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.email}</td>
                  <td className="px-4 py-3 capitalize">{p.account_type}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === "pending" ? (
                      <div className="inline-flex gap-2">
                        <button
                          disabled={busy === p.id}
                          onClick={() => approve(p)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground px-3 text-xs font-medium text-background disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          disabled={busy === p.id}
                          onClick={() => reject(p)}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium hover:bg-muted disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: Profile["status"] }) {
  const map: Record<Profile["status"], string> = {
    pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    approved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    rejected: "bg-red-500/15 text-red-700 dark:text-red-300",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status]}`}>{status}</span>
  );
}