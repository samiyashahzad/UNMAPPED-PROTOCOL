import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, LogOut, Shield, User as UserIcon, UserCircle } from "lucide-react";
import { loadActiveRegion } from "@/lib/profile-store";
import type { Region } from "@/data/passport";
import { useAuth } from "@/hooks/use-auth";

const NAV = [
  { to: "/onboarding", label: "Onboarding", hideForAdmin: true },
  { to: "/profile", label: "Skills Profile", hideForAdmin: true },
  { to: "/readiness", label: "AI Readiness", hideForAdmin: true },
  { to: "/opportunities", label: "Opportunities", hideForAdmin: false },
  { to: "/policymaker", label: "Policymaker", hideForAdmin: false },
  { to: "/config", label: "Config", hideForAdmin: false },
] as const;

export function AppHeader() {
  const { location } = useRouterState();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<Region>("Sub-Saharan Africa");
  const { user, profile, hasRole, signOut } = useAuth();
  const handleSignOut = () => {
    signOut().then(() => navigate({ to: "/" }));
  };
  const isAdmin = hasRole("admin");
  const visibleNav = NAV.filter((item) => !(isAdmin && item.hideForAdmin));

  useEffect(() => {
    setRegion(loadActiveRegion());
    const sync = () => setRegion(loadActiveRegion());
    window.addEventListener("dsp:region", sync as EventListener);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("dsp:region", sync as EventListener);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/70 backdrop-blur"
      style={{ background: "color-mix(in oklab, var(--background) 85%, transparent)" }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold ring-1 ring-offset-2 ring-offset-background"
            style={{
              background: "var(--gradient-ink)",
              color: "var(--surface-ink-foreground)",
              boxShadow: "var(--shadow-stamp)",
              ["--tw-ring-color" as never]: "color-mix(in oklab, var(--surface-ink) 30%, transparent)",
            }}
          >
            U
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold tracking-tight">
              UNMAPPED
            </span>
            <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              {region}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {visibleNav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full px-3 py-1.5 text-xs font-semibold text-foreground bg-muted",
              }}
            >
              {item.label}
            </Link>
          ))}
          {hasRole("admin") ? (
            <Link
              to="/admin"
              className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full px-3 py-1.5 text-xs font-semibold text-foreground bg-muted",
              }}
            >
              <span className="inline-flex items-center gap-1"><Shield className="h-3 w-3" /> Admin</span>
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link
                to="/account"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs hover:bg-muted"
              >
                <UserIcon className="h-3 w-3" />
                {profile?.display_name ?? user.email}
              </Link>
              <button
                onClick={handleSignOut}
                className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-medium hover:bg-muted"
              >
                <LogOut className="h-3 w-3" /> Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 lg:inline-flex"
            >
              Sign in
            </Link>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-card/90 lg:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col p-2">
            {visibleNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeProps={{
                  className:
                    "rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground bg-muted",
                }}
              >
                {item.label}
              </Link>
            ))}
            {hasRole("admin") ? (
              <Link to="/admin" className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                Admin
              </Link>
            ) : null}
            <div className="mt-2 border-t border-border pt-2">
              {user ? (
                <>
                  <Link
                    to="/account"
                    className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <span className="inline-flex items-center gap-1.5"><UserCircle className="h-3.5 w-3.5" /> My account</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Sign out ({profile?.display_name ?? user.email})
                  </button>
                </>
              ) : (
                <Link to="/auth" className="block rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}