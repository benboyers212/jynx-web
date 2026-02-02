"use client";

import Link from "next/link";
import { useTheme } from "./ThemeContext";

const JYNX_GREEN = "#1F8A5B";

export default function LandingPage() {
  const { dark } = useTheme();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: dark ? "#0f0f0f" : "#f7f8fa", color: dark ? "#f0f0f0" : "#111111" }}>
      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "780px",
          background: dark
            ? "radial-gradient(ellipse at center, rgba(31,138,91,0.12) 0%, rgba(31,138,91,0.04) 35%, transparent 68%)"
            : "radial-gradient(ellipse at center, rgba(31,138,91,0.09) 0%, rgba(31,138,91,0.03) 35%, transparent 68%)",
          filter: "blur(48px)",
          opacity: dark ? 0.5 : 1,
        }}
      />

      {/* Top Ribbon (Sticky Navigation) */}
      <header
        className="relative z-10 sticky top-0 flex items-center justify-between px-6 h-16"
        style={{
          background: dark ? "rgba(15,15,15,0.88)" : "rgba(247,248,250,0.88)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Left: Logo */}
        <Link href="/" className="flex items-center">
          <img src={dark ? "/jynx-logo-dark.png" : "/jynx-logo.png"} alt="Jynx" className="h-7" style={{ objectFit: "contain" }} />
        </Link>

        {/* Center: Navigation Links */}
        <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-6">
          <Link href="#how-it-works" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
            How it works
          </Link>
          <Link href="#product" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
            Product
          </Link>
          <Link href="#pricing" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
            Pricing
          </Link>
          <Link href="/about" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
            About
          </Link>
        </nav>

        {/* Right: Auth Controls */}
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-[13px] font-medium transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(17,17,17,0.50)" }}>
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-full px-4 py-1.5 text-[13px] font-semibold transition hover:opacity-85"
            style={{ background: JYNX_GREEN, color: "white" }}
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: "88vh", paddingTop: "10vh", paddingBottom: "8vh" }}>
        <div className="max-w-2xl">
          <h1
            className="text-[52px] sm:text-[68px] font-bold leading-[1.1] mb-6"
            style={{ color: dark ? "#f0f0f0" : "#111111", letterSpacing: "-0.03em" }}
          >
            Your time.<br />
            <span style={{ color: JYNX_GREEN }}>Your life.</span>
          </h1>

          <p className="text-[17px] leading-relaxed mb-8 mx-auto max-w-xl" style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(17,17,17,0.50)" }}>
            Jynx learns how you work, builds a schedule around your life, and quietly adapts as you do. Stop stressing about what's next and start living.
          </p>

          {/* CTA Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
            <Link
              href="/sign-up"
              className="inline-block rounded-full px-8 py-3.5 text-[14px] font-semibold transition hover:opacity-85"
              style={{ background: JYNX_GREEN, color: "white", boxShadow: "0 6px 28px rgba(31,138,91,0.30)" }}
            >
              Get started free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-block rounded-full px-8 py-3.5 text-[14px] font-semibold transition hover:bg-opacity-80 border"
              style={{
                borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
                background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                color: dark ? "rgba(240,240,240,0.85)" : "rgba(17,17,17,0.85)",
              }}
            >
              See how it works
            </Link>
          </div>

          {/* Trust Microcopy */}
          <p className="text-[12px] mb-2" style={{ color: dark ? "rgba(240,240,240,0.35)" : "rgba(17,17,17,0.32)" }}>
            No credit card. Cancel anytime.
          </p>
          <p className="text-[11px]" style={{ color: dark ? "rgba(240,240,240,0.28)" : "rgba(17,17,17,0.26)" }}>
            Private by default.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 px-6 py-20" style={{ minHeight: "50vh" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-center mb-2" style={{ color: dark ? "rgba(240,240,240,0.35)" : "rgba(17,17,17,0.28)" }}>
            How it works
          </h2>
          <p className="text-center text-[14px] mb-14 mx-auto max-w-md" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(17,17,17,0.38)" }}>
            A schedule that gets clearer with you, not louder.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {howCards.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl p-6 border text-center"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  boxShadow: dark ? "0 4px 28px rgba(0,0,0,0.30)" : "0 4px 28px rgba(0,0,0,0.045)",
                }}
              >
                <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 mx-auto" style={{ background: dark ? "rgba(31,138,91,0.12)" : "rgba(31,138,91,0.08)" }}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke={JYNX_GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={c.icon} />
                  </svg>
                </div>
                <div className="text-[15px] font-semibold mb-2" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)" }}>{c.title}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.45)" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="relative z-10 px-6 py-20" style={{ minHeight: "40vh" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[28px] font-bold mb-6" style={{ color: dark ? "rgba(240,240,240,0.92)" : "rgba(17,17,17,0.92)", letterSpacing: "-0.02em" }}>
            Planning should not feel like a second job.
          </h2>

          <p className="text-[16px] leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.65)" : "rgba(17,17,17,0.60)" }}>
            You rebuild your schedule every week and it still falls apart. You stay busy but never feel caught up. Most tools either overwhelm you with options or ignore how you actually live. Jynx is different.
          </p>
        </div>
      </section>

      {/* Why Jynx Is Different */}
      <section className="relative z-10 px-6 py-20" style={{ minHeight: "50vh" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16">
            {/* Left: Problems */}
            <div>
              <h3 className="text-[18px] font-semibold mb-6" style={{ color: dark ? "rgba(240,240,240,0.85)" : "rgba(17,17,17,0.80)" }}>
                What drains you
              </h3>
              <div className="space-y-4">
                {problemPoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-2" style={{ background: dark ? "rgba(240,240,240,0.30)" : "rgba(17,17,17,0.30)" }} />
                    <p className="text-[15px] leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.65)" : "rgba(17,17,17,0.60)" }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Solutions */}
            <div>
              <h3 className="text-[18px] font-semibold mb-6" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)" }}>
                What Jynx does
              </h3>
              <div className="space-y-4">
                {promisePoints.map((p, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full shrink-0 mt-2" style={{ background: JYNX_GREEN }} />
                    <p className="text-[15px] leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.75)" : "rgba(17,17,17,0.70)" }}>{p}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Pillars */}
      <section id="product" className="relative z-10 px-6 py-20" style={{ minHeight: "70vh" }}>
        <div className="max-w-5xl mx-auto space-y-20">
          {productPillars.map((pillar, i) => (
            <div key={pillar.title} className="grid md:grid-cols-2 gap-12 items-center">
              {/* Text */}
              <div className={i % 2 === 1 ? "md:order-2" : ""}>
                <h3 className="text-[26px] font-bold mb-5" style={{ color: dark ? "rgba(240,240,240,0.92)" : "rgba(17,17,17,0.92)", letterSpacing: "-0.02em" }}>
                  {pillar.title}
                </h3>
                <div className="space-y-3 mb-6">
                  {pillar.benefits.map((benefit, idx) => (
                    <p key={idx} className="text-[15px] leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(17,17,17,0.65)" }}>
                      {benefit}
                    </p>
                  ))}
                </div>
                <Link href={pillar.link} className="text-[13px] font-semibold transition hover:opacity-70" style={{ color: JYNX_GREEN }}>
                  {pillar.linkText} →
                </Link>
              </div>

              {/* Placeholder Image */}
              <div className={i % 2 === 1 ? "md:order-1" : ""}>
                <div
                  className="rounded-2xl border overflow-hidden"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    background: dark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.60)",
                    aspectRatio: "4/3",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center" style={{ color: dark ? "rgba(240,240,240,0.20)" : "rgba(17,17,17,0.15)" }}>
                    <div className="text-center">
                      <svg className="mx-auto mb-3" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                      </svg>
                      <div className="text-[12px] font-medium">{pillar.screenshotDesc}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust & Privacy */}
      <section className="relative z-10 px-6 py-20" style={{ minHeight: "38vh" }}>
        <div
          className="max-w-3xl mx-auto text-center rounded-3xl p-10 border"
          style={{
            borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
            background: dark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.60)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: dark ? "0 8px 48px rgba(0,0,0,0.40)" : "0 8px 48px rgba(0,0,0,0.06)",
          }}
        >
          <h2 className="text-[22px] font-bold mb-10" style={{ color: dark ? "rgba(240,240,240,0.92)" : "rgba(17,17,17,0.92)" }}>
            Built for trust.
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {trustPoints.map((point, i) => (
              <div key={i} className="text-center">
                <p className="text-[14px] leading-relaxed font-medium" style={{ color: dark ? "rgba(240,240,240,0.75)" : "rgba(17,17,17,0.70)" }}>
                  {point}
                </p>
              </div>
            ))}
          </div>

          <p className="text-[12px]" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(17,17,17,0.35)" }}>
            Made for students first, built for everyone.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 py-20" style={{ minHeight: "40vh" }}>
        <div className="max-w-2xl mx-auto space-y-8">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h3 className="text-[16px] font-semibold mb-2" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)" }}>
                {faq.question}
              </h3>
              <p className="text-[15px] leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.65)" : "rgba(17,17,17,0.60)" }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section id="pricing" className="relative z-10 px-6 py-20" style={{ minHeight: "42vh" }}>
        <div
          className="max-w-xl mx-auto text-center rounded-3xl p-12 border"
          style={{
            borderColor: dark ? "rgba(31,138,91,0.20)" : "rgba(31,138,91,0.16)",
            background: dark
              ? "linear-gradient(145deg, rgba(31,138,91,0.10) 0%, rgba(31,138,91,0.03) 100%)"
              : "linear-gradient(145deg, rgba(31,138,91,0.065) 0%, rgba(31,138,91,0.015) 100%)",
            boxShadow: dark ? "0 8px 48px rgba(31,138,91,0.12)" : "0 8px 48px rgba(31,138,91,0.07)",
          }}
        >
          <h2 className="text-[32px] font-bold mb-4" style={{ color: dark ? "rgba(240,240,240,0.95)" : "#111111", letterSpacing: "-0.02em" }}>
            Take back your time.
          </h2>
          <p className="text-[15px] mb-8" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
            Start free and build a schedule that feels like you.
          </p>
          <Link
            href="/sign-up"
            className="inline-block rounded-full px-8 py-3.5 text-[14px] font-semibold transition hover:opacity-85 mb-3"
            style={{ background: JYNX_GREEN, color: "white", boxShadow: "0 4px 20px rgba(31,138,91,0.28)" }}
          >
            Get started free
          </Link>
          <p className="text-[12px]" style={{ color: dark ? "rgba(240,240,240,0.35)" : "rgba(17,17,17,0.32)" }}>
            No credit card. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            {/* Product */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-4" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.40)" }}>
                Product
              </div>
              <div className="space-y-2.5">
                <Link href="#how-it-works" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  How it works
                </Link>
                <Link href="/" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  Schedule
                </Link>
                <Link href="/groups" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  Groups
                </Link>
                <Link href="/my-time" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  My Time
                </Link>
              </div>
            </div>

            {/* Company */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-4" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.40)" }}>
                Company
              </div>
              <div className="space-y-2.5">
                <Link href="#" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  Our story
                </Link>
                <Link href="/about" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  About
                </Link>
                <Link href="#" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  Careers
                </Link>
              </div>
            </div>

            {/* Legal */}
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide mb-4" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.40)" }}>
                Legal
              </div>
              <div className="space-y-2.5">
                <Link href="#" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  Privacy
                </Link>
                <Link href="#" className="block text-[13px] transition hover:opacity-60" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(17,17,17,0.50)" }}>
                  Terms
                </Link>
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-start justify-start md:justify-end">
              <Link href="/">
                <img src={dark ? "/jynx-logo-dark.png" : "/jynx-logo.png"} alt="Jynx" className="h-6" style={{ objectFit: "contain", opacity: 0.35 }} />
              </Link>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-center pt-8 border-t" style={{ borderColor: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
            <div className="text-[11px]" style={{ color: dark ? "rgba(240,240,240,0.30)" : "rgba(17,17,17,0.28)" }}>
              © 2026 Jynx
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// How it works cards
const howCards = [
  {
    title: "Learns how you work",
    desc: "Your preferences and routines shape how Jynx plans.",
    icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  },
  {
    title: "Builds your schedule",
    desc: "A realistic plan that fits your classes, work, and life.",
    icon: "M3 4h18v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4zM16 2V6M8 2v4M3 10h18",
  },
  {
    title: "Adapts to your habits",
    desc: "When your week changes, your schedule keeps up.",
    icon: "M22 12h-4l-3 9L9 3l-3 9H2",
  },
];

// Problem points
const problemPoints = [
  "Rebuilding plans that don't stick",
  "Feeling behind even when you're busy",
  "Tools that add tasks instead of clarity",
];

// Promise points
const promisePoints = [
  "One place to plan without overplanning",
  "A schedule that stays realistic when life shifts",
  "Insights that guide, not guilt",
];

// Product pillars
const productPillars = [
  {
    title: "A schedule that fits real life.",
    benefits: [
      "Create a schedule quickly, then refine it as you go.",
      "Keep your fixed commitments solid and your flexible time flexible.",
    ],
    linkText: "Explore Schedule",
    link: "/",
    screenshotDesc: "Weekly calendar view with clean timeline",
  },
  {
    title: "Coordinate with people without the chaos.",
    benefits: [
      "Propose meeting times and see what works without texting back and forth.",
      "Keep group planning separate from the rest of your life.",
    ],
    linkText: "Explore Groups",
    link: "/groups",
    screenshotDesc: "Group availability interface",
  },
  {
    title: "Honest insights. Zero judgment.",
    benefits: [
      "See where your time goes in a way that feels calm and clear.",
      "Notice patterns and adjust your week without pressure.",
    ],
    linkText: "Explore My Time",
    link: "/my-time",
    screenshotDesc: "Intentional minutes breakdown",
  },
];

// Trust points
const trustPoints = [
  "Private by default. Your schedule is yours.",
  "Start free. No credit card required.",
  "Designed to reduce stress, not add tasks.",
];

// FAQs
const faqs = [
  {
    question: "Do I need to connect my calendar?",
    answer: "No. Jynx works on its own, but you can sync your calendar if you want to pull in existing events.",
  },
  {
    question: "Is my data private?",
    answer: "Yes. Your schedule and personal data stay private. We do not sell your information or show you ads.",
  },
  {
    question: "What does 'free' mean?",
    answer: "Free means free. Sign up, create your schedule, and use the core features at no cost. No credit card required.",
  },
];
