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

const OLIVE = "#556B2F";

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
    { label: "My Time", href: "/my-time" },
    { label: "Schedule", href: "/" },
    { label: "Groups", href: "/groups" },
  ];

  // Tune values EXACTLY here
  const headerT = useMemo(() => clamp(scrollY / 140, 0, 1), [scrollY]);
  const bgAlpha = lerp(0.84, 0.62, headerT);
  const borderAlpha = lerp(0.08, 0.045, headerT);
  const washOpacity = lerp(0.14, 0.05, headerT);
  const topHighlightAlpha = lerp(0.012, 0.006, headerT);
  const navIdleAlpha = lerp(1.0, 0.88, headerT);
  const navActiveAlpha = lerp(1.0, 0.92, headerT);
  const blurPx = lerp(16, 10, headerT);

  return (
    <ClerkProvider signInUrl="/login">
      <html lang="en" className={dmSans.variable}>
        <body className="font-sans bg-neutral-950 text-neutral-100">
          {/* Top nav (layout shell) */}
          <div className="sticky top-0 z-40">
            {/* Header surface */}
            <div
              className="relative"
              style={{
                borderBottom: `1px solid rgba(255,255,255,${borderAlpha})`,
                background: `rgba(10,10,10,${bgAlpha})`,
                backdropFilter: `blur(${blurPx}px)`,
                WebkitBackdropFilter: `blur(${blurPx}px)`,
              }}
            >
              {/* subtle olive wash */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                  className="absolute -top-28 left-1/2 h-[220px] w-[900px] -translate-x-1/2 rounded-full blur-3xl"
                  style={{
                    opacity: washOpacity,
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(85,107,47,0.85), rgba(17,17,17,0) 60%)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to bottom, rgba(255,255,255,${topHighlightAlpha}), rgba(255,255,255,0))`,
                  }}
                />
              </div>

              <div className="relative mx-auto max-w-7xl px-6">
                <div className="h-16 flex items-center">
                  {/* Left: brand */}
                  <div className="flex items-center gap-3 min-w-[220px]">
                    <div
                      className="h-10 w-10 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-xs font-semibold text-white"
                      style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.18)" }}
                    >
                      LOGO
                    </div>

                    <div className="min-w-0">
                      <div className="text-base font-semibold tracking-wide leading-tight truncate text-white">
                        Jynx
                      </div>
                    </div>
                  </div>

                  {/* Center: tabs */}
                  <div className="flex-1 hidden md:flex justify-center">
                    <nav className="flex items-center gap-2">
                      {navItems.map((t) => {
                        const active =
                          t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href);

                        const activeStyle: React.CSSProperties = {
                          opacity: navActiveAlpha,
                          backgroundColor: "rgba(85,107,47,0.22)",
                          borderColor: "rgba(85,107,47,0.62)",
                          boxShadow:
                            "0 0 0 1px rgba(85,107,47,0.34), 0 0 18px rgba(85,107,47,0.14)",
                        };

                        const idleStyle: React.CSSProperties = {
                          opacity: navIdleAlpha,
                          backgroundColor: "rgba(255,255,255,0.045)",
                          borderColor: "rgba(255,255,255,0.095)",
                          boxShadow: "none",
                        };

                        return (
                          <Link
                            key={t.href}
                            href={t.href}
                            className={cx(
                              "rounded-full px-5 py-2.5 text-sm font-semibold border transition",
                              "select-none",
                              active
                                ? "text-white"
                                : "text-neutral-300 hover:text-white hover:bg-white/[0.06]"
                            )}
                            style={active ? activeStyle : idleStyle}
                          >
                            {t.label}
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
                      className="h-10 w-10 rounded-full border border-white/12 bg-white/6 hover:bg-white/10 transition flex items-center justify-center"
                      style={{
                        opacity: navIdleAlpha,
                        boxShadow: "0 0 0 1px rgba(85,107,47,0.18)",
                      }}
                      title="Files"
                      aria-label="Files"
                    >
                      <FolderIcon className="h-5 w-5 text-neutral-100" />
                    </button>

                    <button
                      onClick={() => {
                        setProfileOpen(true);
                        setProfileExpanded(false);
                      }}
                      className="h-10 w-10 rounded-full border border-white/12 bg-white/6 hover:bg-white/10 transition flex items-center justify-center"
                      style={{
                        opacity: navIdleAlpha,
                        boxShadow: "0 0 0 1px rgba(85,107,47,0.18)",
                      }}
                      title="Profile"
                      aria-label="Profile"
                    >
                      <ProfileIcon className="h-5 w-5 text-neutral-100" />
                    </button>

                    <div
                      className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200 ml-2"
                      style={{ opacity: navIdleAlpha }}
                    >
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                      UI shell
                    </div>
                  </div>
                </div>

                {/* Mobile tabs */}
                <div className="md:hidden pb-3">
                  <nav className="flex items-center gap-2">
                    {navItems.map((t) => {
                      const active =
                        t.href === "/" ? pathname === "/" : pathname?.startsWith(t.href);

                      return (
                        <Link
                          key={t.href}
                          href={t.href}
                          className={cx(
                            "rounded-full px-4 py-2 text-sm font-semibold border transition",
                            active ? "text-white" : "text-neutral-300 hover:text-white"
                          )}
                          style={
                            active
                              ? {
                                  opacity: navActiveAlpha,
                                  backgroundColor: "rgba(85,107,47,0.22)",
                                  borderColor: "rgba(85,107,47,0.62)",
                                  boxShadow: "0 0 0 1px rgba(85,107,47,0.30)",
                                }
                              : {
                                  opacity: navIdleAlpha,
                                  backgroundColor: "rgba(255,255,255,0.045)",
                                  borderColor: "rgba(255,255,255,0.095)",
                                }
                          }
                        >
                          {t.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="min-h-[calc(100vh-64px)]">{children}</div>

          {/* Floating chat button */}
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full border border-white/20 bg-neutral-950/90 flex items-center justify-center hover:bg-white/10 transition"
            style={{
              boxShadow:
                "0 0 0 2px rgba(85,107,47,0.45), 0 18px 55px rgba(0,0,0,0.55)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
            aria-label="Open chat"
            title="Chat"
          >
            <span className="text-white text-lg">💬</span>
          </button>

          {/* Files modal */}
          {filesOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/70 z-40 transition-opacity"
                onClick={() => {
                  setFilesOpen(false);
                  setFilesExpanded(false);
                }}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div
                  className={cx(
                    "relative bg-neutral-950 border border-white/15 shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col",
                    filesExpanded
                      ? "w-full h-full rounded-none"
                      : "w-[92vw] max-w-[1200px] h-[85vh] rounded-3xl"
                  )}
                  style={{ animation: "fadeScaleIn 220ms ease-out" }}
                >
                  <div className="h-12 px-4 flex items-center border-b border-white/10 shrink-0">
                    <div className="text-sm font-semibold text-white">Files</div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setFilesExpanded((v) => !v)}
                        className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                        title={filesExpanded ? "Exit full screen" : "Full screen"}
                      >
                        ⛶
                      </button>

                      <button
                        onClick={() => {
                          setFilesOpen(false);
                          setFilesExpanded(false);
                        }}
                        className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
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
                className="fixed inset-0 bg-black/70 z-40 transition-opacity"
                onClick={() => {
                  setProfileOpen(false);
                  setProfileExpanded(false);
                }}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div
                  className={cx(
                    "relative bg-neutral-950 border border-white/15 shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col",
                    profileExpanded
                      ? "w-full h-full rounded-none"
                      : "w-[92vw] max-w-[1000px] h-[80vh] rounded-3xl"
                  )}
                  style={{ animation: "fadeScaleIn 220ms ease-out" }}
                >
                  <div className="h-12 px-4 flex items-center border-b border-white/10 shrink-0">
                    <div className="text-sm font-semibold text-white">Profile</div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setProfileExpanded((v) => !v)}
                        className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                        title={profileExpanded ? "Exit full screen" : "Full screen"}
                      >
                        ⛶
                      </button>

                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          setProfileExpanded(false);
                        }}
                        className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                        title="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* ✅ THIS IS THE FIX: make the modal body the scroll container */}
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
                className="fixed inset-0 bg-black/70 z-40 transition-opacity"
                onClick={() => {
                  setChatOpen(false);
                  setExpanded(false);
                }}
              />

              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <div
                  className={cx(
                    "relative bg-neutral-950 border border-white/15 shadow-2xl transition-all duration-300 ease-out overflow-hidden flex flex-col",
                    expanded
                      ? "w-full h-full rounded-none"
                      : "w-[92vw] max-w-[1200px] h-[85vh] rounded-3xl scale-100 opacity-100"
                  )}
                  style={{ animation: "fadeScaleIn 220ms ease-out" }}
                >
                  <div className="h-12 px-4 flex items-center border-b border-white/10 shrink-0">
                    <div className="text-sm font-semibold text-white">Chat</div>

                    <div className="ml-auto flex items-center gap-2">
                      <button
                        onClick={() => setExpanded((v) => !v)}
                        className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                        title={expanded ? "Exit full screen" : "Full screen"}
                      >
                        ⛶
                      </button>

                      <button
                        onClick={() => {
                          setChatOpen(false);
                          setExpanded(false);
                        }}
                        className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
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
    <svg className={className} viewBox="0 0 24 24" fill="none">
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
    <svg className={className} viewBox="0 0 24 24" fill="none">
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
