"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const JYNX_GREEN = "#1F8A5B";

export function MarketingNav() {
  const pathname = usePathname();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "How It Works", href: "/how-it-works" },
    { label: "Our Story", href: "/our-story" },
    { label: "Pricing", href: "/pricing" },
  ];

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-8 h-16"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
      }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <img
          src="/jynx-logo.png"
          alt="Jynx"
          className="h-7"
          style={{ objectFit: "contain" }}
        />
      </Link>

      {/* Center Navigation */}
      <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[13px] font-medium transition hover:opacity-60"
            style={{
              color:
                pathname === link.href
                  ? "rgba(17,17,17,0.85)"
                  : "rgba(17,17,17,0.50)",
            }}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Right: Auth Controls */}
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-[13px] font-medium transition hover:opacity-60"
          style={{ color: "rgba(17,17,17,0.55)" }}
        >
          Log in
        </Link>
        <Link
          href="/sign-up"
          className="rounded-full px-5 py-2 text-[13px] font-semibold transition hover:opacity-85"
          style={{
            background: JYNX_GREEN,
            color: "white",
            boxShadow: "0 2px 8px rgba(31,138,91,0.18)",
          }}
        >
          Get started free
        </Link>
      </div>
    </header>
  );
}
