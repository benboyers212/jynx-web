"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { Menu, Check, Circle } from "lucide-react";
import { useTheme } from "../ThemeContext";

type Question = {
  id: string;
  prompt: string;
  type: "yesno";
};

type Goal = {
  id: string;
  title: string;
  window: string;
  items: Array<{ id: string; text: string; completed: boolean }>;
  progress: number;
};

type Lens = "today" | "week" | "month";

type CategoryConsistency = {
  study: number;
  work: number;
  fitness: number;
  life: number;
};

type LensData = {
  intentionalMinutesTotal: number;
  today: number;
  sevenDayAvg: number;
  streak: string;
  weekTrend: number[];
  consistencyByCategory: CategoryConsistency;
  previous: {
    intentionalMinutesTotal: number;
    today: number;
    sevenDayAvg: number;
    streak: string;
  };
};

/** Light brand accent */
const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

const JYNX_GREEN = rgbaBrand(1);

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ---------- Shared styles ---------- */

const maxW = "max-w-[1600px]";

function getSurfaceStyle(dark: boolean): CSSProperties {
  return {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.30)" : "0 4px 24px rgba(0,0,0,0.04)",
  };
}

function getSurfaceSoftStyle(dark: boolean): CSSProperties {
  return {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.03)",
  };
}

/* ---------- Helper Functions ---------- */

/**
 * Compute percent delta between current and previous values
 */
function computePercentDelta(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const delta = ((current - previous) / previous) * 100;
  if (delta > 0) return `+${Math.round(delta)}%`;
  if (delta < 0) return `${Math.round(delta)}%`;
  return "0%";
}

/**
 * Compute qualitative label from consistency percentage
 */
function computeLabelFromPercent(pct: number): string {
  if (pct >= 85) return "Strong";
  if (pct >= 70) return "Stable";
  if (pct >= 50) return "Recovering";
  return "Fragile";
}

/**
 * Build reflection text based on consistency by category
 */
function buildReflectionText(consistency: CategoryConsistency, lens: Lens): string {
  const categories = [
    { name: "Study", value: consistency.study },
    { name: "Work", value: consistency.work },
    { name: "Fitness", value: consistency.fitness },
    { name: "Life", value: consistency.life },
  ];

  // Sort by value
  const sorted = [...categories].sort((a, b) => b.value - a.value);
  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  const highestLabel = computeLabelFromPercent(highest.value).toLowerCase();
  const lowestLabel = computeLabelFromPercent(lowest.value).toLowerCase();

  const timeframe = lens === "today" ? "today" : lens === "week" ? "this week" : "this month";

  // Build observational sentence
  if (highest.value >= 70 && lowest.value < 50) {
    return `${highest.name} is ${highestLabel} ${timeframe} while ${lowest.name} routines look more ${lowestLabel} — common during high-output stretches.`;
  } else if (lowest.value >= 70) {
    return `All categories are holding steady ${timeframe} — a balanced rhythm across the board.`;
  } else if (highest.value < 50) {
    return `Most categories are rebuilding ${timeframe} — gentle momentum is forming.`;
  } else {
    return `${highest.name} is ${highestLabel} ${timeframe}, while ${lowest.name} is ${lowestLabel} — patterns shift naturally over time.`;
  }
}

/* ---------- Mock Data by Lens ---------- */

const MOCK_DATA: Record<Lens, LensData> = {
  today: {
    intentionalMinutesTotal: 120,
    today: 120,
    sevenDayAvg: 597,
    streak: "6 days",
    weekTrend: [520, 580, 610, 590, 620, 640, 120],
    consistencyByCategory: {
      study: 75,
      work: 60,
      fitness: 55,
      life: 42,
    },
    previous: {
      intentionalMinutesTotal: 110,
      today: 110,
      sevenDayAvg: 580,
      streak: "5 days",
    },
  },
  week: {
    intentionalMinutesTotal: 620,
    today: 120,
    sevenDayAvg: 597,
    streak: "6 days",
    weekTrend: [520, 580, 610, 590, 620, 640, 620],
    consistencyByCategory: {
      study: 78,
      work: 64,
      fitness: 58,
      life: 46,
    },
    previous: {
      intentionalMinutesTotal: 575,
      today: 115,
      sevenDayAvg: 550,
      streak: "5 days",
    },
  },
  month: {
    intentionalMinutesTotal: 2480,
    today: 120,
    sevenDayAvg: 597,
    streak: "18 days",
    weekTrend: [2100, 2200, 2250, 2300, 2350, 2400, 2480],
    consistencyByCategory: {
      study: 82,
      work: 68,
      fitness: 62,
      life: 51,
    },
    previous: {
      intentionalMinutesTotal: 2200,
      today: 105,
      sevenDayAvg: 530,
      streak: "15 days",
    },
  },
};

/* ---------- Enhanced SimpleBars with Qualitative Labels ---------- */

function SimpleBars({
  title,
  bars,
  dark = false,
}: {
  title: string;
  bars: Array<{ label: string; value: number }>;
  dark?: boolean;
}) {
  return (
    <div className="rounded-3xl border p-6" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
      <div className="text-base font-semibold mb-5" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{title}</div>
      <div className="space-y-4">
        {bars.map((b) => {
          const qualLabel = computeLabelFromPercent(b.value);
          return (
            <div key={b.label} className="flex items-center gap-3">
              <div className="w-16 text-[12px] font-medium" style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(0,0,0,0.55)" }}>{b.label}</div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${clamp(b.value, 0, 100)}%`,
                    background: JYNX_GREEN,
                  }}
                />
              </div>
              <div className="w-10 text-right text-[12px] font-semibold" style={{ color: dark ? "rgba(240,240,240,0.65)" : "rgba(0,0,0,0.65)" }}>{Math.round(b.value)}%</div>
              <div className="w-20 text-right text-[11px] font-medium" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)" }}>{qualLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function MyTimePage() {
  const { dark } = useTheme();

  // Lens state
  const [lens, setLens] = useState<Lens>("week");

  // Derived data from lens
  const lensData = MOCK_DATA[lens];
  const intentionalMinutes = lensData.intentionalMinutesTotal;
  const weekTrend = lensData.weekTrend;
  const consistencyByCategory = lensData.consistencyByCategory;

  // Compute deltas
  const totalDelta = computePercentDelta(lensData.intentionalMinutesTotal, lensData.previous.intentionalMinutesTotal);
  const todayDelta = computePercentDelta(lensData.today, lensData.previous.today);
  const avgDelta = computePercentDelta(lensData.sevenDayAvg, lensData.previous.sevenDayAvg);

  // For streak, show comparison text instead of %
  const streakComparison = lens === "today"
    ? lensData.streak === lensData.previous.streak ? "= vs yesterday" : "vs yesterday"
    : lens === "week"
    ? lensData.streak === lensData.previous.streak ? "= vs last week" : `vs last week (${lensData.previous.streak})`
    : `vs last month (${lensData.previous.streak})`;

  // Reflection text
  const reflectionText = buildReflectionText(consistencyByCategory, lens);

  // Left sidebar (collapsible)
  const [leftOpen, setLeftOpen] = useState(true);
  const [aiChat, setAiChat] = useState("");
  const aiChatRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const check = () => { if (window.innerWidth < 768) setLeftOpen(false); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Quick check-in (max 2 questions)
  const [pendingQuestions] = useState<Question[]>([
    { id: "q1", prompt: "Did morning deep work feel focused today?", type: "yesno" },
  ]);

  const [showCheckIn] = useState(true);

  const answer = (questionId: string, value: string) => {
    console.log("Answer:", questionId, value);
    // Wire to backend later
  };

  // Goals (mock data - will sync with schedule later)
  const [goals] = useState<Goal[]>([
    {
      id: "g1",
      title: "Launch MVP",
      window: "Q1 2026",
      progress: 65,
      items: [
        { id: "i1", text: "Complete user authentication", completed: true },
        { id: "i2", text: "Build dashboard UI", completed: true },
        { id: "i3", text: "Integrate payment system", completed: false },
        { id: "i4", text: "Run beta testing", completed: false },
        { id: "i5", text: "Deploy to production", completed: false },
      ],
    },
    {
      id: "g2",
      title: "Health & Fitness",
      window: "This Month",
      progress: 40,
      items: [
        { id: "i6", text: "Gym 3x per week", completed: true },
        { id: "i7", text: "Track meals daily", completed: false },
        { id: "i8", text: "Sleep 8 hours consistently", completed: false },
      ],
    },
    {
      id: "g3",
      title: "Learn TypeScript",
      window: "6 Weeks",
      progress: 30,
      items: [
        { id: "i9", text: "Complete basics course", completed: true },
        { id: "i10", text: "Build practice project", completed: false },
        { id: "i11", text: "Read advanced patterns book", completed: false },
        { id: "i12", text: "Contribute to open source", completed: false },
      ],
    },
  ]);

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const toggleGoal = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  const toggleItem = (goalId: string, itemId: string) => {
    console.log("Toggle item:", goalId, itemId);
    // Wire to backend later
  };

  return (
    <main className="h-screen overflow-hidden" style={{ background: dark ? "var(--background)" : "#f8f9fa", color: dark ? "var(--foreground)" : "rgba(0,0,0,0.95)" }}>
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${rgbaBrand(0.22)}, ${dark ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)"} 60%)`,
            opacity: dark ? 0.15 : 0.25,
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-15" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.10)" }} />
      </div>

      <div className="relative flex h-full">
        {/* LEFT RAIL (Control Center) */}
        <div
          className="h-full transition-[width] duration-200"
          style={{
            width: leftOpen ? "clamp(220px, 22vw, 460px)" : "56px",
            background: dark ? "rgba(15,15,15,0.88)" : "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRight: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="h-full flex flex-col">
            <div className={cx("px-3 pt-4", leftOpen ? "pb-3" : "pb-2 flex justify-center")}>
              <div className={cx("flex items-center", leftOpen ? "justify-start" : "justify-center")}>
                <button
                  onClick={() => setLeftOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl border transition flex items-center justify-center"
                  style={{
                    ...getSurfaceSoftStyle(dark),
                    background: dark ? "rgba(255,255,255,0.04)" : "white",
                    color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)"
                  }}
                  aria-label="Toggle Control Center"
                  title="Control Center"
                >
                  <Menu size={18} />
                </button>
              </div>
            </div>

            {leftOpen && (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                  {/* 0) Lens Toggle */}
                  <section>
                    <div className="text-sm font-semibold mb-2" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Lens</div>
                    <div className="text-[11px] mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>View your reflection across different timeframes.</div>

                    <div className="flex gap-2">
                      {(["today", "week", "month"] as Lens[]).map((l) => (
                        <button
                          key={l}
                          onClick={() => setLens(l)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setLens(l);
                            }
                          }}
                          className="flex-1 h-9 rounded-lg text-xs font-semibold border transition"
                          style={{
                            ...getSurfaceSoftStyle(dark),
                            background: lens === l
                              ? rgbaBrand(0.12)
                              : dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                            borderColor: lens === l
                              ? rgbaBrand(0.3)
                              : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                            color: lens === l
                              ? JYNX_GREEN
                              : dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)",
                          }}
                          tabIndex={0}
                          role="radio"
                          aria-checked={lens === l}
                        >
                          {l === "today" ? "Today" : l === "week" ? "This Week" : "This Month"}
                        </button>
                      ))}
                    </div>
                  </section>

                  {/* 1) AI Chat */}
                  <section>
                    <div className="text-sm font-semibold mb-2" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>AI Assistant</div>
                    <div className="text-[11px] mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Quick questions about your schedule, goals, or habits.</div>

                    <div className="rounded-xl border p-3" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <textarea
                        ref={aiChatRef}
                        value={aiChat}
                        onChange={(e) => setAiChat(e.target.value)}
                        placeholder='e.g., "How am I tracking on my goals this week?"'
                        className="w-full text-sm outline-none resize-none placeholder:text-neutral-400"
                        style={{
                          background: "transparent",
                          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                          minHeight: "80px",
                        }}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
                          style={{
                            background: aiChat.trim() ? JYNX_GREEN : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                            color: aiChat.trim() ? "white" : dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)",
                            cursor: aiChat.trim() ? "pointer" : "not-allowed",
                          }}
                          disabled={!aiChat.trim()}
                          onClick={() => {
                            if (aiChat.trim()) {
                              console.log("Send:", aiChat);
                              setAiChat("");
                            }
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* 2) Quick check-in */}
                  <section>
                    <div className="text-sm font-semibold mb-2" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Quick check-in</div>
                    <div className="text-[11px] mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>1-2 questions max — only when it helps.</div>

                    {!showCheckIn || pendingQuestions.length === 0 ? (
                      <div className="rounded-xl border px-3 py-3" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                        <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>Nothing to answer right now.</div>
                        <div className="text-[11px] mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Jynx asks occasionally.</div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {pendingQuestions.map((q) => (
                          <div key={q.id} className="rounded-xl border px-3 py-3" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <div className="text-sm font-medium mb-3" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{q.prompt}</div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => answer(q.id, "yes")}
                                className="flex-1 h-8 rounded-lg text-xs font-semibold border transition hover:bg-opacity-80"
                                style={{
                                  ...getSurfaceSoftStyle(dark),
                                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                  borderColor: rgbaBrand(0.15),
                                  color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)"
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => answer(q.id, "no")}
                                className="flex-1 h-8 rounded-lg text-xs font-semibold border transition hover:bg-opacity-80"
                                style={{
                                  ...getSurfaceSoftStyle(dark),
                                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                  color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)"
                                }}
                              >
                                No
                              </button>
                              <button
                                type="button"
                                onClick={() => answer(q.id, "skip")}
                                className="flex-1 h-8 rounded-lg text-xs font-semibold border transition hover:bg-opacity-80"
                                style={{
                                  ...getSurfaceSoftStyle(dark),
                                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                                  color: dark ? "rgba(240,240,240,0.55)" : "rgba(0,0,0,0.55)"
                                }}
                              >
                                Skip
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </>
            )}
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col h-full">
          {/* Content scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className={cx(maxW, "mx-auto px-6 pt-6 pb-10")}>
              {/* In-canvas header */}
              <div className="mb-6">
                <div className="text-lg font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>My Time</div>
                <div className="text-sm mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                  Track your intentional minutes, consistency, and goal progress.
                </div>
              </div>

              {/* Reflection Header */}
              <div
                className="rounded-2xl border p-4 mb-6"
                style={{
                  ...getSurfaceSoftStyle(dark),
                  background: dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)"
                }}
              >
                <div className="text-sm leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.75)" : "rgba(0,0,0,0.70)" }}>
                  {reflectionText}
                </div>
              </div>

              {/* Main canvas */}
              <div className="space-y-6">
                {/* 1) Intentional minutes — clean, prominent */}
                <div
                  className="rounded-3xl border p-6"
                  style={{
                    ...getSurfaceStyle(dark),
                    background: dark ? "var(--surface)" : "white",
                  }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-base font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Intentional Minutes</div>
                      <div className="text-xs mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Time spent on what matters most</div>
                    </div>
                  </div>

                  <div className="flex items-end gap-6 mb-5">
                    <div>
                      <div className="text-5xl font-bold tracking-tight" style={{ color: JYNX_GREEN }}>{formatNumber(intentionalMinutes)}</div>
                      <div className="text-xs mt-1 font-medium" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)" }}>
                        {totalDelta} vs last period
                      </div>
                    </div>

                    {/* Week trend sparkline */}
                    <div className="flex-1 flex items-end gap-1.5 pb-1" style={{ maxHeight: "60px" }}>
                      {weekTrend.map((val, i) => {
                        const max = Math.max(...weekTrend);
                        const pct = (val / max) * 100;
                        const isCurrent = i === weekTrend.length - 1;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-sm transition-all"
                            style={{
                              height: `${Math.max(pct, 15)}%`,
                              background: isCurrent ? JYNX_GREEN : dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
                              opacity: isCurrent ? 1 : 0.5,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border px-3 py-2.5" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)" }}>Today</div>
                      <div className="text-lg font-bold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{lensData.today}</div>
                      <div className="text-[10px] mt-0.5 font-medium" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>
                        {todayDelta}
                      </div>
                    </div>
                    <div className="rounded-xl border px-3 py-2.5" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)" }}>7-Day Avg</div>
                      <div className="text-lg font-bold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{lensData.sevenDayAvg}</div>
                      <div className="text-[10px] mt-0.5 font-medium" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>
                        {avgDelta}
                      </div>
                    </div>
                    <div className="rounded-xl border px-3 py-2.5" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <div className="text-[10px] uppercase tracking-wide font-semibold mb-1" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)" }}>Streak</div>
                      <div className="text-lg font-bold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{lensData.streak}</div>
                      <div className="text-[10px] mt-0.5 font-medium" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>
                        {streakComparison}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2) Consistency by category */}
                <SimpleBars
                  title="Consistency by Category"
                  bars={[
                    { label: "Study", value: consistencyByCategory.study },
                    { label: "Work", value: consistencyByCategory.work },
                    { label: "Fitness", value: consistencyByCategory.fitness },
                    { label: "Life", value: consistencyByCategory.life },
                  ]}
                  dark={dark}
                />

                {/* 3) Goals — connected to schedule */}
                <div className="rounded-3xl border p-6" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className="text-base font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Goals & Progress</div>
                      <div className="text-xs mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Click to expand and track detailed progress</div>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: dark ? "rgba(240,240,240,0.65)" : "rgba(0,0,0,0.65)" }}>
                      {goals.length} active
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {goals.map((goal) => {
                      const isExpanded = expandedGoalId === goal.id;
                      const completedCount = goal.items.filter(i => i.completed).length;
                      const totalCount = goal.items.length;

                      return (
                        <div key={goal.id}>
                          <button
                            onClick={() => toggleGoal(goal.id)}
                            className="w-full text-left rounded-xl border p-4 transition hover:bg-opacity-80"
                            style={{
                              ...getSurfaceSoftStyle(dark),
                              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{goal.title}</div>
                                <div className="text-[11px] mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>{goal.window}</div>

                                {/* Progress bar */}
                                <div className="mt-3 flex items-center gap-2.5">
                                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                    <div
                                      className="h-full rounded-full transition-all duration-500"
                                      style={{
                                        width: `${goal.progress}%`,
                                        background: JYNX_GREEN,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[11px] font-semibold" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>{goal.progress}%</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>
                                  {completedCount}/{totalCount}
                                </span>
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>
                                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            </div>
                          </button>

                          {/* Expanded checklist */}
                          {isExpanded && (
                            <div className="mt-2.5 ml-3 pl-3 border-l space-y-1.5" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                              {goal.items.map((item) => (
                                <button
                                  key={item.id}
                                  onClick={() => toggleItem(goal.id, item.id)}
                                  className="w-full flex items-start gap-2.5 text-left py-2 px-2.5 rounded-lg transition hover:bg-opacity-70"
                                  style={{
                                    background: dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)",
                                  }}
                                >
                                  {item.completed ? (
                                    <div className="h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: JYNX_GREEN }}>
                                      <Check size={12} color="white" strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <Circle size={18} className="shrink-0 mt-0.5" style={{ color: dark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)" }} strokeWidth={2} />
                                  )}
                                  <span
                                    className="text-sm"
                                    style={{
                                      color: item.completed
                                        ? dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)"
                                        : dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)",
                                      textDecoration: item.completed ? "line-through" : "none",
                                    }}
                                  >
                                    {item.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
