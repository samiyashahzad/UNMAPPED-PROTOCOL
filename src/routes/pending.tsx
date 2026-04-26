import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthCard } from "@/components/AuthCard";

export const Route = createFileRoute("/pending")({
  head: () => ({
    meta: [
      { title: "Pending approval — UNMAPPED" },
      { name: "description", content: "Your policymaker account is awaiting admin approval." },
    ],
  }),
  component: PendingPage,
});

function PendingPage() {
  const { profile, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      navigate({ to: "/auth" });
    } else if (profile.status === "approved") {
      navigate({ to: profile.account_type === "admin" ? "/admin" : "/policymaker" });
    }
  }, [loading, profile, navigate]);

  return (
    <AuthCard
      title="Awaiting approval"
      subtitle="Your policymaker application is being reviewed."
    >
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p>
          Hi {profile?.display_name ?? profile?.email}, an administrator is reviewing your
          account. You'll get access to policymaker dashboards as soon as it's approved.
        </p>
        <p className="mt-3">Sign back in later to check status.</p>
      </div>
      <div className="mt-5 flex gap-2">
        <Link
          to="/"
          className="flex h-10 flex-1 items-center justify-center rounded-lg border border-border text-sm hover:bg-muted"
        >
          Back home
        </Link>
        <button
          onClick={() => signOut().then(() => navigate({ to: "/" }))}
          className="flex h-10 flex-1 items-center justify-center rounded-lg bg-foreground text-sm font-medium text-background hover:opacity-90"
        >
          Sign out
        </button>
      </div>
    </AuthCard>
  );
}