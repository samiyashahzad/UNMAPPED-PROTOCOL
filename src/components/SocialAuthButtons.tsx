import { useState } from "react";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";

export function SocialAuthButtons({ accountType }: { accountType: "youth" | "policymaker" }) {
  const [loading, setLoading] = useState<"google" | "apple" | null>(null);

  async function handle(provider: "google" | "apple") {
    setLoading(provider);
    try {
      // Pass account_type via state so the trigger can read it (for new users only).
      // For OAuth, account_type comes from the user's signup intent path.
      sessionStorage.setItem("dsp.intendedAccountType", accountType);
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin + "/auth/callback",
      });
      if (result.error) {
        toast.error(result.error.message ?? "Sign-in failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => handle("google")}
        disabled={loading !== null}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {loading === "google" ? "Connecting…" : "Continue with Google"}
      </button>
      <button
        type="button"
        onClick={() => handle("apple")}
        disabled={loading !== null}
        className="flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-card text-sm font-medium hover:bg-muted disabled:opacity-50"
      >
        {loading === "apple" ? "Connecting…" : "Continue with Apple"}
      </button>
    </div>
  );
}