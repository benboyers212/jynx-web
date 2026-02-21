"use client";

import Link from "next/link";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

const JYNX_GREEN = "#1F8A5B";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#ffffff" }}
    >
      <MarketingNav />

      {/* Hero Section - Full Screen Height */}
      <section
        className="flex-1 flex flex-col items-center justify-center text-center px-6"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        <div className="max-w-2xl">
          {/* Headline */}
          <h1
            className="text-[64px] sm:text-[72px] font-bold leading-[1.05] mb-6"
            style={{
              color: "#111111",
              letterSpacing: "-0.03em",
            }}
          >
            Your time.
            <br />
            <span style={{ color: JYNX_GREEN }}>Your life.</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-[18px] leading-relaxed mb-10 mx-auto max-w-xl"
            style={{ color: "rgba(17,17,17,0.52)" }}
          >
            Jynx learns how you work, builds a schedule around your life, and
            quietly adapts as you do.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/sign-up"
              className="inline-block rounded-full px-8 py-3.5 text-[14px] font-semibold transition hover:opacity-88"
              style={{
                background: JYNX_GREEN,
                color: "white",
                boxShadow: "0 4px 20px rgba(31,138,91,0.24)",
              }}
            >
              Get started free
            </Link>
            <Link
              href="/how-it-works"
              className="inline-block rounded-full px-8 py-3.5 text-[14px] font-semibold transition hover:bg-opacity-75 border"
              style={{
                borderColor: "rgba(0,0,0,0.12)",
                background: "rgba(0,0,0,0.02)",
                color: "rgba(17,17,17,0.80)",
              }}
            >
              See how it works
            </Link>
          </div>

          {/* Trust Microcopy */}
          <p
            className="text-[12px]"
            style={{ color: "rgba(17,17,17,0.36)" }}
          >
            No credit card. Cancel anytime. Private by default.
          </p>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
