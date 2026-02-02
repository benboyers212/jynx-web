"use client";

import Link from "next/link";

const JYNX_GREEN = "#1F8A5B";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: "#f7f8fa", color: "#111111" }}>
      {/* Ambient glow — decorative light behind the hero */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "780px",
          background: "radial-gradient(ellipse at center, rgba(31,138,91,0.09) 0%, rgba(31,138,91,0.03) 35%, transparent 68%)",
          filter: "blur(48px)",
        }}
      />

      {/* Top nav */}
      <header
        className="relative z-10 sticky top-0 flex items-center justify-between px-6 h-16"
        style={{
          background: "rgba(247,248,250,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <nav className="flex items-center gap-6">
          <Link href="/" className="text-[13px] font-semibold transition hover:opacity-80" style={{ color: "rgba(17,17,17,0.75)" }}>
            Home
          </Link>
          <Link href="#" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.38)" }}>
            Our Story
          </Link>
          <Link href="/about" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.38)" }}>
            About
          </Link>
          <Link href="#" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.38)" }}>
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.50)" }}>
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition hover:opacity-85"
            style={{ background: JYNX_GREEN, color: "white" }}
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-24 pb-32">
        <div className="max-w-2xl">
          {/* Logo — prominent in the canvas */}
          <Link href="/" className="inline-flex justify-center mb-10">
            <img src="/jynx-logo.png" alt="Jynx" className="h-14" style={{ objectFit: "contain" }} />
          </Link>

          <h1
            className="text-[48px] sm:text-[62px] font-bold leading-tight mb-5"
            style={{ color: "#111111", letterSpacing: "-0.03em" }}
          >
            Your time.<br />
            <span style={{ color: JYNX_GREEN }}>Your life.</span>
          </h1>

          <p className="text-[17px] leading-relaxed mb-9 mx-auto max-w-lg" style={{ color: "rgba(17,17,17,0.46)" }}>
            Jynx learns how you work, builds a schedule around your life, and quietly adapts to your habits —
            so you can stop stressing about what's next and start living.
          </p>

          <Link
            href="/sign-up"
            className="inline-block rounded-full px-8 py-3.5 text-[14px] font-semibold transition hover:opacity-85"
            style={{ background: JYNX_GREEN, color: "white", boxShadow: "0 6px 28px rgba(31,138,91,0.30)" }}
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 pb-28">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-center mb-2" style={{ color: "rgba(17,17,17,0.28)" }}>
            How it works
          </h2>
          <p className="text-center text-[14px] mb-14 mx-auto max-w-md" style={{ color: "rgba(17,17,17,0.38)" }}>
            Jynx learns in the background and gets smarter every day.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {howCards.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl p-6 border"
                style={{
                  borderColor: "rgba(0,0,0,0.07)",
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: "0 4px 28px rgba(0,0,0,0.045)",
                }}
              >
                <div className="text-[11px] font-bold tracking-widest mb-4" style={{ color: JYNX_GREEN }}>
                  {c.step}
                </div>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "rgba(31,138,91,0.08)" }}>
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke={JYNX_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.icon} />
                  </svg>
                </div>
                <div className="text-[15px] font-semibold mb-1.5" style={{ color: "rgba(17,17,17,0.90)" }}>{c.title}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: "rgba(17,17,17,0.40)" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The difference */}
      <section className="relative z-10 px-6 pb-28">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-center mb-2" style={{ color: "rgba(17,17,17,0.28)" }}>
            The difference
          </h2>
          <p className="text-center text-[14px] mb-12 mx-auto max-w-md" style={{ color: "rgba(17,17,17,0.38)" }}>
            Most productivity tools add more to your plate. Jynx takes things off it.
          </p>

          <div className="space-y-3">
            {whyPoints.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl px-5 py-4.5 border"
                style={{
                  borderColor: "rgba(0,0,0,0.06)",
                  background: "rgba(255,255,255,0.60)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: JYNX_GREEN }} />
                  <div className="text-[15px] font-semibold" style={{ color: "rgba(17,17,17,0.90)" }}>{p.title}</div>
                </div>
                <div className="text-[13px] leading-relaxed pl-4" style={{ color: "rgba(17,17,17,0.40)" }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative z-10 px-6 pb-28">
        <div
          className="max-w-xl mx-auto text-center rounded-3xl p-12 border"
          style={{
            borderColor: "rgba(31,138,91,0.16)",
            background: "linear-gradient(145deg, rgba(31,138,91,0.065) 0%, rgba(31,138,91,0.015) 100%)",
            boxShadow: "0 8px 48px rgba(31,138,91,0.07)",
          }}
        >
          <h2 className="text-[26px] font-bold mb-2.5" style={{ color: "#111111", letterSpacing: "-0.02em" }}>
            Ready to take your<br />time back?
          </h2>
          <p className="text-[14px] mb-7" style={{ color: "rgba(17,17,17,0.40)" }}>
            Free to start. No credit card needed. Takes under a minute.
          </p>
          <Link
            href="/sign-up"
            className="inline-block rounded-full px-7 py-3 text-[14px] font-semibold transition hover:opacity-85"
            style={{ background: JYNX_GREEN, color: "white", boxShadow: "0 4px 20px rgba(31,138,91,0.28)" }}
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link href="/">
            <img src="/jynx-logo.png" alt="Jynx" className="h-5" style={{ objectFit: "contain", opacity: 0.28 }} />
          </Link>
          <div className="flex items-center gap-5">
            <Link href="#" className="text-[11px] transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.28)" }}>Privacy</Link>
            <Link href="#" className="text-[11px] transition hover:opacity-60" style={{ color: "rgba(17,17,17,0.28)" }}>Terms</Link>
          </div>
          <div className="text-[11px]" style={{ color: "rgba(17,17,17,0.24)" }}>
            © 2026 Jynx
          </div>
        </div>
      </footer>
    </div>
  );
}

const howCards = [
  {
    step: "01",
    title: "Learns how you work",
    desc: "Tell Jynx your goals, routines, and when you have the most energy. It maps your day around what actually matters to you.",
    icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z", // eye
  },
  {
    step: "02",
    title: "Builds your schedule",
    desc: "Jynx assembles a personalized schedule that fits your life — not a generic template. It reshapes as things change.",
    icon: "M3 4h18v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4zM16 2V6M8 2v4M3 10h18", // calendar
  },
  {
    step: "03",
    title: "Adapts to your habits",
    desc: "The more you use Jynx, the smarter it gets. It notices your patterns and quietly removes the stress of sticking to a plan.",
    icon: "M22 12h-4l-3 9L9 3l-3 9H2", // activity pulse
  },
];

const whyPoints = [
  {
    title: "Less stress, more flow",
    desc: "Jynx works quietly in the background so you don't have to think about what's next. It guides you through your day without nagging.",
  },
  {
    title: "Adapts to real life",
    desc: "Plans change. Jynx changes with them. It never punishes you for falling behind — it just helps you get back on track.",
  },
  {
    title: "Built around you, not a template",
    desc: "Everyone works differently. Jynx learns your rhythm over time and reshapes itself to match the way you actually live.",
  },
];
