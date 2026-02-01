"use client";

import Link from "next/link";

const JYNX_GREEN = "#1F8A5B";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff", color: "#111111" }}>
      {/* Top nav */}
      <header className="sticky top-0 z-10 flex items-center px-6 h-16" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        {/* Left spacer (mirrors right actions width) */}
        <div className="flex-1 flex justify-start">
          <Link href="/about" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.50)" }}>
            About
          </Link>
        </div>

        {/* Center: logo */}
        <Link href="/" className="flex items-center justify-center">
          <img src="/jynx-logo.png" alt="Jynx" className="h-8" style={{ objectFit: "contain" }} />
        </Link>

        {/* Right: auth actions */}
        <div className="flex-1 flex justify-end items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.50)" }}>
            Log in
          </Link>
          <Link href="/sign-up" className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition hover:opacity-85" style={{ background: JYNX_GREEN, color: "white" }}>
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-28">
        <div className="max-w-2xl">
          <h1 className="text-[44px] sm:text-[54px] font-bold leading-tight mb-5" style={{ color: "#111111", letterSpacing: "-0.025em" }}>
            Organize time<br />
            <span style={{ color: JYNX_GREEN }}>intentionally.</span>
          </h1>
          <p className="text-[17px] leading-relaxed mb-8 mx-auto max-w-lg" style={{ color: "rgba(17,17,17,0.48)" }}>
            Jynx helps you reduce mental load, stay consistent, and build a daily rhythm that actually works — without the noise.
          </p>
          <Link href="/sign-up" className="inline-block rounded-full px-7 py-3 text-[14px] font-semibold transition hover:opacity-85" style={{ background: JYNX_GREEN, color: "white", boxShadow: "0 4px 16px rgba(31,138,91,0.30)" }}>
            Get started
          </Link>
        </div>
      </section>

      {/* What Jynx does */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-center mb-10" style={{ color: "rgba(17,17,17,0.35)" }}>
            What Jynx does
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {whatCards.map((c) => (
              <div key={c.title} className="rounded-2xl p-6 border" style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.018)" }}>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(31,138,91,0.09)" }}>
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke={JYNX_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.icon} />
                  </svg>
                </div>
                <div className="text-[15px] font-semibold mb-1.5" style={{ color: "rgba(17,17,17,0.88)" }}>{c.title}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: "rgba(17,17,17,0.45)" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Jynx */}
      <section className="px-6 pb-28">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-6" style={{ color: "rgba(17,17,17,0.35)" }}>
            Why Jynx
          </h2>
          <div className="space-y-6">
            {whyPoints.map((p) => (
              <div key={p.title} className="flex items-start gap-4 text-left">
                <div className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center mt-0.5" style={{ background: "rgba(31,138,91,0.12)" }}>
                  <div className="h-2 w-2 rounded-full" style={{ background: JYNX_GREEN }} />
                </div>
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: "rgba(17,17,17,0.88)" }}>{p.title}</div>
                  <div className="text-[13px] leading-relaxed mt-0.5" style={{ color: "rgba(17,17,17,0.45)" }}>{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-24">
        <div className="max-w-xl mx-auto text-center rounded-3xl p-10 border" style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.018)" }}>
          <h2 className="text-[24px] font-bold mb-2.5" style={{ color: "#111111" }}>
            Ready to start?
          </h2>
          <p className="text-[14px] mb-6" style={{ color: "rgba(17,17,17,0.45)" }}>
            It only takes a minute to set up. No credit card needed.
          </p>
          <Link href="/sign-up" className="inline-block rounded-full px-6 py-2.5 text-[14px] font-semibold transition hover:opacity-85" style={{ background: JYNX_GREEN, color: "white" }}>
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/">
            <img src="/jynx-logo.png" alt="Jynx" className="h-5" style={{ objectFit: "contain", opacity: 0.35 }} />
          </Link>
          <div className="text-[11px]" style={{ color: "rgba(17,17,17,0.30)" }}>
            © 2026 Jynx. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// SVG path data for simple icons
const whatCards = [
  {
    title: "Intentional scheduling",
    desc: "Build your day around what matters, not around what's loud. Jynx keeps priorities visible so nothing slips.",
    icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01", // list icon
  },
  {
    title: "Groups & accountability",
    desc: "Stay aligned with the people you work or study with. Share schedules, set shared goals, and keep each other on track.",
    icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", // users icon
  },
  {
    title: "Personal clarity",
    desc: "A calm daily check-in that helps you reflect, adjust, and move through your day with less friction and more focus.",
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", // shield icon
  },
];

const whyPoints = [
  {
    title: "Calm productivity",
    desc: "No aggressive notifications, no guilt loops. Jynx is designed to help you do more by stressing less.",
  },
  {
    title: "Less noise, more intention",
    desc: "Strip away the clutter. See what you need to see, when you need to see it — nothing more.",
  },
  {
    title: "Structure without rigidity",
    desc: "Life changes. Jynx adapts with you. Reschedule, reprioritize, and keep moving without starting over.",
  },
];
