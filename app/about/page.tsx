"use client";

import Link from "next/link";

const JYNX_GREEN = "#1F8A5B";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#ffffff", color: "#111111" }}>
      {/* Nav (same as landing) */}
      <header className="sticky top-0 z-10 flex items-center px-6 h-16" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
        <div className="flex-1 flex justify-start">
          <Link href="/about" className="text-[13px] font-semibold transition" style={{ color: "rgba(17,17,17,0.80)" }}>
            About
          </Link>
        </div>
        <Link href="/" className="flex items-center justify-center">
          <img src="/jynx-logo.png" alt="Jynx" className="h-8" style={{ objectFit: "contain" }} />
        </Link>
        <div className="flex-1 flex justify-end items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.50)" }}>
            Log in
          </Link>
          <Link href="/sign-up" className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition hover:opacity-85" style={{ background: JYNX_GREEN, color: "white" }}>
            Sign up
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-20 pb-32">
        <div className="max-w-2xl w-full">
          {/* Page heading */}
          <h1 className="text-[38px] font-bold leading-tight mb-3" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
            About Jynx
          </h1>
          <p className="text-[16px] leading-relaxed mb-16" style={{ color: "rgba(17,17,17,0.45)" }}>
            A quiet corner of your day, built to help you think clearly and act with intention.
          </p>

          {/* The problem */}
          <section className="mb-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(17,17,17,0.35)" }}>
              The problem
            </h2>
            <div className="space-y-4">
              {problems.map((p) => (
                <div key={p.title} className="rounded-xl p-5 border" style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.018)" }}>
                  <div className="text-[15px] font-semibold mb-1" style={{ color: "rgba(17,17,17,0.88)" }}>{p.title}</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: "rgba(17,17,17,0.45)" }}>{p.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Our philosophy */}
          <section className="mb-14">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(17,17,17,0.35)" }}>
              Our philosophy
            </h2>
            <div className="space-y-5">
              {philosophy.map((p) => (
                <div key={p.title} className="flex items-start gap-4">
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
          </section>

          {/* CTA */}
          <div className="rounded-2xl p-8 border text-center" style={{ borderColor: "rgba(0,0,0,0.07)", background: "rgba(0,0,0,0.018)" }}>
            <div className="text-[18px] font-semibold mb-2" style={{ color: "#111111" }}>Want to try it?</div>
            <div className="text-[13px] mb-5" style={{ color: "rgba(17,17,17,0.45)" }}>No commitment. No complexity. Just a better way to plan your day.</div>
            <Link href="/sign-up" className="inline-block rounded-full px-5 py-2 text-[13px] font-semibold transition hover:opacity-85" style={{ background: JYNX_GREEN, color: "white" }}>
              Get started free
            </Link>
          </div>
        </div>
      </main>

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

const problems = [
  {
    title: "Overwhelm from fragmented tools",
    desc: "Between calendars, to-do apps, notes, and group chats, it's easy to lose sight of what actually needs your attention today.",
  },
  {
    title: "Mental load keeps climbing",
    desc: "Carrying everything in your head — deadlines, priorities, commitments — drains energy before the day even starts.",
  },
  {
    title: "Productivity without peace",
    desc: "Most tools optimize for output. Few consider how you feel at the end of the day. Busy isn't the same as purposeful.",
  },
];

const philosophy = [
  {
    title: "Structure without rigidity",
    desc: "A good plan bends. Jynx lets you build structure that adapts when life changes — without making you feel like you've failed.",
  },
  {
    title: "Clarity without pressure",
    desc: "Knowing what to do next shouldn't feel stressful. Jynx surfaces your priorities gently, at the right moment, without guilt.",
  },
  {
    title: "Quiet by design",
    desc: "We believe less noise leads to better decisions. Jynx is intentionally minimal — showing you only what matters, when it matters.",
  },
];
