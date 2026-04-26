import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type, status")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (profile?.status === "pending") navigate({ to: "/pending" });
      else if (profile?.account_type === "admin") navigate({ to: "/admin" });
      else if (profile?.account_type === "policymaker") navigate({ to: "/policymaker" });
      else navigate({ to: "/onboarding" });
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Signing you in…
    </div>
  );
}