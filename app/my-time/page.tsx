"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
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
  dueDate: string; // "YYYY-MM-DD" or ""
  items: Array<{ id: string; text: string; completed: boolean }>;
  progress: number;
};

type InsightType = "summary" | "patterns" | "suggestions" | "saved";

type Insight = {
  id: string;
  title: string;
  description: string;
  confidence: "High" | "Medium" | "Low";
  lens: Lens;
  type: InsightType;
  pinned: boolean;
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

/* ---------- Default (empty) lens data ---------- */

const DEFAULT_LENS_DATA: LensData = {
  intentionalMinutesTotal: 0,
  today: 0,
  sevenDayAvg: 0,
  streak: "0 days",
  weekTrend: [0, 0, 0, 0, 0, 0, 0],
  consistencyByCategory: { study: 0, work: 0, fitness: 0, life: 0 },
  previous: { intentionalMinutesTotal: 0, today: 0, sevenDayAvg: 0, streak: "0 days" },
};

/* ---------- Compute lens data from real events ---------- */

function computeLensData(events: any[], lens: Lens): LensData {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  function eventMins(e: any) {
    const s = new Date(e.startAt);
    const end = new Date(e.endAt);
    return Math.max(0, (end.getTime() - s.getTime()) / 60000);
  }

  function dayKey(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString().slice(0, 10);
  }

  function eventCategory(type: string): keyof CategoryConsistency | null {
    if (["study", "class", "prep"].includes(type)) return "study";
    if (["work", "meeting"].includes(type)) return "work";
    if (["health"].includes(type)) return "fitness";
    if (["life"].includes(type)) return "life";
    return null;
  }

  const intentional = events.filter((e) => e.eventType !== "free");

  // Build daily minutes map for last 30 days
  const dailyMins: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(todayStart.getTime() - i * 86400000);
    dailyMins[dayKey(d)] = 0;
  }
  for (const e of intentional) {
    const k = dayKey(new Date(e.startAt));
    if (k in dailyMins) dailyMins[k] += eventMins(e);
  }

  const todayKey = dayKey(todayStart);
  const todayMins = dailyMins[todayKey] ?? 0;

  // Last 7 days ending today
  const last7Keys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(todayStart.getTime() - (6 - i) * 86400000);
    return dayKey(d);
  });
  const last7Mins = last7Keys.map((k) => dailyMins[k] ?? 0);
  const sevenDayAvg = last7Mins.reduce((a, b) => a + b, 0) / 7;

  // Current calendar week (Mon–Sun)
  const dow = todayStart.getDay();
  const weekStartOffset = dow === 0 ? 6 : dow - 1;
  const weekStart = new Date(todayStart.getTime() - weekStartOffset * 86400000);
  const weekKeys = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart.getTime() + i * 86400000);
    return dayKey(d);
  });
  const weekTotal = weekKeys.reduce((sum, k) => sum + (dailyMins[k] ?? 0), 0);

  // Current calendar month
  const monthStartKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthTotal = Object.entries(dailyMins).reduce((sum, [k, v]) => (k >= monthStartKey ? sum + v : sum), 0);

  // Streak (consecutive days from today backward)
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const k = dayKey(new Date(todayStart.getTime() - i * 86400000));
    if ((dailyMins[k] ?? 0) > 0) streak++;
    else break;
  }
  const streakStr = streak === 1 ? "1 day" : `${streak} days`;

  // Category consistency for last 7 days
  const catDays: Record<keyof CategoryConsistency, number> = { study: 0, work: 0, fitness: 0, life: 0 };
  for (const k of last7Keys) {
    const cats = new Set(
      intentional
        .filter((e) => dayKey(new Date(e.startAt)) === k)
        .map((e) => eventCategory(e.eventType))
        .filter(Boolean) as (keyof CategoryConsistency)[]
    );
    for (const cat of cats) catDays[cat]++;
  }
  const consistency: CategoryConsistency = {
    study: Math.round((catDays.study / 7) * 100),
    work: Math.round((catDays.work / 7) * 100),
    fitness: Math.round((catDays.fitness / 7) * 100),
    life: Math.round((catDays.life / 7) * 100),
  };

  // Previous period
  let prevTotal = 0;
  let prevToday = 0;
  let prevSevenAvg = sevenDayAvg;
  let prevStreak = 0;

  if (lens === "today") {
    const yKey = dayKey(new Date(todayStart.getTime() - 86400000));
    prevToday = dailyMins[yKey] ?? 0;
    prevTotal = prevToday;
    const prev7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(todayStart.getTime() - (13 - i) * 86400000);
      return dailyMins[dayKey(d)] ?? 0;
    });
    prevSevenAvg = prev7.reduce((a, b) => a + b, 0) / 7;
  } else if (lens === "week") {
    const prevWeekKeys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart.getTime() - (7 - i) * 86400000);
      return dayKey(d);
    });
    prevTotal = prevWeekKeys.reduce((sum, k) => sum + (dailyMins[k] ?? 0), 0);
    prevToday = dailyMins[dayKey(new Date(todayStart.getTime() - 7 * 86400000))] ?? 0;
    prevSevenAvg = prevTotal / 7;
  } else {
    const prevMonthStartKey = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
    prevTotal = Object.entries(dailyMins).reduce(
      (sum, [k, v]) => (k >= prevMonthStartKey && k < monthStartKey ? sum + v : sum),
      0
    );
    prevToday = 0;
  }

  for (let i = 8; i < 38; i++) {
    const k = dayKey(new Date(todayStart.getTime() - i * 86400000));
    if ((dailyMins[k] ?? 0) > 0) prevStreak++;
    else break;
  }
  const prevStreakStr = prevStreak === 1 ? "1 day" : `${prevStreak} days`;

  let intentionalMinutesTotal = 0;
  let weekTrendData = last7Mins;

  if (lens === "today") {
    intentionalMinutesTotal = todayMins;
  } else if (lens === "week") {
    intentionalMinutesTotal = weekTotal;
    weekTrendData = weekKeys.map((k) => dailyMins[k] ?? 0);
  } else {
    intentionalMinutesTotal = monthTotal;
  }

  return {
    intentionalMinutesTotal: Math.round(intentionalMinutesTotal),
    today: Math.round(todayMins),
    sevenDayAvg: Math.round(sevenDayAvg),
    streak: streakStr,
    weekTrend: weekTrendData.map(Math.round),
    consistencyByCategory: consistency,
    previous: {
      intentionalMinutesTotal: Math.round(prevTotal),
      today: Math.round(prevToday),
      sevenDayAvg: Math.round(prevSevenAvg),
      streak: prevStreakStr,
    },
  };
}

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
  const router = useRouter();

  // Lens state
  const [lens, setLens] = useState<Lens>("week");

  // Real events (last 30 days) used to compute metrics
  const [allTimeEvents, setAllTimeEvents] = useState<any[]>([]);
  useEffect(() => {
    const start = new Date(Date.now() - 30 * 86400000).toISOString();
    const end = new Date(Date.now() + 86400000).toISOString();
    fetch(`/api/events?startAt=${encodeURIComponent(start)}&endAt=${encodeURIComponent(end)}`)
      .then((r) => r.json())
      .then((res) => setAllTimeEvents(res?.data ?? []))
      .catch(console.error);
  }, []);

  // Derived data from lens
  const lensData = allTimeEvents.length > 0 ? computeLensData(allTimeEvents, lens) : DEFAULT_LENS_DATA;
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

  const [checkInAnswers, setCheckInAnswers] = useState<Record<string, string>>({});

  const answer = async (questionId: string, value: string) => {
    const next = { ...checkInAnswers, [questionId]: value };
    setCheckInAnswers(next);

    try {
      // Fetch existing answers so we don't overwrite onboarding data
      const getRes = await fetch("/api/onboarding/response");
      const existing = getRes.ok ? ((await getRes.json()).answers ?? {}) : {};

      const today = new Date().toISOString().slice(0, 10);
      const merged = {
        ...existing,
        checkIns: {
          ...((existing as any).checkIns ?? {}),
          [today]: { ...((existing as any).checkIns?.[today] ?? {}), ...next },
        },
      };

      await fetch("/api/onboarding/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: merged }),
      });
    } catch (err) {
      console.error("Failed to save check-in answer:", err);
    }
  };

  // Goals — fetched from Task API (taskType="goal")
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [creatingGoal, setCreatingGoal] = useState(false);

  useEffect(() => {
    fetch("/api/tasks?taskType=goal")
      .then((r) => r.json())
      .then((res) => {
        const raw: any[] = Array.isArray(res?.data) ? res.data : [];
        setGoals(
          raw.map((t) => ({
            id: t.id,
            title: t.title,
            dueDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
            items: [],
            progress: t.completed ? 100 : 0,
          }))
        );
      })
      .catch(console.error)
      .finally(() => setLoadingGoals(false));
  }, []);

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    setCreatingGoal(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newGoalTitle.trim(),
          taskType: "goal",
          dueDate: newGoalDueDate || null,
        }),
      });
      const body = await res.json();
      const created = body?.data ?? body;
      if (created?.id) {
        setGoals((prev) => [
          ...prev,
          { id: created.id, title: created.title, dueDate: created.dueDate ? created.dueDate.slice(0, 10) : "", items: [], progress: 0 },
        ]);
        setNewGoalTitle("");
        setNewGoalDueDate("");
        setShowNewGoalForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingGoal(false);
    }
  }

  async function handleGoalComplete(goalId: string, currentProgress: number) {
    const newCompleted = currentProgress < 100;
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, progress: newCompleted ? 100 : 0 } : g))
    );
    try {
      await fetch(`/api/tasks/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newCompleted }),
      });
    } catch {
      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, progress: currentProgress } : g))
      );
    }
  }

  async function handleGoalDelete(goalId: string) {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    await fetch(`/api/tasks/${goalId}`, { method: "DELETE" }).catch(console.error);
  }

  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  const toggleGoal = (goalId: string) => {
    setExpandedGoalId(expandedGoalId === goalId ? null : goalId);
  };

  const toggleItem = (goalId: string, itemId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedItems = g.items.map((i) =>
          i.id === itemId ? { ...i, completed: !i.completed } : i
        );
        const completedCount = updatedItems.filter((i) => i.completed).length;
        const progress =
          updatedItems.length > 0
            ? Math.round((completedCount / updatedItems.length) * 100)
            : g.progress;
        return { ...g, items: updatedItems, progress };
      })
    );
  };

  // Insights state
  const [selectedInsightType, setSelectedInsightType] = useState<InsightType | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

  // Filter insights by lens and type
  const filteredInsights = insights.filter((insight) => {
    if (insight.lens !== lens) return false;
    if (selectedInsightType === "saved") return insight.pinned;
    if (selectedInsightType) return insight.type === selectedInsightType;
    return false;
  });

  const togglePinInsight = (insightId: string) => {
    setInsights((prev) =>
      prev.map((ins) => (ins.id === insightId ? { ...ins, pinned: !ins.pinned } : ins))
    );
  };

  const toggleExpandInsight = (insightId: string) => {
    setExpandedInsightId(expandedInsightId === insightId ? null : insightId);
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
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Timeframe</div>

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
                          className="flex-1 h-9 rounded-lg text-xs font-semibold transition"
                          style={{
                            background: lens === l
                              ? rgbaBrand(0.12)
                              : dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                            border: lens === l
                              ? `1px solid ${rgbaBrand(0.3)}`
                              : `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
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

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* 1) AI Chat */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>AI Assistant</div>

                    <div className="rounded-xl p-3" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
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
                      <div className="flex justify-end mt-2 pt-2" style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
                        <button
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold transition"
                          style={{
                            background: aiChat.trim() ? JYNX_GREEN : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                            color: aiChat.trim() ? "white" : dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)",
                            cursor: aiChat.trim() ? "pointer" : "not-allowed",
                          }}
                          disabled={!aiChat.trim()}
                          onClick={() => {
                            if (aiChat.trim()) {
                              router.push("/chat");
                              setAiChat("");
                            }
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </section>

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* 2) Quick check-in */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Quick check-in</div>

                    {!showCheckIn || pendingQuestions.length === 0 ? (
                      <div className="rounded-xl px-3 py-3" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                        <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>Nothing to answer right now.</div>
                        <div className="text-[11px] mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Jynx asks occasionally.</div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {pendingQuestions.map((q) => (
                          <div key={q.id} className="rounded-xl px-3 py-3" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                            <div className="text-sm font-medium mb-3" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{q.prompt}</div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => answer(q.id, "yes")}
                                className="flex-1 h-8 rounded-lg text-xs font-semibold transition"
                                style={{
                                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                  color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)"
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => answer(q.id, "no")}
                                className="flex-1 h-8 rounded-lg text-xs font-semibold transition"
                                style={{
                                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                  color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)"
                                }}
                              >
                                No
                              </button>
                              <button
                                type="button"
                                onClick={() => answer(q.id, "skip")}
                                className="flex-1 h-8 rounded-lg text-xs font-semibold transition"
                                style={{
                                  background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
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

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* 3) Insights */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Insights</div>

                    <div className="space-y-1.5">
                      {(["summary", "patterns", "suggestions", "saved"] as const).map((type) => {
                        const labels = {
                          summary: "Weekly Summary",
                          patterns: "Patterns",
                          suggestions: "Suggestions",
                          saved: "Saved Insights",
                        };
                        const active = selectedInsightType === type;

                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedInsightType(type)}
                            className="w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition"
                            style={{
                              background: active
                                ? rgbaBrand(0.12)
                                : dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                              border: active
                                ? `1px solid ${rgbaBrand(0.3)}`
                                : `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                              color: active
                                ? JYNX_GREEN
                                : dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)",
                            }}
                          >
                            {labels[type]}
                          </button>
                        );
                      })}
                    </div>
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
                      {weekTrend.map((val: number, i: number) => {
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
                    <button
                      onClick={() => setShowNewGoalForm((v) => !v)}
                      className="rounded-2xl px-3 py-1.5 text-xs font-semibold border transition"
                      style={{
                        borderColor: rgbaBrand(0.22),
                        background: dark ? "rgba(255,255,255,0.04)" : "white",
                        color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                      }}
                    >
                      {showNewGoalForm ? "Cancel" : "+ New Goal"}
                    </button>
                  </div>

                  {showNewGoalForm && (
                    <form onSubmit={handleCreateGoal} className="mb-4 space-y-2">
                      <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="Goal title"
                        autoFocus
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        style={{
                          borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
                          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                        }}
                      />
                      <input
                        type="date"
                        value={newGoalDueDate}
                        onChange={(e) => setNewGoalDueDate(e.target.value)}
                        className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        style={{
                          borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
                          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                          color: dark ? "rgba(240,240,240,0.75)" : "rgba(0,0,0,0.75)",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={creatingGoal || !newGoalTitle.trim()}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold border transition"
                        style={{
                          borderColor: rgbaBrand(0.30),
                          background: rgbaBrand(0.10),
                          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                          opacity: creatingGoal ? 0.6 : 1,
                        }}
                      >
                        {creatingGoal ? "Adding…" : "Add Goal"}
                      </button>
                    </form>
                  )}

                  {loadingGoals ? (
                    <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Loading…</div>
                  ) : goals.length === 0 ? (
                    <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>No goals yet. Add one to start tracking.</div>
                  ) : (
                    <div className="space-y-2.5">
                      {goals.map((goal) => {
                        const isExpanded = expandedGoalId === goal.id;
                        const completedCount = goal.items.filter(i => i.completed).length;
                        const totalCount = goal.items.length;

                        return (
                          <div key={goal.id}>
                            <div
                              className="rounded-xl border p-4"
                              style={{
                                ...getSurfaceSoftStyle(dark),
                                background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
                                opacity: goal.progress >= 100 ? 0.7 : 1,
                              }}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  onClick={() => toggleGoal(goal.id)}
                                  className="flex-1 min-w-0 text-left"
                                >
                                  <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)", textDecoration: goal.progress >= 100 ? "line-through" : "none" }}>{goal.title}</div>
                                  {goal.dueDate && (
                                    <div className="text-[11px] mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                                      Due {new Date(goal.dueDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                                    </div>
                                  )}
                                  <div className="mt-3 flex items-center gap-2.5">
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                      <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${goal.progress}%`, background: JYNX_GREEN }}
                                      />
                                    </div>
                                    <span className="text-[11px] font-semibold" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>{goal.progress}%</span>
                                  </div>
                                </button>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    onClick={() => handleGoalComplete(goal.id, goal.progress)}
                                    title={goal.progress >= 100 ? "Mark incomplete" : "Mark complete"}
                                    className="h-7 w-7 rounded-lg border flex items-center justify-center transition"
                                    style={{
                                      borderColor: goal.progress >= 100 ? rgbaBrand(0.50) : (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"),
                                      background: goal.progress >= 100 ? rgbaBrand(0.15) : "transparent",
                                    }}
                                  >
                                    {goal.progress >= 100 && <Check size={11} style={{ color: dark ? "rgba(240,240,240,0.80)" : "rgba(0,0,0,0.70)" }} />}
                                  </button>
                                  {totalCount > 0 && (
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md" style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>
                                      {completedCount}/{totalCount}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleGoalDelete(goal.id)}
                                    className="text-[10px] opacity-30 hover:opacity-70 transition"
                                    style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                                  >
                                    ✕
                                  </button>
                                  <svg
                                    onClick={() => toggleGoal(goal.id)}
                                    width="14" height="14" viewBox="0 0 16 16" fill="none"
                                    className="transition-transform cursor-pointer"
                                    style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}
                                  >
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Expanded checklist */}
                            {isExpanded && goal.items.length > 0 && (
                              <div className="mt-2.5 ml-3 pl-3 border-l space-y-1.5" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                                {goal.items.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => toggleItem(goal.id, item.id)}
                                    className="w-full flex items-start gap-2.5 text-left py-2 px-2.5 rounded-lg transition hover:bg-opacity-70"
                                    style={{ background: dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.015)" }}
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
                  )}
                </div>

                {/* 4) Insights Block */}
                {selectedInsightType && filteredInsights.length > 0 && (
                  <div className="rounded-3xl border p-6" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-base font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                          {selectedInsightType === "summary"
                            ? "Weekly Summary"
                            : selectedInsightType === "patterns"
                            ? "Patterns"
                            : selectedInsightType === "suggestions"
                            ? "Suggestions"
                            : "Saved Insights"}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                          {lens === "today" ? "Today" : lens === "week" ? "This Week" : "This Month"}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", color: dark ? "rgba(240,240,240,0.65)" : "rgba(0,0,0,0.65)" }}>
                        {filteredInsights.length} insight{filteredInsights.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {filteredInsights.map((insight) => {
                        const isExpanded = expandedInsightId === insight.id;

                        return (
                          <div
                            key={insight.id}
                            className="rounded-xl border p-4"
                            style={{
                              ...getSurfaceSoftStyle(dark),
                              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold mb-1" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{insight.title}</div>

                                {isExpanded && (
                                  <div className="text-sm mt-2 leading-relaxed" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>
                                    {insight.description}
                                  </div>
                                )}

                                <div className="flex items-center gap-3 mt-2">
                                  <span className="text-[11px] font-medium" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                                    Confidence: <span style={{ color: insight.confidence === "High" ? JYNX_GREEN : insight.confidence === "Medium" ? "#E8943A" : dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>{insight.confidence}</span>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => togglePinInsight(insight.id)}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                                  style={{
                                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                    color: insight.pinned ? JYNX_GREEN : dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)"
                                  }}
                                  title={insight.pinned ? "Unpin" : "Pin"}
                                >
                                  {insight.pinned ? "★" : "☆"}
                                </button>
                                <button
                                  onClick={() => toggleExpandInsight(insight.id)}
                                  className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                                  style={{
                                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                                    color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)"
                                  }}
                                  title={isExpanded ? "Collapse" : "Expand"}
                                >
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
