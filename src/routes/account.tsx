import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Briefcase, Camera, KeyRound, LogOut, Mail, Save, Trash2, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — UNMAPPED" },
      {
        name: "description",
        content:
          "Manage your profile picture, education level, password, and review the opportunities you applied for.",
      },
    ],
  }),
  component: AccountPage,
});

const EDUCATION_OPTIONS = [
  "No formal schooling",
  "Primary",
  "Junior secondary",
  "Senior secondary",
  "Vocational / TVET",
  "Diploma / Certificate",
  "Bachelor's degree",
  "Master's degree or higher",
];

interface ApplicationRow {
  id: string;
  opportunity_id: string;
  opportunity_title: string;
  employer: string;
  opportunity_type: string;
  created_at: string;
}

interface ProfileExtras {
  avatar_url: string | null;
  education_level: string | null;
}

function AccountPage() {
  const { user, profile, loading, refresh, signOut } = useAuth();
  const navigate = useNavigate();

  const [extras, setExtras] = useState<ProfileExtras>({ avatar_url: null, education_level: null });
  const [displayName, setDisplayName] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Redirect unauthenticated users to /auth
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  // Load extended profile fields and applications
  useEffect(() => {
    if (!user) return;
    setDisplayName(profile?.display_name ?? "");

    supabase
      .from("profiles")
      .select("avatar_url, education_level")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExtras(data as ProfileExtras);
          setEducationLevel(data.education_level ?? "");
        }
      });

    setLoadingApps(true);
    supabase
      .from("applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        setLoadingApps(false);
        if (error) {
          toast.error("Could not load applications", { description: error.message });
          return;
        }
        setApplications((data as ApplicationRow[]) ?? []);
      });
  }, [user, profile?.display_name]);

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-4xl px-4 pt-16 sm:px-6">
        <p className="text-sm text-muted-foreground">Loading your account…</p>
      </main>
    );
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large", { description: "Please choose an image under 5 MB." });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setUploading(false);
      toast.error("Upload failed", { description: upErr.message });
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    setUploading(false);
    if (updErr) {
      toast.error("Could not save avatar", { description: updErr.message });
      return;
    }
    setExtras((s) => ({ ...s, avatar_url: url }));
    toast.success("Profile picture updated");
  }

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingInfo(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        education_level: educationLevel || null,
      })
      .eq("id", user.id);
    setSavingInfo(false);
    if (error) {
      toast.error("Could not save profile", { description: error.message });
      return;
    }
    setExtras((s) => ({ ...s, education_level: educationLevel || null }));
    await refresh();
    toast.success("Profile saved");
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password too short", { description: "Use at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error("Could not update password", { description: error.message });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated");
  }

  async function handleWithdraw(id: string) {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) {
      toast.error("Could not withdraw", { description: error.message });
      return;
    }
    setApplications((rows) => rows.filter((r) => r.id !== id));
    toast.success("Application withdrawn");
  }

  const initial = (displayName || user.email || "?").charAt(0).toUpperCase();

  return (
    <main className="pb-20">
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6 sm:pt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          My account
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Update your basic info, profile picture, and password — and review every opportunity
          you've applied for.
        </p>

        {/* Header card */}
        <motion.section
          layout
          className="mt-6 overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-elevated)]"
          style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
        >
          <div className="flex flex-wrap items-center gap-5 p-6">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-surface-ink-foreground/10 font-display text-3xl font-bold">
                {extras.avatar_url ? (
                  <img src={extras.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Change profile picture"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md hover:bg-muted disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
                Youth account
              </p>
              <p className="font-display text-xl font-semibold leading-snug">
                {displayName || user.email}
              </p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-surface-ink-foreground/70">
                <Mail className="h-3 w-3" /> {user.email}
              </p>
            </div>
            <button
              onClick={() => signOut().then(() => navigate({ to: "/" }))}
              className="inline-flex items-center gap-1 rounded-full border border-surface-ink-foreground/20 px-3 py-1.5 text-xs font-medium text-surface-ink-foreground/80 hover:bg-surface-ink-foreground/10"
            >
              <LogOut className="h-3 w-3" /> Sign out
            </button>
          </div>
        </motion.section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {/* Basic info */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold tracking-tight">Basic info</h2>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSaveInfo}>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Display name
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Education level
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                >
                  <option value="">Select…</option>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={savingInfo} className="rounded-full">
                <Save className="mr-1 h-3.5 w-3.5" />
                {savingInfo ? "Saving…" : "Save changes"}
              </Button>
            </form>
          </section>

          {/* Password */}
          <section className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold tracking-tight">Change password</h2>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleChangePassword}>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  required
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                  placeholder="Repeat password"
                />
              </div>
              <Button type="submit" disabled={changingPassword} className="rounded-full">
                {changingPassword ? "Updating…" : "Update password"}
              </Button>
            </form>
          </section>
        </div>

        {/* Applications */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Jobs you applied for
              </h2>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {applications.length} total
            </span>
          </div>

          {loadingApps ? (
            <p className="mt-4 text-sm text-muted-foreground">Loading…</p>
          ) : applications.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-paper p-6 text-center">
              <p className="text-sm text-muted-foreground">
                You haven't applied to anything yet.
              </p>
              <Link
                to="/opportunities"
                className="mt-3 inline-flex rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-90"
              >
                Browse opportunities
              </Link>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {applications.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-display text-sm font-semibold leading-snug">
                      {a.opportunity_title}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.employer}</p>
                    <div className="mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                      <span className="rounded-full bg-muted px-2 py-0.5">{a.opportunity_type}</span>
                      <span>· {new Date(a.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWithdraw(a.id)}
                    aria-label="Withdraw application"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}