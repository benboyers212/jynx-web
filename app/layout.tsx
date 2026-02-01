"use client";

import { ClerkProvider } from "@clerk/nextjs";

import "./globals.css";
import Link from "next/link";
import { DM_Sans } from "next/font/google";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ChatPage from "./chat/page";
import FilesPage from "./files/page";
import ProfilePage from "./profile/page";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

// Keep brand olive, but use it subtly (accents only)
const OLIVE = "#4b5e3c";


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const [chatOpen, setChatOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [filesOpen, setFilesOpen] = useState(false);
  const [filesExpanded, setFilesExpanded] = useState(false);

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileExpanded, setProfileExpanded] = useState(false);

  // --- scroll-driven “quiet frame” header ---
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY || 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: "Schedule", href: "/" },
    { label: "My Time", href: "/my-time" },
    { label: "Groups", href: "/groups" },
  ];

  // Hide the layout shell on auth + onboarding routes
  const hideShell = useMemo(() => {
    const p = pathname || "/";
    return (
      p === "/login" ||
      p.startsWith("/login/") ||
      p === "/signup" ||
      p.startsWith("/signup/") ||
      p === "/onboarding" ||
      p.startsWith("/onboarding/")
    );
  }, [pathname]);

  // Subtle header behavior (light theme)
  const headerT = useMemo(() => clamp(scrollY / 140, 0, 1), [scrollY]);
  const bgAlpha = lerp(0.92, 0.84, headerT);
  const borderAlpha = lerp(0.12, 0.08, headerT);
  const blurPx = lerp(10, 8, headerT);

  // ✅ Modal header button styling (keeps X + expand visible in light mode)
  const modalBtnClass =
    "h-8 w-8 rounded-lg border transition flex items-center justify-center";
  const modalBtnStyle: React.CSSProperties = {
    borderColor: "rgba(0,0,0,0.14)",
    color: "rgba(17,17,17,0.92)",
    background: "rgba(0,0,0,0.02)",
  };

  return (
    <ClerkProvider signInUrl="/login">
      <html lang="en" className={dmSans.variable}>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        {/* Light shell is now driven by globals.css tokens */}
        <body className="font-sans bg-[var(--background)] text-[var(--foreground)]">
          {!hideShell && (
            <div className="sticky top-0 z-40">
              {/* Header surface */}
              <div
                className="relative"
                style={{
                  borderBottom: `1px solid rgba(0,0,0,${borderAlpha})`,
                  background: `rgba(255,255,255,${bgAlpha})`,
                  backdropFilter: `blur(${blurPx}px)`,
                  WebkitBackdropFilter: `blur(${blurPx}px)`,
                }}
              >
                <div className="relative px-6">
                  <div className="h-16 flex items-center">
                    {/* Left: brand */}
                    <div className="flex items-center min-w-[220px]">
                      <img src="/jynx-logo.png" alt="Jynx" className="h-9" style={{ objectFit: "contain" }} />
                    </div>

                    {/* Center: tabs (Vercel-ish: text, active = bold + underline) */}
                    <div className="flex-1 hidden md:flex justify-center">
                      <nav className="flex items-center gap-6">
                        {navItems.map((t) => {
                          const active =
                            t.href === "/"
                              ? pathname === "/"
                              : pathname?.startsWith(t.href);

                          return (
                            <Link
                              key={t.href}
                              href={t.href}
                              className={cx(
                                "relative text-sm transition select-none",
                                active
                                  ? "font-semibold text-[var(--foreground)]"
                                  : "font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                              )}
                            >
                              {t.label}
                              <span
                                className={cx(
                                  "absolute left-0 -bottom-[10px] h-[2px] w-full rounded-full transition-opacity",
                                  active ? "opacity-100" : "opacity-0"
                                )}
                                style={{
                                  backgroundColor: OLIVE,
                                }}
                              />
                            </Link>
                          );
                        })}
                      </nav>
                    </div>

                    {/* Right: actions */}
                    <div className="min-w-[220px] ml-auto flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setFilesOpen(true);
                          setFilesExpanded(false);
                        }}
                        className="h-10 w-10 rounded-full border transition flex items-center justify-center"
                        style={{
                          borderColor: "rgba(0,0,0,0.10)",
                          background: "rgba(0,0,0,0.03)",
                        }}
                        title="Files"
                        aria-label="Files"
                      >
                        <FolderIcon className="h-5 w-5" />
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(true);
                          setProfileExpanded(false);
                        }}
                        className="h-10 w-10 rounded-full border transition flex items-center justify-center"
                        style={{
                          borderColor: "rgba(0,0,0,0.10)",
                          background: "rgba(0,0,0,0.03)",
                        }}
                        title="Profile"
                        aria-label="Profile"
                      >
                        <ProfileIcon className="h-5 w-5" />
                      </button>

                      <div
                        className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] ml-2"
                        style={{
                          borderColor: "rgba(0,0,0,0.10)",
                          background: "rgba(0,0,0,0.03)",
                          color: "rgba(17,17,17,0.70)",
                        }}
                      >
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: "rgba(16,185,129,0.85)" }}
                        />
                        UI shell
                      </div>
                    </div>
                  </div>

                  {/* Mobile tabs */}
                  <div className="md:hidden pb-3">
                    <nav className="flex items-center gap-5">
                      {navItems.map((t) => {
                        const active =
                          t.href === "/"
                            ? pathname === "/"
                            : pathname?.startsWith(t.href);

                        return (
                          <Link
                            key={t.href}
                            href={t.href}
                            className={cx(
                              "relative text-sm transition select-none",
                              active
                                ? "font-semibold text-[var(--foreground)]"
                                : "font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                            )}
                          >
                            {t.label}
                            <span
                              className={cx(
                                "absolute left-0 -bottom-[10px] h-[2px] w-full rounded-full transition-opacity",
                                active ? "opacity-100" : "opacity-0"
                              )}
                              style={{ backgroundColor: OLIVE }}
                            />
                          </Link>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Page content */}
          <div className={cx(!hideShell && "min-h-[calc(100vh-64px)]")}>
            {children}
          </div>

          {/* Floating chat button (hide on auth/onboarding) */}
          {!hideShell && (
            <button
              onClick={() => setChatOpen(true)}
              className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full border flex items-center justify-center transition"
              style={{
                borderColor: "rgba(0,0,0,0.14)",
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 18px 55px rgba(0,0,0,0.18)",
              }}
              aria-label="Open chat"
              title="Chat"
            >
              <span className="text-base" style={{ color: "rgba(17,17,17,0.9)" }}>
                💬
              </span>
            </button>
          )}

          {/* Files modal */}
          {filesOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={() => {
                  setFilesOpen(false);
                  setFilesExpanded(false);
                }}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div
                  className={cx(
                    "relative border shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col",
                    filesExpanded
                      ? "w-full h-full rounded-none"
                      : "w-[92vw] max-w-[1200px] h-[85vh] rounded-3xl"
                  )}
                  style={{
                    animation: "fadeScaleIn 220ms ease-out",
                    background: "var(--surface)",
                    borderColor: "rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    className="h-12 px-4 flex items-center border-b shrink-0"
                    style={{
                      borderColor: "rgba(0,0,0,0.10)",
                      color: "var(--foreground)",
                    }}
                  >
                    <div className="text-sm font-semibold">Files</div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setFilesExpanded((v) => !v)}
                        className={cx(modalBtnClass, "hover:bg-black/[0.04]")}
                        style={modalBtnStyle}
                        title={filesExpanded ? "Exit full screen" : "Full screen"}
                      >
                        ⛶
                      </button>

                      <button
                        onClick={() => {
                          setFilesOpen(false);
                          setFilesExpanded(false);
                        }}
                        className={cx(modalBtnClass, "hover:bg-black/[0.04]")}
                        style={modalBtnStyle}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden [&>main]:h-full [&>main]:min-h-0">
                    <FilesPage />
                  </div>
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeScaleIn {
                  from {
                    opacity: 0;
                    transform: scale(0.97);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}</style>
            </>
          )}

          {/* Profile modal (scrollable) */}
          {profileOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={() => {
                  setProfileOpen(false);
                  setProfileExpanded(false);
                }}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div
                  className={cx(
                    "relative border shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col",
                    profileExpanded
                      ? "w-full h-full rounded-none"
                      : "w-[92vw] max-w-[1000px] h-[80vh] rounded-3xl"
                  )}
                  style={{
                    animation: "fadeScaleIn 220ms ease-out",
                    background: "var(--surface)",
                    borderColor: "rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    className="h-12 px-4 flex items-center border-b shrink-0"
                    style={{
                      borderColor: "rgba(0,0,0,0.10)",
                      color: "var(--foreground)",
                    }}
                  >
                    <div className="text-sm font-semibold">Profile</div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setProfileExpanded((v) => !v)}
                        className={cx(modalBtnClass, "hover:bg-black/[0.04]")}
                        style={modalBtnStyle}
                        title={profileExpanded ? "Exit full screen" : "Full screen"}
                      >
                        ⛶
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setProfileExpanded(false);
                        }}
                        className={cx(modalBtnClass, "hover:bg-black/[0.04]")}
                        style={modalBtnStyle}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* modal body scroll container */}
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="[&>main]:h-auto [&>main]:min-h-0">
                      <ProfilePage />
                    </div>
                  </div>
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeScaleIn {
                  from {
                    opacity: 0;
                    transform: scale(0.97);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}</style>
            </>
          )}

          {/* Chat modal */}
          {chatOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/40 z-40 transition-opacity"
                onClick={() => {
                  setChatOpen(false);
                  setExpanded(false);
                }}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div
                  className={cx(
                    "relative border shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col",
                    expanded
                      ? "w-full h-full rounded-none"
                      : "w-[92vw] max-w-[1200px] h-[85vh] rounded-3xl scale-100 opacity-100"
                  )}
                  style={{
                    animation: "fadeScaleIn 220ms ease-out",
                    background: "var(--surface)",
                    borderColor: "rgba(0,0,0,0.12)",
                  }}
                >
                  <div
                    className="h-12 px-4 flex items-center border-b shrink-0"
                    style={{
                      borderColor: "rgba(0,0,0,0.10)",
                      color: "var(--foreground)",
                    }}
                  >
                    <div className="text-sm font-semibold">Chat</div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setExpanded((v) => !v)}
                        className={cx(modalBtnClass, "hover:bg-black/[0.04]")}
                        style={modalBtnStyle}
                        title={expanded ? "Exit full screen" : "Full screen"}
                      >
                        ⛶
                      </button>

                      <button
                        onClick={() => {
                          setChatOpen(false);
                          setExpanded(false);
                        }}
                        className={cx(modalBtnClass, "hover:bg-black/[0.04]")}
                        style={modalBtnStyle}
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-hidden">
                    <ChatPage />
                  </div>
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeScaleIn {
                  from {
                    opacity: 0;
                    transform: scale(0.97);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}</style>
            </>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}

/** tiny local helper */
function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** math helpers */
function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Better “files” icon */
function FolderIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "rgba(17,17,17,0.85)" }}
    >
      <path
        d="M3.5 7.5a2 2 0 0 1 2-2h4.2c.5 0 1 .2 1.3.6l1 1.2c.3.4.8.7 1.3.7H18.5a2 2 0 0 1 2 2v6.5a3 3 0 0 1-3 3H6.5a3 3 0 0 1-3-3V7.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3.5 10h17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

/** Profile icon */
function ProfileIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      style={{ color: "rgba(17,17,17,0.85)" }}
    >
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M20 20a8 8 0 0 0-16 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
