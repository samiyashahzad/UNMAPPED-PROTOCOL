import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Compass, Globe2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import heroVideo from "@/assets/hero-job-apply.mp4.asset.json";
import { Guilloche } from "@/components/ornaments/Guilloche";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UNMAPPED — Labor intelligence for everyone" },
      {
        name: "description",
        content:
          "Translate informal experience into globally legible credentials. Country-agnostic infrastructure aligned to ISCO-08, ILOSTAT, and Wittgenstein Centre projections.",
      },
      { property: "og:title", content: "UNMAPPED" },
      {
        property: "og:description",
        content:
          "An honest assessment of skills, automation risk, and opportunity — calibrated for low- and middle-income economies.",
      },
    ],
  }),
  component: LandingPage,
});

const FLOW = [
  {
    step: "01",
    title: "Skills Signal Engine",
    body: "Tell us in your own words what you do. We translate it into ISCO-08 skills you can actually share.",
    href: "/onboarding",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "AI Readiness Lens",
    body: "An honest, calibrated view of which skills are at risk, which are durable, and which are emerging.",
    href: "/readiness",
    icon: ShieldCheck,
  },
  {
    step: "03",
    title: "Opportunity Match",
    body: "Real wage ranges, sector growth, and reach indicators — for jobs, gigs, training, and fellowships.",
    href: "/opportunities",
    icon: Compass,
  },
] as const;

function LandingPage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Slow the loop so it feels ambient, and make sure it autoplays on mount
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.75;
    const tryPlay = () => v.play().catch(() => {});
    tryPlay();
  }, []);

  // Interactive parallax: subtle scale + translate based on cursor position
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = heroRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: px, y: py });
  };

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  return (
    <main className="pb-20">
      {/* Hero */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative isolate overflow-hidden"
      >
        {/* Background video layer */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <video
            ref={videoRef}
            src={heroVideo.url}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="h-full w-full object-cover transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform: `scale(1.08) translate3d(${tilt.x * -16}px, ${tilt.y * -12}px, 0)`,
            }}
          />
          {/* Readability overlay tuned to the ink palette */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, color-mix(in oklab, var(--background) 78%, transparent) 0%, color-mix(in oklab, var(--background) 62%, transparent) 55%, var(--background) 100%)",
            }}
          />
          <div
            className="absolute inset-0 mix-blend-multiply opacity-60"
            style={{ background: "var(--gradient-ink)" }}
          />
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/80">
              Module 01–03 · Country-agnostic
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              The credential the
              <br />
              informal economy
              <br />
              never had.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Amara fixes phones in Accra. Riya tailors from a one-room studio in Dhaka.
              Both have skills the labour market refuses to read. The Digital Skill
              Passport translates informal experience into globally legible signals —
              calibrated honestly for the economies most workers actually live in.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {!user ? (
                <>
              <Link
                to="/signup/youth"
                className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[var(--shadow-elevated)]"
                style={{
                  background: "var(--gradient-ink)",
                  color: "var(--surface-ink-foreground)",
                }}
              >
                Create youth account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/signup/policymaker"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground hover:bg-muted"
              >
                <BarChart3 className="h-4 w-4" />
                Policymaker access
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Already have an account? Sign in
              </Link>
                </>
              ) : (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-[var(--shadow-elevated)]"
                  style={{
                    background: "var(--gradient-ink)",
                    color: "var(--surface-ink-foreground)",
                  }}
                >
                  Go to your passport <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div
            className="passport-edge relative overflow-hidden rounded-3xl border border-border p-6 shadow-[var(--shadow-elevated)]"
            style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
              style={{ backgroundImage: "var(--guilloche)" }}
            />
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-surface-ink-foreground/60">
                Live demo signal
              </p>
              <Globe2 className="h-4 w-4 text-surface-ink-foreground/60" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold leading-tight">
              "I fix broken phone screens and watch python tutorials on YouTube."
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["Hardware Diagnostics", "Python Scripting", "Customer Triage"].map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-surface-ink-foreground/20 bg-surface-ink-foreground/5 px-3 py-1 text-xs"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-surface-ink-foreground/5 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
                  ISCO match
                </p>
                <p className="mt-1 font-display text-lg font-semibold">3512</p>
              </div>
              <div className="rounded-2xl bg-surface-ink-foreground/5 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
                  Risk
                </p>
                <p className="mt-1 font-display text-lg font-semibold">Medium</p>
              </div>
              <div className="rounded-2xl bg-surface-ink-foreground/5 p-3">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-surface-ink-foreground/60">
                  Sector
                </p>
                <p className="mt-1 font-display text-lg font-semibold">+4.2%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flow */}
      <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6">
        <Guilloche className="mb-6" />
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            How the passport gets built
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Three modules · one flow
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {FLOW.map((f) => (
            <Link
              key={f.step}
              to={f.href}
              className="group flex flex-col rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="flex items-center justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "var(--gradient-ink)", color: "var(--surface-ink-foreground)" }}
                >
                  <f.icon className="h-4 w-4" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Step {f.step}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust footer */}
      <p className="mt-16 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Aligned to ISCO-08 · ILOSTAT · World Bank WDI · Wittgenstein Centre projections
      </p>
    </main>
  );
}
