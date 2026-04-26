import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard } from "@/components/AuthCard";
import { toast } from "sonner";

export const Route = createFileRoute("/signup/policymaker")({
  head: () => ({
    meta: [
      { title: "Policymaker signup — UNMAPPED" },
      { name: "description", content: "Apply for a policymaker account. Approval required." },
    ],
  }),
  component: PolicymakerSignup,
});

function PolicymakerSignup() {
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
        emailRedirectTo: window.location.origin + "/pending",
        data: { display_name: displayName, account_type: "policymaker" },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted. Awaiting admin approval.");
    navigate({ to: "/pending" });
  }

  return (
    <AuthCard
      title="Apply as a policymaker"
      subtitle="Your account will be reviewed by an administrator before access is granted."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/auth" className="font-medium underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-4 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Policymaker accounts require manual approval to protect aggregate data quality.
        You'll see a pending screen until an admin reviews your application.
      </div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Full name / Institution</span>
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-foreground"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Work email</span>
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
          {submitting ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </AuthCard>
  );
}