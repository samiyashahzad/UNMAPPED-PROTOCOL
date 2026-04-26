import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { SocialAuthButtons } from "@/components/SocialAuthButtons";
import { toast } from "sonner";

export const Route = createFileRoute("/signup/youth")({
  head: () => ({
    meta: [
      { title: "Youth signup — UNMAPPED" },
      { name: "description", content: "Create a youth account to build your UNMAPPED." },
    ],
  }),
  component: YouthSignup,
});

function YouthSignup() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: { display_name: displayName, account_type: "youth" },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Welcome!");
    navigate({ to: "/onboarding" });
  }

  return (
    <AuthCard
      title="Create your skill passport"
      subtitle="For youth — get matched to opportunities based on your real skills."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-medium underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your name</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
          />
        </label>
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
            minLength={8}
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
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <SocialAuthButtons accountType="youth" />
      <p className="mt-4 text-xs text-muted-foreground">
        Are you a policymaker?{" "}
        <Link to="/signup/policymaker" className="underline">
          Apply for a policymaker account
        </Link>
      </p>
    </AuthCard>
  );
}