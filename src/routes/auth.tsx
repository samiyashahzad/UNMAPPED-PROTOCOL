import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — UNMAPPED" },
      { name: "description", content: "Sign in to your UNMAPPED account." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.user) return;
    // Lookup profile to decide where to land
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type, status")
      .eq("id", data.user.id)
      .maybeSingle();
    if (profile?.status === "pending") {
      navigate({ to: "/pending" });
    } else if (profile?.account_type === "admin") {
      navigate({ to: "/admin" });
    } else if (profile?.account_type === "policymaker") {
      navigate({ to: "/policymaker" });
    } else {
      navigate({ to: "/onboarding" });
    }
  }

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to continue your skill passport journey."
      footer={
        <>
          New here?{" "}
          <Link to="/signup/youth" className="font-medium underline">
            Create youth account
          </Link>{" "}
          ·{" "}
          <Link to="/signup/policymaker" className="font-medium underline">
            Policymaker
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-lg bg-foreground text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <SocialAuthButtons accountType="youth" />
    </AuthCard>
  );
}