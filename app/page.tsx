"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SlidersHorizontal } from "lucide-react";

/**
 * Brand green pulled to match your logo vibe (darker teal-green).
 * If you want it slightly lighter/darker, tell me and I’ll adjust the hex.
 */
const JYNX_GREEN = "#1F8A5B"; // <-- new green

// Used for RGBA styles
const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

type EventType = "class" | "work" | "health" | "prep" | "study" | "life" | "free";

type BaseEvent = {
  id: string;
  type: EventType;
  tag: string;
  title: string;
  meta: string;

  // start + end (for clean flow)
  time: string; // start
  endTime?: string;

  location?: string;
  completed?: boolean;

  // importance 1–5 (UI shell)
  importance?: 1 | 2 | 3 | 4 | 5;

  // internal only
  isFree?: boolean;
};

type ClassDetails = {
  courseCode: string;
  instructor: string;
  email?: string;
  room: string;
  meetingPattern: string;
  shortSummary: string;
  syllabusFiles: Array<{ name: string; href: string }>;
  assignmentsDue: Array<{ title: string; due: string; points?: string }>;
  nextTopics?: string[];
};

type WorkDetails = {
  owner?: string;
  priority?: "Low" | "Medium" | "High";
  deliverables?: string[];
  links?: Array<{ name: string; href: string }>;
};

type HealthDetails = {
  plan?: string[];
  duration?: string;
  notes?: string;
};

type EventDetails = {
  class?: ClassDetails;
  work?: WorkDetails;
  health?: HealthDetails;
};

type EventRecord = BaseEvent & { details?: EventDetails };

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getTagStyleLight(tag: string) {
  const base = {
    borderColor: "rgba(0,0,0,0.08)",
    color: "rgba(0,0,0,0.76)",
    backgroundColor: "rgba(0,0,0,0.03)",
  };

  const map: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
    Class: {
      backgroundColor: rgbaBrand(0.10),
      color: "rgba(25,25,25,0.90)",
      borderColor: rgbaBrand(0.22),
    },
    Work: {
      backgroundColor: "rgba(0,0,0,0.03)",
      color: "rgba(0,0,0,0.80)",
      borderColor: "rgba(0,0,0,0.10)",
    },
    Health: {
      backgroundColor: rgbaBrand(0.12),
      color: "rgba(25,25,25,0.90)",
      borderColor: rgbaBrand(0.24),
    },
    Prep: {
      backgroundColor: rgbaBrand(0.08),
      color: "rgba(25,25,25,0.86)",
      borderColor: rgbaBrand(0.18),
    },
    Study: {
      backgroundColor: "rgba(0,0,0,0.03)",
      color: "rgba(0,0,0,0.80)",
      borderColor: "rgba(0,0,0,0.10)",
    },
    Life: {
      backgroundColor: rgbaBrand(0.08),
      color: "rgba(25,25,25,0.86)",
      borderColor: rgbaBrand(0.18),
    },
    Flexible: {
      backgroundColor: "rgba(0,0,0,0.025)",
      color: "rgba(0,0,0,0.68)",
      borderColor: "rgba(0,0,0,0.08)",
    },
  };

  return map[tag] ?? base;
}

function getImportanceLabel(i?: 1 | 2 | 3 | 4 | 5) {
  if (!i) return "Medium";
  if (i >= 4) return "High";
  if (i <= 2) return "Low";
  return "Medium";
}

function getImportancePillStyleLight(level: "High" | "Medium" | "Low") {
  if (level === "High") {
    return {
      backgroundColor: rgbaBrand(0.12),
      borderColor: rgbaBrand(0.26),
      color: "rgba(25,25,25,0.90)",
      boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
    } as CSSProperties;
  }
  if (level === "Low") {
    return {
      backgroundColor: "rgba(0,0,0,0.025)",
      borderColor: "rgba(0,0,0,0.08)",
      color: "rgba(0,0,0,0.64)",
    } as CSSProperties;
  }
  return {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderColor: "rgba(0,0,0,0.10)",
    color: "rgba(0,0,0,0.72)",
  } as CSSProperties;
}

const surfaceStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
};

const surfaceSoftStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type ViewSpan = "Day" | "Week";
type ViewFormat = "Schedule" | "List";

type Reminder = {
  id: string;
  title: string;
  due: string; // UI shell
  severity?: "High" | "Medium" | "Low";
};

export default function Home() {
  // ---------------------------
  // Demo schedule data (UI shell)
  // ---------------------------
  const [todayEvents, setTodayEvents] = useState<EventRecord[]>([
    {
      id: "e1",
      type: "class",
      tag: "Class",
      time: "9:30 AM",
      endTime: "10:45 AM",
      title: "F305 — Intermediate Investments",
      meta: "Hodge Hall 2056 · Exam 1 review",
      location: "Hodge Hall 2056",
      completed: false,
      importance: 4,
      details: {
        class: {
          courseCode: "F305",
          instructor: "Prof. Kim",
          email: "kim@iu.edu",
          room: "Hodge Hall 2056",
          meetingPattern: "Tue/Thu · 9:30–10:45 AM",
          shortSummary:
            "Covers portfolio theory, CAPM, risk/return, fixed income basics, and practical investment decision-making.",
          syllabusFiles: [
            { name: "F305 Syllabus (PDF)", href: "/files" },
            { name: "Exam 1 Review Sheet", href: "/files" },
          ],
          assignmentsDue: [
            { title: "Problem Set 3", due: "Before next class", points: "10 pts" },
            { title: "Reading: Ch. 7", due: "Tonight", points: "—" },
          ],
          nextTopics: ["CAPM intuition", "Efficient frontier", "Beta estimation"],
        },
      },
    },
    {
      id: "e2",
      type: "work",
      tag: "Work",
      time: "11:00 AM",
      endTime: "12:30 PM",
      title: "Deep Work — Problem Set",
      meta: "Focus block · 90 min",
      completed: false,
      importance: 5,
      details: {
        work: {
          owner: "You",
          priority: "High",
          deliverables: ["Finish PS3 Q1–Q8", "Check answers against formula sheet"],
          links: [
            { name: "Problem Set Doc", href: "/files" },
            { name: "Formula Sheet", href: "/files" },
          ],
        },
      },
    },
    {
      id: "e3",
      type: "health",
      tag: "Health",
      time: "2:00 PM",
      endTime: "3:00 PM",
      title: "Gym",
      meta: "Chest + tris · 60 min",
      completed: false,
      importance: 3,
      details: {
        health: {
          duration: "60 min",
          plan: ["Incline chest press", "Cable fly", "Triceps pushdown", "Incline walk 10 min"],
          notes: "Keep it crisp. Leave 1–2 reps in the tank on first sets.",
        },
      },
    },
    {
      id: "e4",
      type: "prep",
      tag: "Prep",
      time: "7:00 PM",
      endTime: "7:25 PM",
      title: "Prep — F305 reading",
      meta: "Ch. 7 · 25 min",
      completed: false,
      importance: 2,
    },
  ]);

  const [tomorrowEvents, setTomorrowEvents] = useState<EventRecord[]>([
    {
      id: "t1",
      type: "class",
      tag: "Class",
      time: "10:00 AM",
      endTime: "10:45 AM",
      title: "F305 — Lecture",
      meta: "Portfolio theory",
      location: "Hodge Hall 2056",
      completed: false,
      importance: 3,
      details: {
        class: {
          courseCode: "F305",
          instructor: "Prof. Kim",
          email: "kim@iu.edu",
          room: "Hodge Hall 2056",
          meetingPattern: "Tue/Thu · 9:30–10:45 AM",
          shortSummary:
            "Portfolio construction, diversification, efficient frontier, and how risk factors drive returns.",
          syllabusFiles: [{ name: "F305 Syllabus (PDF)", href: "/files" }],
          assignmentsDue: [{ title: "Reading: Ch. 7", due: "Before class", points: "—" }],
        },
      },
    },
    {
      id: "t2",
      type: "study",
      tag: "Study",
      time: "1:00 PM",
      endTime: "2:00 PM",
      title: "Study — F305",
      meta: "Review notes · 60 min",
      completed: false,
      importance: 3,
    },
    {
      id: "t3",
      type: "life",
      tag: "Life",
      time: "6:30 PM",
      endTime: "7:15 PM",
      title: "Dinner + reset",
      meta: "Light night · 45 min",
      completed: false,
      importance: 2,
    },
  ]);

  // Reminders (UI shell)
  const [reminders] = useState<Reminder[]>([
    { id: "r1", title: "Submit PS3", due: "Tonight", severity: "High" },
    { id: "r2", title: "Email Prof. Kim", due: "Tomorrow", severity: "Medium" },
    { id: "r3", title: "Order protein", due: "This week", severity: "Low" },
  ]);

  // ---------------------------
  // Day selection (every day clickable)
  // ---------------------------
  const seed = useMemo(() => new Date(2026, 0, 1), []); // Jan 2026 like your screenshot
  const [miniMonthOffset, setMiniMonthOffset] = useState(0);

  const displayMonthDate = useMemo(() => {
    const d = new Date(seed);
    d.setMonth(d.getMonth() + miniMonthOffset);
    d.setDate(1);
    return d;
  }, [seed, miniMonthOffset]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 0, 12)); // default demo day

  function sameYMD(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function setSelectedDayInDisplayedMonth(dayNum: number) {
    const d = new Date(displayMonthDate);
    d.setDate(dayNum);
    setSelectedDate(d);
  }

  function shiftSelectedDay(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);

    // keep calendar month in sync with selected date
    const monthDiff = (d.getFullYear() - seed.getFullYear()) * 12 + (d.getMonth() - seed.getMonth());
    setMiniMonthOffset(monthDiff);
  }

  // Used for header
  const selectedLabel = useMemo(() => {
    const label = selectedDate.toLocaleString(undefined, { weekday: "short" });
    const month = selectedDate.toLocaleString(undefined, { month: "short" });
    return {
      top: selectedDate.toLocaleString(undefined, { day: "2-digit" }) ? "Day" : "Day",
      line1: selectedDate.toLocaleString(undefined, { weekday: "long" }),
      line2: `${label}, ${month} ${selectedDate.getDate()}`,
    };
  }, [selectedDate]);

  // Which events for this day?
  const activeEvents = useMemo(() => {
    // Only demo data for Jan 12 + Jan 13 (blank for all other days)
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();

    if (y === 2026 && m === 0 && d === 12) return todayEvents;
    if (y === 2026 && m === 0 && d === 13) return tomorrowEvents;
    return [] as EventRecord[];
  }, [selectedDate, todayEvents, tomorrowEvents]);

  // For toggleComplete, we only affect those two demo days
  function toggleComplete(id: string) {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    if (y === 2026 && m === 0 && d === 12) {
      setTodayEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
      return;
    }
    if (y === 2026 && m === 0 && d === 13) {
      setTomorrowEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
      return;
    }
  }

  // ---------------------------
  // Views
  // ---------------------------
  const [viewSpan, setViewSpan] = useState<ViewSpan>("Day");
  const [viewFormat, setViewFormat] = useState<ViewFormat>("Schedule");

  // Left sidebar (collapsible)
  const [leftOpen, setLeftOpen] = useState(true);

  // Drawer state
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"Overview" | "Files" | "Assignments" | "Notes">("Overview");

  // Quick chat (assistant input)
  const [quickChat, setQuickChat] = useState("");
  const quickChatRef = useRef<HTMLTextAreaElement | null>(null);

  // Thoughts mini card
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const [thoughtsText, setThoughtsText] = useState("");

  // Adjust modal (schedule controls)
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [protectFocus, setProtectFocus] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(true);

  const adjustW = "min(96vw, 1160px)";
  const adjustH = "min(86vh, 760px)";

  // Add-event form (inside Adjust) — UI shell only
  const [addForm, setAddForm] = useState<{
    time: string;
    endTime: string;
    title: string;
    meta: string;
    tag: EventRecord["tag"];
    type: EventType;
    importance: 1 | 2 | 3 | 4 | 5;
  }>({
    time: "3:30 PM",
    endTime: "3:50 PM",
    title: "",
    meta: "",
    tag: "Work",
    type: "work",
    importance: 3,
  });

  // Focus (control center)
  const [focusMode, setFocusMode] = useState<"Auto" | "Morning" | "Afternoon" | "Evening">("Auto");

  const focusCopy = useMemo(() => {
    const map: Record<typeof focusMode, string> = {
      Auto: "Auto: Jynx chooses the focus based on what’s scheduled next.",
      Morning: "Protect your early block. Keep distractions low and stay on rails.",
      Afternoon: "Use the mid-day gap well. Keep transitions clean and don’t drift.",
      Evening: "Close loops. Light prep, reset, and set up tomorrow so your morning starts clean.",
    };
    return map[focusMode];
  }, [focusMode]);

  // Autosize assistant textarea
  useEffect(() => {
    const el = quickChatRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [quickChat]);

  function openDrawer(ev: EventRecord) {
    if (ev.isFree) return;
    setSelected(ev);
    setDrawerOpen(true);
    setDrawerTab("Overview");
    setThoughtsOpen(true);
    setThoughtsText("");
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => setSelected(null), 200);
    setThoughtsOpen(false);
  }

  // ESC closes drawer / adjust
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (adjustOpen) setAdjustOpen(false);
        if (drawerOpen) closeDrawer();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, adjustOpen]);

  function setImportance(id: string, importance: 1 | 2 | 3 | 4 | 5) {
    // Only demo days have data
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();

    if (y === 2026 && m === 0 && d === 12) {
      setTodayEvents((prev) => prev.map((e) => (e.id === id ? { ...e, importance } : e)));
    }
    if (y === 2026 && m === 0 && d === 13) {
      setTomorrowEvents((prev) => prev.map((e) => (e.id === id ? { ...e, importance } : e)));
    }
    if (selected?.id === id) setSelected((s) => (s ? { ...s, importance } : s));
  }

  function removeEvent(id: string) {
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();

    if (y === 2026 && m === 0 && d === 12) setTodayEvents((prev) => prev.filter((e) => e.id !== id));
    if (y === 2026 && m === 0 && d === 13) setTomorrowEvents((prev) => prev.filter((e) => e.id !== id));
    if (selected?.id === id) closeDrawer();
  }

  function addEvent() {
    if (!addForm.title.trim()) return;

    // UI shell: only add to demo days
    const y = selectedDate.getFullYear();
    const m = selectedDate.getMonth();
    const d = selectedDate.getDate();
    if (!(y === 2026 && m === 0 && (d === 12 || d === 13))) return;

    const newEv: EventRecord = {
      id: uid(),
      type: addForm.type,
      tag: addForm.tag,
      time: addForm.time.trim(),
      endTime: addForm.endTime.trim(),
      title: addForm.title.trim(),
      meta: addForm.meta.trim() || "—",
      completed: false,
      importance: addForm.importance,
    };

    if (d === 12) {
      setTodayEvents((prev) => [...prev, newEv].sort((a, b) => timeSort(a.time) - timeSort(b.time)));
    } else {
      setTomorrowEvents((prev) => [...prev, newEv].sort((a, b) => timeSort(a.time) - timeSort(b.time)));
    }
    setAddForm((p) => ({ ...p, title: "", meta: "" }));
  }

  function sendQuickChat() {
    const text = quickChat.trim();
    if (!text) return;
    setQuickChat("");
    alert(`UI shell — would send to assistant:\n\n"${text}"`);
  }

  // NO FREE TIME BLOCKS: just sorted events
  const activeBlocks = useMemo(() => buildBlocksWithFreeTime(activeEvents), [activeEvents]);

  // Mini month calendar (every day clickable)
  const miniCal = useMemo(() => {
    const year = displayMonthDate.getFullYear();
    const month = displayMonthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; isActive?: boolean }> = [];
    for (let i = 0; i < 42; i++) cells.push({ day: null });

    let cursor = 1;
    for (let i = startDow; i < startDow + daysInMonth; i++) {
      const dayNum = cursor++;
      const cellDate = new Date(year, month, dayNum);
      const isActive = sameYMD(cellDate, selectedDate);
      cells[i] = { day: dayNum, isActive };
    }

    const monthLabel = displayMonthDate.toLocaleString(undefined, { month: "long", year: "numeric" });

    return { monthLabel, cells };
  }, [displayMonthDate, selectedDate]);

  // Week dates (7 days) for week view UI
  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    // Sunday-start week (clean + matches your mini calendar rows)
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [selectedDate]);

  function eventsForDate(d: Date) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    if (y === 2026 && m === 0 && day === 12) return todayEvents;
    if (y === 2026 && m === 0 && day === 13) return tomorrowEvents;
    return [] as EventRecord[];
  }

  function openDayFromWeek(d: Date) {
    setSelectedDate(d);
    setViewSpan("Day");
  }

  return (
    <main className="h-screen bg-white text-neutral-950 overflow-hidden">
      {/* very subtle ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${rgbaBrand(0.22)}, rgba(255,255,255,0) 60%)`,
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-20 bg-black/10" />
      </div>

      <div className="relative flex h-full">
        {/* LEFT SIDEBAR */}
        <div
          className={cx(
            "h-full border-r bg-white/70 backdrop-blur-sm transition-[width] duration-200",
            leftOpen ? "w-[320px]" : "w-[56px]"
          )}
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="h-full flex flex-col">
            {/* sidebar header */}
            <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2">
                {/* CHANGED: Control Center icon button (not arrow) */}
                <button
                  onClick={() => setLeftOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  style={surfaceSoftStyle}
                  aria-label="Toggle Control Center"
                  title="Control Center"
                >
                  <SlidersHorizontal size={18} />
                </button>

                {leftOpen && (
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">Control Center</div>
                    <div className="text-xs text-neutral-500">Focus, calendar, reminders, assistant</div>
                  </div>
                )}
              </div>
            </div>

            {/* ONLY render content when open (collapsed = icon only) */}
            {leftOpen ? (
              <>
                <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                  {/* 1) Focus */}
                  <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Focus</div>
                        <div className="text-[11px] text-neutral-500">{focusMode === "Auto" ? "auto" : "manual"}</div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(["Auto", "Morning", "Afternoon", "Evening"] as const).map((k) => {
                          const active = focusMode === k;
                          return (
                            <button
                              key={k}
                              onClick={() => setFocusMode(k)}
                              className={cx(
                                "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                                active ? "bg-black/[0.03]" : "bg-white hover:bg-black/[0.03]"
                              )}
                              style={{
                                borderColor: active ? rgbaBrand(0.22) : "rgba(0,0,0,0.08)",
                                boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
                              }}
                            >
                              {k}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-sm text-neutral-800 leading-relaxed">{focusCopy}</div>

                      <div className="mt-3 flex gap-2">
                        <button
                          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                          style={surfaceSoftStyle}
                          onClick={() => alert("UI shell")}
                        >
                          Build blocks
                        </button>
                        <button
                          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                          style={surfaceSoftStyle}
                          onClick={() => alert("UI shell")}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2) Calendar */}
                  <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{miniCal.monthLabel}</div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setMiniMonthOffset((v) => v - 1)}
                            className="h-8 w-8 rounded-xl border bg-white hover:bg-black/[0.03] transition"
                            style={surfaceSoftStyle}
                            aria-label="Previous month"
                          >
                            ←
                          </button>
                          <button
                            onClick={() => setMiniMonthOffset((v) => v + 1)}
                            className="h-8 w-8 rounded-xl border bg-white hover:bg-black/[0.03] transition"
                            style={surfaceSoftStyle}
                            aria-label="Next month"
                          >
                            →
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-7 gap-1 text-[11px] text-neutral-500">
                        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                          <div key={`${d}-${i}`} className="text-center py-1">
                            {d}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {miniCal.cells.map((c, idx) => {
                          const active = !!c.isActive;
                          const isEmpty = !c.day;

                          return (
                            <button
                              key={idx}
                              onClick={() => (c.day ? setSelectedDayInDisplayedMonth(c.day) : null)}
                              className={cx(
                                "h-9 rounded-xl text-[12px] border transition",
                                isEmpty ? "opacity-0 cursor-default" : "hover:bg-black/[0.03]",
                                active ? "font-semibold" : "font-medium"
                              )}
                              style={{
                                borderColor: active ? rgbaBrand(0.30) : "rgba(0,0,0,0.06)",
                                background: active ? rgbaBrand(0.10) : "white",
                                color: isEmpty ? "transparent" : "rgba(0,0,0,0.84)",
                                boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.10)}` : undefined,
                              }}
                              disabled={isEmpty}
                              aria-label={c.day ? `Day ${c.day}` : "Empty"}
                              title={c.day ? "Open this day" : ""}
                            >
                              {c.day ?? ""}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-[11px] text-neutral-500">
                        Any day is selectable. Only 12–13 have demo events (others are blank for now).
                      </div>
                    </div>
                  </div>

                  {/* 3) Reminders */}
                  <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Reminders</div>
                        <span
                          className="inline-flex items-center justify-center h-7 px-2.5 rounded-full border text-[11px] font-semibold"
                          style={{
                            borderColor: "rgba(0,0,0,0.10)",
                            background: "rgba(0,0,0,0.03)",
                            color: "rgba(0,0,0,0.70)",
                          }}
                        >
                          {reminders.length}
                        </span>
                      </div>

                      <div className="mt-3 space-y-2">
                        {reminders.slice(0, 4).map((r) => (
                          <button
                            key={r.id}
                            onClick={() => alert("UI shell — open reminders inbox")}
                            className="w-full text-left rounded-2xl border bg-white px-3 py-2 hover:bg-black/[0.03] transition"
                            style={surfaceSoftStyle}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold truncate">{r.title}</div>
                              <span className="text-[11px] text-neutral-500 shrink-0">{r.due}</span>
                            </div>
                            <div className="mt-1 text-[11px] text-neutral-500">{r.severity ?? "Medium"}</div>
                          </button>
                        ))}

                        <button
                          onClick={() => alert("UI shell — open reminders inbox")}
                          className="w-full rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                          style={surfaceSoftStyle}
                        >
                          Open inbox
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4) Schedule assistant */}
                  <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">Schedule assistant</div>
                        <div className="text-[11px] text-neutral-500">quick</div>
                      </div>

                      <div className="mt-2 text-sm text-neutral-800 leading-relaxed">Conflicts, swaps, or rebalancing your day.</div>

                      <div className="mt-3 rounded-2xl border px-3 py-3 bg-white" style={surfaceSoftStyle}>
                        <textarea
                          ref={quickChatRef}
                          value={quickChat}
                          onChange={(e) => setQuickChat(e.target.value)}
                          placeholder='Example: "Move gym to 5pm and add 30min deep work after class."'
                          rows={1}
                          className="w-full resize-none bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400 leading-relaxed"
                          style={{ height: 0 }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendQuickChat();
                            }
                          }}
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-neutral-500">Enter to send • Shift+Enter for new line</span>
                          <button
                            onClick={sendQuickChat}
                            disabled={!quickChat.trim()}
                            className={cx(
                              "ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold border transition",
                              quickChat.trim() ? "bg-white hover:bg-black/[0.03]" : "bg-white text-neutral-400 cursor-not-allowed"
                            )}
                            style={surfaceSoftStyle}
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Link
                          href="/chat"
                          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                          style={surfaceSoftStyle}
                        >
                          Open Chat
                        </Link>
                        <button
                          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                          style={surfaceSoftStyle}
                          onClick={() => setQuickChat("")}
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* footer (open only) */}
                <div className="px-3 py-3 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <div className="flex items-center gap-2">
                    <button
                      className="flex-1 rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition text-center"
                      style={surfaceSoftStyle}
                      onClick={() => setAdjustOpen(true)}
                    >
                      Adjust
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col h-full">
          {/* Top controls */}
          <div className="border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-wrap items-center gap-3">
              {/* Day nav */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => shiftSelectedDay(-1)}
                  className="h-10 w-10 rounded-2xl border bg-white transition flex items-center justify-center hover:bg-black/[0.03]"
                  style={surfaceSoftStyle}
                  aria-label="Previous day"
                >
                  ←
                </button>

                <button
                  onClick={() => setSelectedDate(new Date(2026, 0, 12))}
                  className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                  style={surfaceSoftStyle}
                >
                  Today
                </button>

                <button
                  onClick={() => shiftSelectedDay(1)}
                  className="h-10 w-10 rounded-2xl border bg-white transition flex items-center justify-center hover:bg-black/[0.03]"
                  style={surfaceSoftStyle}
                  aria-label="Next day"
                >
                  →
                </button>

                <div className="ml-2">
                  <div className="text-sm font-semibold">{selectedLabel.line1}</div>
                  <div className="text-xs text-neutral-500">{selectedLabel.line2}</div>
                </div>
              </div>

              <div className="flex-1" />

              {/* View toggles */}
              <div className="flex items-center gap-2 flex-wrap">
                <Segment value={viewSpan} options={["Day", "Week"]} onChange={(v) => setViewSpan(v as ViewSpan)} />
                <Segment value={viewFormat} options={["Schedule", "List"]} onChange={(v) => setViewFormat(v as ViewFormat)} />

                {/* REMOVED: Free time pill */}
                <button
                  onClick={() => setAdjustOpen(true)}
                  className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition flex items-center gap-2"
                  style={surfaceSoftStyle}
                >
                  <SlidersHorizontal size={16} />
                  Adjust
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-10">
              <section>
                {viewSpan === "Day" ? (
                  <>
                    {viewFormat === "Schedule" ? (
                      <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold">Schedule</div>
                              <div className="text-xs text-neutral-500">One day at a time · timeline view</div>
                            </div>
                            <div className="text-[11px] text-neutral-500">{activeEvents.length} items</div>
                          </div>

                          <div className="mt-5">
                            {activeBlocks.length ? (
                              <TimelineWithDaypartsLight
                                blocks={activeBlocks}
                                olive={JYNX_GREEN}
                                onToggleComplete={(id) => toggleComplete(id)}
                                onOpen={openDrawer}
                              />
                            ) : (
                              <BlankDayCard />
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className="text-sm font-semibold">List</div>
                              <div className="text-xs text-neutral-500">Clean rows · checkbox completes</div>
                            </div>
                            <div className="text-[11px] text-neutral-500">{activeEvents.length} items</div>
                          </div>

                          <div className="mt-5 space-y-2">
                            {activeBlocks.length ? (
                              activeBlocks.map((e) => (
                                <ListRow
                                  key={e.id}
                                  event={e}
                                  onToggle={() => toggleComplete(e.id)}
                                  onOpen={() => openDrawer(e)}
                                  olive={JYNX_GREEN}
                                />
                              ))
                            ) : (
                              <BlankDayList />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : viewFormat === "List" ? (
                  // CHANGED: Week + List is now a readable vertical list grouped by day
                  <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">Week</div>
                          <div className="text-xs text-neutral-500">Readable list · grouped by day</div>
                        </div>
                        <div className="text-[11px] text-neutral-500">7 days</div>
                      </div>

                      <div className="mt-5 space-y-4">
                        {weekDates.map((d) => {
                          const events = eventsForDate(d);
                          const blocks = buildBlocksWithFreeTime(events);
                          const isActive = sameYMD(d, selectedDate);

                          return (
                            <div
                              key={d.toISOString()}
                              className="rounded-3xl border bg-white"
                              style={{
                                ...surfaceSoftStyle,
                                borderColor: isActive ? rgbaBrand(0.28) : (surfaceSoftStyle.borderColor as string),
                                boxShadow: isActive ? `0 0 0 1px ${rgbaBrand(0.10)}` : surfaceSoftStyle.boxShadow,
                              }}
                            >
                              <div className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold">
                                      {d.toLocaleString(undefined, { weekday: "long" })}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                      {d.toLocaleString(undefined, { month: "short" })} {d.getDate()}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <div className="text-[11px] text-neutral-500">{events.length} items</div>
                                    <button
                                      onClick={() => openDayFromWeek(d)}
                                      className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                      style={surfaceSoftStyle}
                                    >
                                      Open day
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                  {blocks.length ? (
                                    blocks.map((e) => (
                                      <ListRow
                                        key={e.id}
                                        event={e}
                                        onToggle={() => {
                                          setSelectedDate(d);
                                          setTimeout(() => toggleComplete(e.id), 0);
                                        }}
                                        onOpen={() => {
                                          setSelectedDate(d);
                                          setTimeout(() => openDrawer(e), 0);
                                        }}
                                        olive={JYNX_GREEN}
                                      />
                                    ))
                                  ) : (
                                    <div
                                      className="rounded-2xl border bg-white px-3 py-3 text-sm text-neutral-600"
                                      style={surfaceSoftStyle}
                                    >
                                      Nothing scheduled
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-3 text-[11px] text-neutral-500">
                        Tip: This is the “readable week list” mode. If you flip to Week + Schedule, you still get the timeline-style preview.
                      </div>
                    </div>
                  </div>
                ) : (
                  // Week + Schedule (keep the original horizontal preview)
                  <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">Week</div>
                          <div className="text-xs text-neutral-500">7-day preview · tap “Open day” to drill in</div>
                        </div>
                        <div className="text-[11px] text-neutral-500">Schedule preview</div>
                      </div>

                      <div className="mt-5 overflow-x-auto">
                        <div className="flex gap-4 min-w-max pb-1">
                          {weekDates.map((d) => {
                            const events = eventsForDate(d);
                            const blocks = buildBlocksWithFreeTime(events);
                            const isActive = sameYMD(d, selectedDate);

                            return (
                              <div
                                key={d.toISOString()}
                                className={cx("w-[360px] shrink-0 rounded-3xl border bg-white", isActive ? "ring-1" : "")}
                                style={{
                                  ...surfaceSoftStyle,
                                  borderColor: isActive ? rgbaBrand(0.28) : (surfaceSoftStyle.borderColor as string),
                                  boxShadow: isActive ? `0 0 0 1px ${rgbaBrand(0.10)}` : surfaceSoftStyle.boxShadow,
                                }}
                              >
                                <div className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold">
                                        {d.toLocaleString(undefined, { weekday: "long" })}
                                      </div>
                                      <div className="text-xs text-neutral-500">
                                        {d.toLocaleString(undefined, { month: "short" })} {d.getDate()}
                                      </div>
                                    </div>
                                    <div className="text-[11px] text-neutral-500">{events.length} items</div>
                                  </div>

                                  <div className="mt-4">
                                    {blocks.length ? (
                                      <TimelineWithDaypartsLight
                                        blocks={blocks}
                                        olive={JYNX_GREEN}
                                        onToggleComplete={(id) => {
                                          setSelectedDate(d);
                                          setTimeout(() => toggleComplete(id), 0);
                                        }}
                                        onOpen={(ev) => {
                                          setSelectedDate(d);
                                          setTimeout(() => openDrawer(ev), 0);
                                        }}
                                        compact
                                      />
                                    ) : (
                                      <div
                                        className="rounded-2xl border bg-white px-3 py-3 text-sm text-neutral-600"
                                        style={surfaceSoftStyle}
                                      >
                                        Nothing scheduled
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => openDayFromWeek(d)}
                                    className="mt-4 w-full rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                    style={surfaceSoftStyle}
                                  >
                                    Open day
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-3 text-[11px] text-neutral-500">
                        Tip: Week view scrolls horizontally. We’ll swap this to a true full-week grid once your real schedule data is wired.
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>

        {/* Drawer overlay */}
        {drawerOpen && (
          <button
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
            onClick={closeDrawer}
            aria-label="Close drawer"
          />
        )}

        {/* Drawer */}
        <div
          className={cx(
            "fixed top-0 right-0 h-full w-[420px] max-w-[92vw] z-50",
            "border-l bg-white/92 backdrop-blur",
            "transition-transform duration-200",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
          style={{
            borderColor: "rgba(0,0,0,0.08)",
            boxShadow: "-24px 0 80px rgba(0,0,0,0.10)",
          }}
        >
          <div className="h-full flex flex-col">
            {/* Drawer header */}
            <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-2xl border bg-white flex items-center justify-center text-sm font-semibold"
                  style={surfaceSoftStyle}
                >
                  {selected?.tag?.slice(0, 1) ?? "E"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">{selected?.title ?? "Event"}</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {formatRange(selected?.time, selected?.endTime)}
                    {selected?.location ? ` · ${selected.location}` : ""}
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {selected?.tag && (
                      <span
                        className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                        style={getTagStyleLight(selected.tag)}
                      >
                        {selected.tag}
                      </span>
                    )}

                    {/* Importance control */}
                    {selected?.id && (
                      <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-1.5" style={surfaceSoftStyle}>
                        <span className="text-[11px] text-neutral-500">Importance</span>
                        <select
                          value={getImportanceLabel(selected.importance)}
                          onChange={(e) => {
                            const tier = e.target.value as "Low" | "Medium" | "High";
                            const mapped: 1 | 2 | 3 | 4 | 5 = tier === "High" ? 4 : tier === "Low" ? 2 : 3;
                            setImportance(selected.id, mapped);
                          }}
                          className="bg-transparent text-[11px] text-neutral-800 outline-none"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="rounded-xl px-2 py-1 text-xs border bg-white hover:bg-black/[0.03] transition"
                  style={surfaceSoftStyle}
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {(["Overview", "Assignments", "Files", "Notes"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDrawerTab(t)}
                    className={cx(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                      drawerTab === t ? "bg-black/[0.03]" : "bg-white hover:bg-black/[0.03]"
                    )}
                    style={{
                      borderColor: drawerTab === t ? rgbaBrand(0.22) : "rgba(0,0,0,0.08)",
                      boxShadow: drawerTab === t ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Thoughts mini card */}
              {thoughtsOpen && (
                <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Thoughts?</div>
                      <button className="text-[11px] text-neutral-500 hover:text-neutral-800" onClick={() => setThoughtsOpen(false)}>
                        hide
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-neutral-500">Quick note to yourself (or something you want the assistant to remember).</div>
                    <textarea
                      value={thoughtsText}
                      onChange={(e) => setThoughtsText(e.target.value)}
                      placeholder="e.g., Ask about CAPM intuition in office hours…"
                      className="mt-3 w-full rounded-2xl border bg-white px-3 py-3 text-sm outline-none placeholder:text-neutral-400 resize-none"
                      style={surfaceSoftStyle}
                      rows={3}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                        style={surfaceSoftStyle}
                        onClick={() => alert("UI shell — would save note")}
                        disabled={!thoughtsText.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                        style={surfaceSoftStyle}
                        onClick={() => setThoughtsText("")}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <DrawerContentLight selected={selected} tab={drawerTab} />
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t bg-white/80" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex gap-2">
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                  style={surfaceSoftStyle}
                  onClick={() => alert("UI shell — Edit event")}
                >
                  Edit
                </button>
                {selected?.id && (
                  <button
                    className="rounded-2xl px-4 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                    style={surfaceSoftStyle}
                    onClick={() => removeEvent(selected.id)}
                  >
                    Drop
                  </button>
                )}
                <div className="ml-auto" />
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                  style={surfaceSoftStyle}
                  onClick={closeDrawer}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Adjust overlay */}
        {adjustOpen && (
          <>
            <button
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60]"
              style={{ animation: "fadeIn 180ms ease-out" }}
              onClick={() => setAdjustOpen(false)}
              aria-label="Close adjust"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div
                className="relative rounded-3xl border bg-white/92 backdrop-blur overflow-hidden"
                style={{
                  width: adjustW,
                  height: adjustH,
                  borderColor: "rgba(0,0,0,0.10)",
                  boxShadow: "0 30px 120px rgba(0,0,0,0.18)",
                  animation: "fadeScaleIn 220ms ease-out",
                }}
              >
                <div className="px-5 py-4 border-b flex items-center" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <div>
                    <div className="text-sm font-semibold">Adjust</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Focus protection and quick edits (UI shell).</div>
                  </div>
                  <button
                    onClick={() => setAdjustOpen(false)}
                    className="ml-auto rounded-xl px-2 py-1 text-xs border bg-white hover:bg-black/[0.03] transition"
                    style={surfaceSoftStyle}
                  >
                    ✕
                  </button>
                </div>

                {/* scroll area */}
                <div className="p-5 h-[calc(100%-56px-64px)] overflow-y-auto">
                  <div className="grid grid-cols-12 gap-4">
                    {/* Controls */}
                    <div className="col-span-12 md:col-span-6 space-y-4">
                      {/* REMOVED: Free time slider card */}

                      <div className="rounded-3xl border bg-white p-4 space-y-3" style={surfaceStyle}>
                        <ToggleRowLight
                          label="Protect focus blocks"
                          desc="Keeps deep work earlier, reduces interruptions."
                          value={protectFocus}
                          onChange={setProtectFocus}
                        />
                        <ToggleRowLight
                          label="Auto rebalance"
                          desc="When you add/drop, the day gets re-packed."
                          value={autoRebalance}
                          onChange={setAutoRebalance}
                        />
                      </div>

                      {/* Drop an event */}
                      <div className="rounded-3xl border bg-white p-4" style={surfaceStyle}>
                        <div className="text-sm font-semibold">Drop an event</div>
                        <div className="text-xs text-neutral-500 mt-1">Quick remove (UI shell).</div>
                        <div className="mt-3 space-y-2 max-h-[260px] overflow-auto pr-1">
                          {activeEvents.map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2"
                              style={surfaceSoftStyle}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-neutral-800 truncate">
                                  {formatRange(e.time, e.endTime)} · {e.title}
                                </div>
                                <div className="text-[11px] text-neutral-500 truncate">{e.meta}</div>
                              </div>
                              <button
                                onClick={() => removeEvent(e.id)}
                                className="rounded-xl px-2 py-1 text-[11px] font-semibold border bg-white hover:bg-black/[0.03] transition"
                                style={surfaceSoftStyle}
                              >
                                Drop
                              </button>
                            </div>
                          ))}
                          {!activeEvents.length ? <div className="text-xs text-neutral-500">No events on this day (yet).</div> : null}
                        </div>
                      </div>
                    </div>

                    {/* Add / Info */}
                    <div className="col-span-12 md:col-span-6 space-y-4">
                      <div className="rounded-3xl border bg-white p-4" style={surfaceStyle}>
                        <div className="text-sm font-semibold">Add an event</div>
                        <div className="text-xs text-neutral-500 mt-1">UI shell: only adds to demo days (Jan 12–13).</div>

                        <div className="mt-3 grid grid-cols-12 gap-2">
                          <div className="col-span-6">
                            <Label>Start</Label>
                            <input
                              value={addForm.time}
                              onChange={(e) => setAddForm((p) => ({ ...p, time: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={surfaceSoftStyle}
                            />
                          </div>
                          <div className="col-span-6">
                            <Label>End</Label>
                            <input
                              value={addForm.endTime}
                              onChange={(e) => setAddForm((p) => ({ ...p, endTime: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={surfaceSoftStyle}
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Title</Label>
                            <input
                              value={addForm.title}
                              onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={surfaceSoftStyle}
                              placeholder="e.g., Call Dylan"
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Meta</Label>
                            <input
                              value={addForm.meta}
                              onChange={(e) => setAddForm((p) => ({ ...p, meta: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={surfaceSoftStyle}
                              placeholder="e.g., 20 min · quick sync"
                            />
                          </div>

                          <div className="col-span-6">
                            <Label>Type</Label>
                            <select
                              value={addForm.type}
                              onChange={(e) => setAddForm((p) => ({ ...p, type: e.target.value as EventType }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={surfaceSoftStyle}
                            >
                              <option value="class">class</option>
                              <option value="work">work</option>
                              <option value="health">health</option>
                              <option value="prep">prep</option>
                              <option value="study">study</option>
                              <option value="life">life</option>
                            </select>
                          </div>

                          <div className="col-span-6">
                            <Label>Tag</Label>
                            <select
                              value={addForm.tag}
                              onChange={(e) => setAddForm((p) => ({ ...p, tag: e.target.value as any }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={surfaceSoftStyle}
                            >
                              <option>Class</option>
                              <option>Work</option>
                              <option>Health</option>
                              <option>Prep</option>
                              <option>Study</option>
                              <option>Life</option>
                            </select>
                          </div>

                          <div className="col-span-12">
                            <Label>Importance</Label>
                            <div className="mt-1 flex items-center gap-3">
                              <input
                                type="range"
                                min={1}
                                max={5}
                                value={addForm.importance}
                                onChange={(e) =>
                                  setAddForm((p) => ({
                                    ...p,
                                    importance: Number(e.target.value) as 1 | 2 | 3 | 4 | 5,
                                  }))
                                }
                                className="flex-1"
                                style={{ accentColor: JYNX_GREEN }}
                              />
                              <span className="text-sm text-neutral-800 w-16 text-right">{getImportanceLabel(addForm.importance)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={addEvent}
                            disabled={!addForm.title.trim()}
                            className={cx(
                              "rounded-2xl px-3 py-2 text-xs font-semibold border transition",
                              addForm.title.trim() ? "bg-white hover:bg-black/[0.03]" : "bg-white text-neutral-400 cursor-not-allowed"
                            )}
                            style={surfaceSoftStyle}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setAddForm((p) => ({ ...p, title: "", meta: "" }))}
                            className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                            style={surfaceSoftStyle}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      <div className="rounded-3xl border bg-white p-4" style={surfaceStyle}>
                        <div className="text-sm font-semibold">What this is (for now)</div>
                        <div className="mt-2 text-sm text-neutral-800 leading-relaxed">
                          This “Adjust” panel is the control center. Later it becomes the place where Jynx actually rebalances your day.
                        </div>
                        <div className="mt-3 text-xs text-neutral-500">
                          UI shell: protectFocus={String(protectFocus)} · autoRebalance={String(autoRebalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t flex items-center justify-end gap-2" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  <button
                    onClick={() => setAdjustOpen(false)}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                    style={surfaceSoftStyle}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => alert("UI shell — would apply rebalance")}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                    style={{
                      ...surfaceSoftStyle,
                      borderColor: rgbaBrand(0.22),
                      boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>

              <style jsx>{`
                @keyframes fadeIn {
                  from {
                    opacity: 0;
                  }
                  to {
                    opacity: 1;
                  }
                }
                @keyframes fadeScaleIn {
                  from {
                    opacity: 0;
                    transform: scale(0.985);
                  }
                  to {
                    opacity: 1;
                    transform: scale(1);
                  }
                }
              `}</style>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Segment({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="h-10 rounded-2xl border bg-white p-1 flex items-center gap-1" style={surfaceSoftStyle}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={cx("h-8 rounded-xl px-3 text-xs font-semibold transition", active ? "bg-black/[0.04]" : "hover:bg-black/[0.03]")}
            style={{
              border: "1px solid",
              borderColor: active ? rgbaBrand(0.22) : "rgba(0,0,0,0)",
              boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
              color: active ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.68)",
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function TimelineWithDaypartsLight({
  blocks,
  olive,
  onToggleComplete,
  onOpen,
  compact,
}: {
  blocks: EventRecord[];
  olive: string;
  onToggleComplete: (id: string) => void;
  onOpen: (ev: EventRecord) => void;
  compact?: boolean;
}) {
  const marks = useMemo(() => {
    const firstAfternoonIdx = blocks.findIndex((b) => timeSort(b.time) >= 12 * 60);
    const firstEveningIdx = blocks.findIndex((b) => timeSort(b.time) >= 17 * 60);
    return { firstAfternoonIdx, firstEveningIdx };
  }, [blocks]);

  return (
    <div className={cx("space-y-3", compact ? "opacity-95" : "")}>
      <DaypartLineLight label="MORNING" hint="Before noon" />
      <div className="space-y-3">
        {blocks.map((e, idx) => {
          const showAfternoon = idx === marks.firstAfternoonIdx && marks.firstAfternoonIdx !== -1;
          const showEvening = idx === marks.firstEveningIdx && marks.firstEveningIdx !== -1;
          return (
            <div key={e.id}>
              {showAfternoon ? <DaypartLineLight label="AFTERNOON" hint="12–5 PM" /> : null}
              {showEvening ? <DaypartLineLight label="EVENING" hint="After 5 PM" /> : null}
              <TimeBlockLight
                event={e}
                olive={olive}
                isLast={idx === blocks.length - 1}
                onToggleComplete={() => onToggleComplete(e.id)}
                onOpen={() => onOpen(e)}
                compact={compact}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DaypartLineLight({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-2">
      <div className="text-[11px] tracking-widest text-neutral-500 font-semibold">{label}</div>
      <div className="h-px flex-1" style={{ background: "rgba(0,0,0,0.06)" }} />
      {hint ? <div className="text-[11px] text-neutral-500">{hint}</div> : null}
    </div>
  );
}

function DrawerContentLight({
  selected,
  tab,
}: {
  selected: EventRecord | null;
  tab: "Overview" | "Files" | "Assignments" | "Notes";
}) {
  if (!selected) return <div className="text-sm text-neutral-500">Select an event to view details.</div>;

  const type = selected.type;
  const classD = selected.details?.class;
  const workD = selected.details?.work;
  const healthD = selected.details?.health;

  if (tab === "Overview") {
    return (
      <div className="space-y-4">
        <PanelLight title="Overview" subtitle="high-level details">
          <div className="text-sm text-neutral-800 leading-relaxed">{selected.meta}</div>

          {type === "class" && classD && (
            <div className="mt-4 space-y-2 text-sm">
              <InfoRowLight label="Instructor" value={classD.instructor} />
              <InfoRowLight label="Email" value={classD.email ?? "—"} />
              <InfoRowLight label="Room" value={classD.room} />
              <InfoRowLight label="Meets" value={classD.meetingPattern} />
              <div className="mt-3 text-xs text-neutral-500">Summary</div>
              <div className="text-sm text-neutral-800 leading-relaxed">{classD.shortSummary}</div>
            </div>
          )}

          {type === "work" && workD && (
            <div className="mt-4 space-y-2 text-sm">
              <InfoRowLight label="Owner" value={workD.owner ?? "—"} />
              <InfoRowLight label="Priority" value={workD.priority ?? "—"} />
              {workD.deliverables?.length ? (
                <>
                  <div className="mt-3 text-xs text-neutral-500">Deliverables</div>
                  <ul className="text-sm text-neutral-800 list-disc pl-5 space-y-1">
                    {workD.deliverables.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </>
              ) : null}
            </div>
          )}

          {type === "health" && healthD && (
            <div className="mt-4 space-y-2 text-sm">
              <InfoRowLight label="Duration" value={healthD.duration ?? "—"} />
              {healthD.plan?.length ? (
                <>
                  <div className="mt-3 text-xs text-neutral-500">Plan</div>
                  <ul className="text-sm text-neutral-800 list-disc pl-5 space-y-1">
                    {healthD.plan.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {healthD.notes ? (
                <>
                  <div className="mt-3 text-xs text-neutral-500">Notes</div>
                  <div className="text-sm text-neutral-800 leading-relaxed">{healthD.notes}</div>
                </>
              ) : null}
            </div>
          )}
        </PanelLight>

        {type === "class" && classD?.nextTopics?.length ? (
          <PanelLight title="Next topics" subtitle="coming up">
            <ul className="text-sm text-neutral-800 list-disc pl-5 space-y-1">
              {classD.nextTopics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </PanelLight>
        ) : null}
      </div>
    );
  }

  if (tab === "Assignments") {
    if (type === "class" && classD?.assignmentsDue?.length) {
      return (
        <PanelLight title="Assignments" subtitle="due soon">
          <div className="space-y-2">
            {classD.assignmentsDue.map((a) => (
              <div key={a.title} className="rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-neutral-900">{a.title}</div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border text-neutral-700" style={surfaceSoftStyle}>
                    {a.points ?? "—"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-500">Due: {a.due}</div>
              </div>
            ))}
          </div>
        </PanelLight>
      );
    }

    return (
      <PanelLight title="Assignments" subtitle="none found">
        <div className="text-sm text-neutral-500">This event type doesn’t have assignments yet.</div>
      </PanelLight>
    );
  }

  if (tab === "Files") {
    if (type === "class" && classD?.syllabusFiles?.length) {
      return (
        <PanelLight title="Files" subtitle="materials">
          <div className="space-y-2">
            {classD.syllabusFiles.map((f) => (
              <Link
                key={f.name}
                href={f.href}
                className="flex items-center justify-between rounded-2xl border bg-white px-3 py-3 hover:bg-black/[0.03] transition"
                style={surfaceSoftStyle}
              >
                <div className="text-sm text-neutral-900">{f.name}</div>
                <div className="text-xs text-neutral-500">open</div>
              </Link>
            ))}
          </div>
        </PanelLight>
      );
    }

    if (type === "work" && workD?.links?.length) {
      return (
        <PanelLight title="Links" subtitle="resources">
          <div className="space-y-2">
            {workD.links.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="flex items-center justify-between rounded-2xl border bg-white px-3 py-3 hover:bg-black/[0.03] transition"
                style={surfaceSoftStyle}
              >
                <div className="text-sm text-neutral-900">{l.name}</div>
                <div className="text-xs text-neutral-500">open</div>
              </Link>
            ))}
          </div>
        </PanelLight>
      );
    }

    return (
      <PanelLight title="Files" subtitle="not available yet">
        <div className="text-sm text-neutral-500">Wire this to your Files tab later.</div>
      </PanelLight>
    );
  }

  return (
    <PanelLight title="Notes" subtitle="freeform">
      <textarea
        className="w-full rounded-2xl border bg-white px-3 py-3 text-sm outline-none placeholder:text-neutral-400 resize-none"
        style={surfaceSoftStyle}
        rows={6}
        placeholder="Add notes for this event…"
        defaultValue=""
      />
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
          onClick={() => alert("UI shell — save notes")}
        >
          Save
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
          onClick={() => alert("UI shell — clear notes")}
        >
          Clear
        </button>
      </div>
    </PanelLight>
  );
}

function PanelLight({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border bg-white" style={surfaceStyle}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? <div className="text-[11px] text-neutral-500">{subtitle}</div> : null}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function InfoRowLight({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-sm text-neutral-800 text-right">{value}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-neutral-500 font-medium">{children}</div>;
}

function ToggleRowLight({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-start gap-3 rounded-2xl border bg-white px-3 py-3 hover:bg-black/[0.03] transition text-left"
      style={surfaceSoftStyle}
    >
      <div
        className="mt-0.5 h-4 w-7 rounded-full border relative"
        style={{
          borderColor: "rgba(0,0,0,0.10)",
          background: value ? rgbaBrand(0.16) : "rgba(0,0,0,0.04)",
          boxShadow: value ? `0 0 0 1px ${rgbaBrand(0.10)}` : undefined,
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full"
          style={{
            left: value ? 16 : 2,
            background: value ? "rgba(25,25,25,0.92)" : "rgba(0,0,0,0.35)",
            transition: "left 140ms ease",
          }}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-neutral-900">{label}</div>
        <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

function TimeBlockLight({
  event,
  olive,
  onToggleComplete,
  onOpen,
  isLast,
  compact,
}: {
  event: EventRecord;
  olive: string;
  onToggleComplete: () => void;
  onOpen: () => void;
  isLast?: boolean;
  compact?: boolean;
}) {
  const completed = !!event.completed;

  const cardStyle: CSSProperties = completed
    ? {
        opacity: 0.92,
        borderColor: "rgba(0,0,0,0.08)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
      }
    : {
        opacity: 1,
        borderColor: "rgba(0,0,0,0.08)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
      };

  const importanceLevel = getImportanceLabel(event.importance);

  const dotBg = completed ? "rgba(0,0,0,0.12)" : olive;
  const dotShadow = completed ? "0 0 0 1px rgba(0,0,0,0.10)" : `0 0 0 1px ${rgbaBrand(0.38)}, 0 0 20px ${rgbaBrand(0.14)}`;

  return (
    <div className={cx("relative pl-8", compact ? "opacity-95" : "")}>
      {/* connector line */}
      <div
        className="absolute left-[10px] top-0 bottom-0 w-[2px]"
        style={{
          background: isLast
            ? "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.00))"
            : "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.08))",
        }}
      />

      {/* DOT — (Schedule keeps dots) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleComplete();
        }}
        className="absolute left-[1px] top-1/2 -translate-y-1/2 h-[18px] w-[18px] rounded-full ring-[7px] transition z-10 flex items-center justify-center cursor-pointer"
        style={{ backgroundColor: dotBg, boxShadow: dotShadow }}
        aria-label={completed ? "Mark as not complete" : "Mark as complete"}
        title={completed ? "Mark as not complete" : "Mark as complete"}
      >
        {completed && (
          <svg viewBox="0 0 20 20" fill="none" className="h-[11px] w-[11px]" aria-hidden="true">
            <path
              d="M16.5 6.0L8.5 14.0L4.0 9.5"
              stroke="rgba(255,255,255,0.95)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={onOpen}
        className={cx(
          "group w-full text-left rounded-3xl border px-4 py-3 transition relative overflow-hidden",
          "bg-white hover:bg-black/[0.02] hover:-translate-y-[1px]"
        )}
        style={cardStyle}
      >
        {/* COMPLETED overlay — obvious, with blur and text */}
        {completed && (
          <div className="pointer-events-none absolute inset-0 rounded-3xl">
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${rgbaBrand(0.22)}, rgba(255,255,255,0.55))`,
                backdropFilter: "blur(6px)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="px-4 py-2 rounded-2xl border text-[11px] font-extrabold tracking-[0.22em]"
                style={{
                  borderColor: rgbaBrand(0.32),
                  background: "rgba(255,255,255,0.75)",
                  color: "rgba(0,0,0,0.72)",
                  boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
                }}
              >
                COMPLETED
              </div>
            </div>
          </div>
        )}

        <div className="text-[11px] text-neutral-500 mb-1 relative z-[1]">{formatRange(event.time, event.endTime)}</div>

        <div className="flex justify-between items-center gap-4 relative z-[1]">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-neutral-900 truncate">{event.title}</div>
            <div className="text-xs text-neutral-500 mt-1 truncate">{event.meta}</div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
              style={getImportancePillStyleLight(importanceLevel)}
            >
              {importanceLevel}
            </span>

            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
              style={getTagStyleLight(event.tag)}
            >
              {event.tag}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

/**
 * CHANGED: ListRow now uses an EMPTY SQUARE CHECKBOX (black outline),
 * and when checked it shows the same “COMPLETED” overlay feel as Schedule.
 */
function ListRow({
  event,
  onToggle,
  onOpen,
  compact,
}: {
  event: EventRecord;
  onToggle: () => void;
  onOpen: () => void;
  olive: string;
  compact?: boolean;
}) {
  const importanceLevel = getImportanceLabel(event.importance);
  const completed = !!event.completed;

  return (
    <div className={cx("rounded-2xl border bg-white relative overflow-hidden", compact ? "opacity-95" : "")} style={surfaceSoftStyle}>
      {/* COMPLETED overlay */}
      {completed && (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${rgbaBrand(0.20)}, rgba(255,255,255,0.60))`,
              backdropFilter: "blur(6px)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="px-4 py-2 rounded-2xl border text-[11px] font-extrabold tracking-[0.22em]"
              style={{
                borderColor: rgbaBrand(0.32),
                background: "rgba(255,255,255,0.78)",
                color: "rgba(0,0,0,0.72)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
              }}
            >
              COMPLETED
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 px-3 py-2 relative z-[1]">
        {/* square checkbox */}
        <button
          type="button"
          onClick={onToggle}
          className="h-[18px] w-[18px] rounded-[5px] border flex items-center justify-center transition"
          style={{
            borderColor: "rgba(0,0,0,0.55)",
            background: completed ? "rgba(0,0,0,0.82)" : "rgba(255,255,255,0.95)",
            boxShadow: completed ? "0 0 0 1px rgba(0,0,0,0.10)" : "0 0 0 1px rgba(0,0,0,0.04)",
          }}
          aria-label={completed ? "Mark as not complete" : "Mark as complete"}
          title={completed ? "Mark as not complete" : "Mark as complete"}
        >
          {completed ? (
            <svg viewBox="0 0 20 20" fill="none" className="h-[12px] w-[12px]" aria-hidden="true">
              <path
                d="M16.5 6.0L8.5 14.0L4.0 9.5"
                stroke="rgba(255,255,255,0.95)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : null}
        </button>

        <div className="w-[120px] text-xs text-neutral-500">{formatRange(event.time, event.endTime)}</div>

        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
          <div className="text-sm font-semibold text-neutral-900 truncate">{event.title}</div>
          <div className="text-xs text-neutral-500 truncate">{event.meta}</div>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="hidden sm:inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
            style={getImportancePillStyleLight(importanceLevel)}
          >
            {importanceLevel}
          </span>
          <span
            className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
            style={getTagStyleLight(event.tag)}
          >
            {event.tag}
          </span>
        </div>
      </div>
    </div>
  );
}

function BlankDayCard() {
  return (
    <div className="rounded-3xl border bg-white p-6" style={surfaceSoftStyle}>
      <div className="text-sm font-semibold text-neutral-900">No events yet</div>
      <div className="mt-1 text-sm text-neutral-600 leading-relaxed">This day is blank right now. Later this will populate from your real schedule data.</div>
      <div className="mt-4 flex gap-2">
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
          onClick={() => alert("UI shell — add event")}
        >
          Add event
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
          onClick={() => alert("UI shell — build blocks")}
        >
          Build blocks
        </button>
      </div>
    </div>
  );
}

function BlankDayList() {
  return (
    <div className="rounded-2xl border bg-white p-5" style={surfaceSoftStyle}>
      <div className="text-sm font-semibold text-neutral-900">Nothing scheduled</div>
      <div className="mt-1 text-sm text-neutral-600">Pick another day or add your first event.</div>
    </div>
  );
}

function formatRange(start?: string, end?: string) {
  if (!start && !end) return "—";
  if (start && end) return `${start}–${end}`;
  return start ?? end ?? "—";
}

/** NO free-time blocks: just sort and return actual events */
function buildBlocksWithFreeTime(events: EventRecord[]) {
  return [...events].sort((a, b) => timeSort(a.time) - timeSort(b.time));
}

function timeSort(t: string) {
  const m = t.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (!m) return 999999;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2] ?? "0", 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && hh !== 12) hh += 12;
  if (ap === "AM" && hh === 12) hh = 0;
  return hh * 60 + mm;
}
