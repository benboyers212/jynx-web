"use client";

import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer
      className="px-8 py-12"
      style={{
        background: "rgba(247,248,250,1)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-8">
          {/* PRODUCT */}
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(17,17,17,0.38)" }}
            >
              Product
            </div>
            <div className="space-y-2.5">
              <Link
                href="/how-it-works"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                How it works
              </Link>
              <Link
                href="/"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                Schedule
              </Link>
              <Link
                href="/"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                Groups
              </Link>
              <Link
                href="/"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                My Time
              </Link>
            </div>
          </div>

          {/* COMPANY */}
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(17,17,17,0.38)" }}
            >
              Company
            </div>
            <div className="space-y-2.5">
              <Link
                href="/about"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                About
              </Link>
              <Link
                href="/our-story"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                Our Story
              </Link>
            </div>
          </div>

          {/* LEGAL */}
          <div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(17,17,17,0.38)" }}
            >
              Legal
            </div>
            <div className="space-y-2.5">
              <Link
                href="#"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                Privacy
              </Link>
              <Link
                href="#"
                className="block text-[13px] transition hover:opacity-60"
                style={{ color: "rgba(17,17,17,0.55)" }}
              >
                Terms
              </Link>
            </div>
          </div>

          {/* Right: Logo */}
          <div className="flex items-start justify-start md:justify-end">
            <Link href="/">
              <img
                src="/jynx-logo.png"
                alt="Jynx"
                className="h-6"
                style={{ objectFit: "contain", opacity: 0.28 }}
              />
            </Link>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div
          className="pt-6 border-t text-center text-[11px]"
          style={{
            borderColor: "rgba(0,0,0,0.05)",
            color: "rgba(17,17,17,0.32)",
          }}
        >
          © 2026 Jynx
        </div>
      </div>
    </footer>
  );
}
