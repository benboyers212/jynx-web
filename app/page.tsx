"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Menu, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTheme } from "./ThemeContext";
import LandingPage from "./landing";
import { EventDetailModal } from "@/components/events/EventDetailModal";

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

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Plan your work for today and every day, then work your plan.", author: "Leonid Brezhnev" },
  { text: "Focus is the new intelligence.", author: "Cal Newport" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "The art of progress is to preserve order amid change.", author: "Francis Bacon" },
  { text: "Clarity is not the absence of busyness — it's knowing your priorities.", author: "Unknown" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "A goal without a plan is just a wish.", author: "Antoine de Saint-Exupéry" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
];

const PIE_LABELS: Record<string, string> = {
  class: "Class",
  work: "Work",
  health: "Health",
  prep: "Prep",
  study: "Study",
  life: "Life",
  free: "Free time",
};

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

  importance?: 1 | 2 | 3 | 4 | 5;

  // internal only
  isFree?: boolean;
  _startAt?: string; // ISO string, used for date filtering
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
      backgroundColor: rgbaBrand(0.1),
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

function getSurfaceStyle(dark: boolean): CSSProperties {
  return {
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 1px 0 rgba(0,0,0,0.3), 0 18px 50px rgba(0,0,0,0.40)" : "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
  };
}

function getSurfaceSoftStyle(dark: boolean): CSSProperties {
  return {
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 0 0 1px rgba(0,0,0,0.15)" : "0 0 0 1px rgba(0,0,0,0.04)",
  };
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

// Format a Date to "9:30 AM" string (local time)
function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
}

// Parse "3:30 PM" + "2026-01-12" → Date (local time)
function timeStringToDate(time: string, dateStr: string): Date {
  const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  const base = new Date(dateStr + "T00:00:00");
  if (!m) return base;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  base.setHours(h, min, 0, 0);
  return base;
}

// Convert API ScheduleBlock to EventRecord
function mapApiEvent(e: any): EventRecord {
  const startDate = new Date(e.startAt);
  const endDate = new Date(e.endAt);
  const type = (e.eventType ?? "work") as EventType;
  const tagMap: Record<EventType, string> = {
    class: "Class", work: "Work", health: "Health",
    prep: "Prep", study: "Study", life: "Life", free: "Flexible",
  };
  return {
    id: e.id,
    type,
    tag: tagMap[type] ?? "Work",
    title: e.title,
    meta: e.description ?? "",
    time: formatTime(startDate),
    endTime: formatTime(endDate),
    location: e.location ?? undefined,
    completed: false,
    importance: 3,
    _startAt: e.startAt,
  };
}

type ViewSpan = "Day" | "Week";
type ViewFormat = "Timeline" | "List";

type Reminder = {
  id: string;
  title: string;
  due: string;
  severity?: "High" | "Medium" | "Low";
  completed?: boolean;
};

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const { dark } = useTheme();
  const router = useRouter();

  // Onboarding gate
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data?.dbUser?.onboardingCompleted) {
          router.replace("/onboarding");
        } else {
          setOnboardingChecked(true);
        }
      })
      .catch(() => setOnboardingChecked(true));
  }, [isLoaded, isSignedIn, router]);

  // ---------------------------
  // Events — fetched from API
  // ---------------------------
  const [allEvents, setAllEvents] = useState<EventRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((res) => {
        const raw: any[] = res?.data ?? res ?? [];
        setAllEvents(raw.map(mapApiEvent));
      })
      .catch(console.error)
      .finally(() => setLoadingEvents(false));
  }, []);

  // Reminders — fetched from API
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    fetch("/api/reminders")
      .then((r) => r.json())
      .then((res) => {
        const raw: any[] = Array.isArray(res?.reminders) ? res.reminders : [];
        setReminders(raw.filter((r) => r.enabled !== false).map((r) => ({
          id: r.id,
          title: r.title,
          due: r.date ? r.date : r.schedule ?? "",
          severity: undefined,
          completed: false,
        })));
      })
      .catch(console.error);
  }, []);

  // ---------------------------
  // Day selection (every day clickable)
  // ---------------------------
  const seed = useMemo(() => { const d = new Date(); d.setDate(1); return d; }, []);
  const [miniMonthOffset, setMiniMonthOffset] = useState(0);

  const displayMonthDate = useMemo(() => {
    const d = new Date(seed);
    d.setMonth(d.getMonth() + miniMonthOffset);
    d.setDate(1);
    return d;
  }, [seed, miniMonthOffset]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

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
      line1: selectedDate.toLocaleString(undefined, { weekday: "long" }),
      line2: `${label}, ${month} ${selectedDate.getDate()}`,
    };
  }, [selectedDate]);

  // Which events for the selected day?
  const activeEvents = useMemo(() => {
    return allEvents
      .filter((e) => e._startAt && sameYMD(new Date(e._startAt), selectedDate))
      .sort((a, b) => timeSort(a.time) - timeSort(b.time));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEvents, selectedDate]);

  function toggleComplete(id: string) {
    setAllEvents((prev) => prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e)));
  }

  // ---------------------------
  // Views
  // ---------------------------
  const [viewSpan, setViewSpan] = useState<ViewSpan>("Day");
  const [viewFormat, setViewFormat] = useState<ViewFormat>("Timeline");

  // Left sidebar (collapsible)
  const [leftOpen, setLeftOpen] = useState(true);

  // Auto-collapse sidebar on small viewports
  useEffect(() => {
    const check = () => { if (window.innerWidth < 768) setLeftOpen(false); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Event detail modal state
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [loadingEventData, setLoadingEventData] = useState(false);

  // Quick chat (assistant input)
  const [quickChat, setQuickChat] = useState("");
  const quickChatRef = useRef<HTMLTextAreaElement | null>(null);

  // Thoughts mini card

  // Today overview modal
  const [todayOpen, setTodayOpen] = useState(false);
  const [todayClicked, setTodayClicked] = useState(false);

  // Adjust modal (schedule controls)
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [protectFocus, setProtectFocus] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(true);

  const adjustW = "min(96vw, 1160px)";
  const adjustH = "min(86vh, 760px)";

  // Staged changes — committed only when Apply is pressed
  type StagedAddition = { ev: EventRecord; date: string };
  const [stagedAdditions, setStagedAdditions] = useState<StagedAddition[]>([]);
  const [stagedRemovals, setStagedRemovals] = useState<string[]>([]);

  // Reset staged state when Adjust opens; pre-fill date to selected day
  useEffect(() => {
    if (adjustOpen) {
      setStagedAdditions([]);
      setStagedRemovals([]);
      const y = selectedDate.getFullYear();
      const mo = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const d = String(selectedDate.getDate()).padStart(2, "0");
      setAddForm((p) => ({ ...p, date: `${y}-${mo}-${d}` }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjustOpen]);

  async function applyAdjust() {
    // Apply removals
    const toRemove = new Set(stagedRemovals);
    if (toRemove.size > 0) {
      setAllEvents((prev) => prev.filter((e) => !toRemove.has(e.id)));
      if (selected && toRemove.has(selected.id)) closeDrawer();
      for (const id of toRemove) {
        fetch(`/api/events/${id}`, { method: "DELETE" }).catch(console.error);
      }
    }

    // Apply additions — POST each to the API
    for (const { ev, date } of stagedAdditions) {
      if (!ev.title.trim() || !date) continue;
      const start = timeStringToDate(ev.time, date);
      const end = timeStringToDate(ev.endTime ?? ev.time, date);
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: ev.title,
            eventType: ev.type,
            startAt: start.toISOString(),
            endAt: end.toISOString(),
            description: ev.meta && ev.meta !== "—" ? ev.meta : null,
          }),
        });
        const body = await res.json();
        if (body?.data) {
          setAllEvents((prev) => [...prev, mapApiEvent(body.data)]);
        }
      } catch (err) {
        console.error("Failed to create event:", err);
      }
    }

    setStagedAdditions([]);
    setStagedRemovals([]);
    setAdjustOpen(false);
  }

  function closeAdjust() {
    setStagedAdditions([]);
    setStagedRemovals([]);
    setAdjustOpen(false);
  }

  // Add-event form (inside Adjust)
  const [addForm, setAddForm] = useState<{
    date: string;
    time: string;
    endTime: string;
    title: string;
    meta: string;
    tag: EventRecord["tag"];
    type: EventType;
    importance: 1 | 2 | 3 | 4 | 5;
  }>({
    date: "2026-01-12",
    time: "3:30 PM",
    endTime: "4:00 PM",
    title: "",
    meta: "",
    tag: "Work",
    type: "work",
    importance: 3,
  });

  // Goals (control center) — fetched from API (taskType="goal", priority stores "Week"/"Month"/"Year")
  const [goals, setGoals] = useState<Array<{
    id: string;
    title: string;
    description: string;
    targetDate: string;
    timeWindow: "Week" | "Month" | "Year";
  }>>([]);

  useEffect(() => {
    fetch("/api/tasks?taskType=goal")
      .then((r) => r.json())
      .then((res) => {
        const raw: any[] = res?.data ?? res ?? [];
        setGoals(raw.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description ?? "",
          targetDate: t.dueDate ? t.dueDate.slice(0, 10) : "",
          timeWindow: (["Week", "Month", "Year"].includes(t.priority) ? t.priority : "Week") as "Week" | "Month" | "Year",
        })));
      })
      .catch(console.error);
  }, []);

  const [goalsModalWindow, setGoalsModalWindow] = useState<"Week" | "Month" | "Year" | null>(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [addGoalForm, setAddGoalForm] = useState<{
    title: string;
    description: string;
    targetDate: string;
    timeWindow: "Week" | "Month" | "Year";
  }>({ title: "", description: "", targetDate: "", timeWindow: "Week" });

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

    // Fetch full event data from API
    setLoadingEventData(true);
    fetch(`/api/events/${ev.id}`)
      .then(res => res.json())
      .then(data => {
        if (data) {
          setEventData(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch event details:', err);
      })
      .finally(() => {
        setLoadingEventData(false);
      });
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setSelected(null);
      setEventData(null);
    }, 200);
  }

  // ESC closes drawer / adjust
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (addGoalOpen) { setAddGoalOpen(false); return; }
        if (goalsModalWindow) { setGoalsModalWindow(null); return; }
        if (todayOpen) { setTodayOpen(false); return; }
        if (adjustOpen) { closeAdjust(); return; }
        if (drawerOpen) closeDrawer();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, adjustOpen, addGoalOpen, goalsModalWindow, todayOpen]);


  function removeEvent(id: string) {
    setAllEvents((prev) => prev.filter((e) => e.id !== id));
    if (selected?.id === id) closeDrawer();
    fetch(`/api/events/${id}`, { method: "DELETE" }).catch(console.error);
  }

  function stageAddEvent() {
    if (!addForm.title.trim()) return;
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
    setStagedAdditions((prev) => [...prev, { ev: newEv, date: addForm.date }]);
    setAddForm((p) => ({ ...p, title: "", meta: "" }));
  }

  function sendQuickChat() {
    const text = quickChat.trim();
    if (!text) return;
    setQuickChat("");
    router.push("/chat");
  }

  // NO FREE TIME BLOCKS: just sorted events
  const activeBlocks = useMemo(() => buildBlocksWithFreeTime(activeEvents), [activeEvents]);

  // Today modal data
  const todayQuote = useMemo(() => {
    const n = selectedDate.getDate() + selectedDate.getMonth() * 31;
    return QUOTES[n % QUOTES.length];
  }, [selectedDate]);

  const topEvents = useMemo(() =>
    [...activeEvents].sort((a, b) => (b.importance ?? 3) - (a.importance ?? 3)).slice(0, 3),
    [activeEvents]
  );


  const todayPieData = useMemo(() => {
    const buckets: Record<string, number> = {};
    let totalScheduled = 0;
    activeEvents.forEach((e) => {
      if (!e.endTime) return;
      const dur = timeSort(e.endTime) - timeSort(e.time);
      if (dur <= 0) return;
      buckets[e.type] = (buckets[e.type] || 0) + dur;
      totalScheduled += dur;
    });
    const freeTime = Math.max(0, 960 - totalScheduled); // 16 waking hours
    if (freeTime > 0) buckets["free"] = freeTime;
    const total = totalScheduled + freeTime;
    return Object.entries(buckets)
      .map(([type, mins]) => ({ type, mins, pct: total > 0 ? mins / total : 0 }))
      .sort((a, b) => b.pct - a.pct);
  }, [activeEvents]);

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
    return allEvents.filter((e) => e._startAt && sameYMD(new Date(e._startAt), d));
  }

  function openDayFromWeek(d: Date) {
    setSelectedDate(d);
    setViewSpan("Day");
  }

  // Quick Add — detect recurring patterns from event history (2+ same title on same weekday)
  const quickAddSuggestions = useMemo(() => {
    type Entry = { title: string; type: EventType; dayOfWeek: number; times: string[]; count: number };
    const map = new Map<string, Entry>();

    for (const e of allEvents) {
      if (!e._startAt) continue;
      const dow = new Date(e._startAt).getDay();
      const key = `${e.title.trim().toLowerCase()}|${dow}`;
      if (!map.has(key)) map.set(key, { title: e.title, type: e.type, dayOfWeek: dow, times: [], count: 0 });
      const entry = map.get(key)!;
      entry.count++;
      if (e.time) entry.times.push(e.time);
    }

    return Array.from(map.values())
      .filter((p) => p.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allEvents]);

  function nextDateForDow(dow: number): string {
    const today = new Date();
    const diff = ((dow - today.getDay()) + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + diff);
    return next.toISOString().slice(0, 10);
  }

  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (!isLoaded || !isSignedIn) return <LandingPage />;
  if (isSignedIn && !onboardingChecked) return null;

  return (
    <main className="h-screen overflow-hidden" style={{ background: dark ? "var(--background)" : "#f8f9fa", color: dark ? "var(--foreground)" : "rgba(0,0,0,0.95)" }}>
      {/* very subtle ambient */}
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
        {/* LEFT SIDEBAR */}
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
            {/* sidebar top (blends with global header strip) */}
            <div className={cx("px-3 pt-4", leftOpen ? "pb-3" : "pb-2 flex justify-center")}>
              <div className={cx("flex items-center", leftOpen ? "justify-start" : "justify-center")}>
                <button
                  onClick={() => setLeftOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl border transition flex items-center justify-center"
                  style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.04)" : "white" }}
                  aria-label="Toggle Control Center"
                  title="Control Center"
                >
                  <Menu size={18} />
                </button>
              </div>
            </div>

            {/* ONLY render content when open (collapsed = icon only) */}
            {leftOpen ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                  {/* 1) AI Chat */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>AI Assistant</div>

                    <div className="rounded-xl p-3" style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <textarea
                        ref={quickChatRef}
                        value={quickChat}
                        onChange={(e) => setQuickChat(e.target.value)}
                        placeholder='e.g., "Move gym to 5pm and add 30min deep work after class."'
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
                            background: quickChat.trim() ? JYNX_GREEN : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                            color: quickChat.trim() ? "white" : dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)",
                            cursor: quickChat.trim() ? "pointer" : "not-allowed",
                          }}
                          disabled={!quickChat.trim()}
                          onClick={() => {
                            if (quickChat.trim()) {
                              sendQuickChat();
                            }
                          }}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </section>

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* 2) Calendar */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>{miniCal.monthLabel}</div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setMiniMonthOffset((v) => v - 1)}
                          className="h-7 w-7 rounded-lg transition flex items-center justify-center"
                          style={{
                            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)"
                          }}
                          aria-label="Previous month"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => setMiniMonthOffset((v) => v + 1)}
                          className="h-7 w-7 rounded-lg transition flex items-center justify-center"
                          style={{
                            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                            color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)"
                          }}
                          aria-label="Next month"
                        >
                          →
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-[11px] mb-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
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
                              "h-9 rounded-lg text-[12px] transition",
                              isEmpty ? "opacity-0 cursor-default" : "",
                              active ? "font-semibold" : "font-medium"
                            )}
                            style={{
                              background: active ? rgbaBrand(0.12) : dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                              border: active ? `1px solid ${rgbaBrand(0.3)}` : "none",
                              color: isEmpty ? "transparent" : dark ? "rgba(240,240,240,0.84)" : "rgba(0,0,0,0.84)",
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
                  </section>

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* 3) Goals */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Goals</div>

                    <div className="flex flex-wrap gap-2">
                      {(["Week", "Month", "Year"] as const).map((window) => {
                        const count = goals.filter((g) => g.timeWindow === window).length;
                        return (
                          <button
                            key={window}
                            onClick={() => setGoalsModalWindow(window)}
                            className="rounded-full px-3 py-1.5 text-[11px] font-semibold transition"
                            style={{
                              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                              color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)"
                            }}
                          >
                            {window}
                            {count > 0 && (
                              <span
                                className="ml-1.5 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[9px] font-semibold"
                                style={{
                                  background: rgbaBrand(0.12),
                                  color: JYNX_GREEN,
                                }}
                              >
                                {count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2">
                      <button
                        onClick={() => setAddGoalOpen(true)}
                        className="w-full rounded-lg px-3 py-2 text-xs font-semibold transition text-left flex items-center gap-2"
                        style={{
                          background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                          color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)"
                        }}
                      >
                        <span>+</span> Add goal
                      </button>
                    </div>
                  </section>
                </div>
              </>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col h-full">
          {/* In-content header controls */}
          <div className="px-3 sm:px-6 pt-4 pb-2">
            <div className="max-w-[1900px] mx-auto">
              <div className="flex flex-wrap items-center gap-3">
                {/* Day nav */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => shiftSelectedDay(-1)}
                    className="h-10 w-10 rounded-2xl border transition flex items-center justify-center"
                    style={getSurfaceSoftStyle(dark)}
                    aria-label="Previous day"
                  >
                    ←
                  </button>

                  <button
                    onClick={() => setSelectedDate(new Date(2026, 0, 12))}
                    className="h-10 rounded-2xl px-3 text-xs font-semibold border transition"
                    style={getSurfaceSoftStyle(dark)}
                  >
                    Today
                  </button>

                  <button
                    onClick={() => shiftSelectedDay(1)}
                    className="h-10 w-10 rounded-2xl border transition flex items-center justify-center"
                    style={getSurfaceSoftStyle(dark)}
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
                  <Segment value={viewFormat} options={["Timeline", "List"]} onChange={(v) => setViewFormat(v as ViewFormat)} />

                  <button
                    onClick={() => setAdjustOpen(true)}
                    className="h-10 rounded-2xl px-3 text-xs font-semibold border transition flex items-center gap-2"
                    style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.04)" : "white" }}
                  >
                    <SlidersHorizontal size={16} />
                    Adjust
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div
  className="flex-1 overflow-y-auto"
  style={{}}
>
           <div className="max-w-[1900px] mx-auto px-3 sm:px-6 pt-0 pb-10">
  <div
    className="rounded-[28px] px-6 pt-5 pb-8"
    style={{
      background: "rgba(255,255,255,0.92)",
      boxShadow: "0 24px 70px rgba(0,0,0,0.08)",
    }}
  >
              <section>
                {viewSpan === "Day" ? (
                  <>
                    {viewFormat === "Timeline" ? (
                      <div>
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => { setTodayClicked(true); setTodayOpen(true); }}
                                className="rounded-2xl px-3 py-1.5 text-xs font-semibold border transition"
                                style={todayClicked ? { ...getSurfaceSoftStyle(dark), background: dark ? "var(--surface)" : "white" } : { background: JYNX_GREEN, borderColor: JYNX_GREEN, color: "white" }}
                              >
                                Today
                              </button>
                              <div className="text-xs text-neutral-500">Your plan for today</div>
                            </div>
                            <div className="text-[11px] text-neutral-500">{activeEvents.length} items</div>
                          </div>

                          <div className="mt-5">
                            {loadingEvents ? (
                              <div className="text-sm py-4" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>Loading…</div>
                            ) : activeBlocks.length ? (
                              <TimelineWithDaypartsLight
                                blocks={activeBlocks}
                                olive={JYNX_GREEN}
                                onToggleComplete={(id) => toggleComplete(id)}
                                onOpen={openDrawer}
                              />
                            ) : (
                              <BlankDayCard dark={dark} onAddEvent={() => setAdjustOpen(true)} onBuildBlocks={() => router.push("/chat")} />
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
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
                                  dark={dark}
                                />
                              ))
                            ) : (
                              <BlankDayList dark={dark} />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : viewFormat === "List" ? (
                  // CHANGED: Week + List is now a readable vertical list grouped by day
                  <div className="rounded-3xl border" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
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
                              className="rounded-3xl border"
                              style={{
                                ...getSurfaceSoftStyle(dark),
                                background: dark ? "var(--surface)" : "white",
                                borderColor: isActive ? rgbaBrand(0.28) : (dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"),
                                boxShadow: isActive ? `0 0 0 1px ${rgbaBrand(0.1)}` : (dark ? "0 0 0 1px rgba(0,0,0,0.15)" : "0 0 0 1px rgba(0,0,0,0.04)"),
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
                                      className="rounded-2xl px-3 py-2 text-xs font-semibold border transition"
                                      style={getSurfaceSoftStyle(dark)}
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
                                        dark={dark}
                                      />
                                    ))
                                  ) : (
                                    <div
                                      className="rounded-2xl border bg-white px-3 py-3 text-sm text-neutral-600"
                                      style={getSurfaceSoftStyle(dark)}
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
                  <div className="rounded-3xl border" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
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
                                className={cx("shrink-0 rounded-3xl border", isActive ? "ring-1" : "")}
                                style={{
                                  ...getSurfaceSoftStyle(dark),
                                  background: dark ? "var(--surface)" : "white",
                                  width: "clamp(240px, 28vw, 360px)",
                                  borderColor: isActive ? rgbaBrand(0.28) : (dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"),
                                  boxShadow: isActive ? `0 0 0 1px ${rgbaBrand(0.1)}` : (dark ? "0 0 0 1px rgba(0,0,0,0.15)" : "0 0 0 1px rgba(0,0,0,0.04)"),
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
                                        style={getSurfaceSoftStyle(dark)}
                                      >
                                        Nothing scheduled
                                      </div>
                                    )}
                                  </div>

                                  <button
                                    onClick={() => openDayFromWeek(d)}
                                    className="mt-4 w-full rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                    style={getSurfaceSoftStyle(dark)}
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
        </div>

        {/* Event Detail Modal */}
        {drawerOpen && selected && (
          <EventDetailModal
            event={{
              id: selected.id,
              type: selected.type,
              title: selected.title,
              meta: selected.meta,
              time: selected.time,
              endTime: selected.endTime,
              location: selected.location,
              tag: selected.tag,
              assignments: eventData?.assignments || [],
              workoutLogs: eventData?.workoutLogs || [],
              files: eventData?.files || [],
            }}
            dark={dark}
            onClose={closeDrawer}
            onDrop={() => { removeEvent(selected.id); closeDrawer(); }}
          />
        )}

        <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } @keyframes fadeScaleIn { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: scale(1); } }`}</style>

        {/* Today overview modal */}
        {todayOpen && (
          <>
            <button
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60]"
              style={{ animation: "fadeIn 180ms ease-out" }}
              onClick={() => setTodayOpen(false)}
              aria-label="Close today overview"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div
                className="relative rounded-3xl border backdrop-blur overflow-hidden"
                style={{
                  width: adjustW,
                  height: adjustH,
                  background: dark ? "rgba(26,26,26,0.92)" : "rgba(255,255,255,0.92)",
                  borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
                  boxShadow: dark ? "0 30px 120px rgba(0,0,0,0.50)" : "0 30px 120px rgba(0,0,0,0.18)",
                  animation: "fadeScaleIn 220ms ease-out",
                }}
              >
                {/* Header */}
                <div className="px-5 py-4 border-b flex items-center" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                  <div>
                    <div className="text-sm font-semibold">Today</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Your day at a glance.</div>
                  </div>
                  <button
                    onClick={() => setTodayOpen(false)}
                    className="ml-auto rounded-xl px-2 py-1 text-xs border bg-white hover:bg-black/[0.03] transition"
                    style={getSurfaceSoftStyle(dark)}
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto" style={{ height: "calc(100% - 56px)" }}>
                  {/* Quote */}
                  <div className="rounded-2xl p-5 mb-6 relative overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", background: "rgba(255,255,255,0.7)" }}>
                    <div className="absolute select-none pointer-events-none" style={{ top: -8, left: -4, fontSize: 100, lineHeight: 1, color: rgbaBrand(0.10), fontWeight: 700 }}>"</div>
                    <div className="relative" style={{ paddingLeft: 44 }}>
                      <div className="text-[15px] font-medium leading-relaxed" style={{ color: "rgba(0,0,0,0.78)" }}>
                        {todayQuote.text}
                      </div>
                      <div className="text-[11px] mt-2" style={{ color: "rgba(0,0,0,0.38)" }}>
                        — {todayQuote.author}
                      </div>
                    </div>
                  </div>

                  {/* Time breakdown ring + list side by side */}
                  <div className="mb-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-3 text-center" style={{ color: "rgba(0,0,0,0.40)" }}>
                      How your day breaks down
                    </div>
                    {(() => {
                      const scheduled = todayPieData.filter((s) => s.type !== "free").reduce((sum, s) => sum + s.mins, 0);
                      const pct = Math.min(scheduled / 960, 1);
                      const circ = 2 * Math.PI * 48;
                      const hrs = Math.floor(scheduled / 60);
                      const mins = scheduled % 60;
                      const timeLabel = hrs > 0 ? (mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`) : `${mins}m`;
                      return (
                        <div className="flex items-center gap-4">
                          {/* Ring */}
                          <div className="shrink-0">
                            <svg width="140" height="140" viewBox="0 0 140 140">
                              <circle cx="70" cy="70" r="48" fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="7" />
                              <circle
                                cx="70" cy="70" r="48" fill="none"
                                stroke={JYNX_GREEN} strokeWidth="7"
                                strokeLinecap="round"
                                strokeDasharray={`${pct * circ} ${circ}`}
                                transform="rotate(-90 70 70)"
                              />
                              <text x="70" y="66" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="600" fill="rgba(0,0,0,0.88)" style={{ fontFamily: "inherit" }}>{timeLabel}</text>
                              <text x="70" y="82" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="rgba(0,0,0,0.40)" style={{ fontFamily: "inherit" }}>planned</text>
                            </svg>
                          </div>
                          {/* Activity list */}
                          <div className="flex-1 min-w-0">
                            {todayPieData.filter((s) => s.type !== "free").map((seg, i, arr) => {
                              const sHrs = Math.floor(seg.mins / 60);
                              const sMins = seg.mins % 60;
                              const label = sHrs > 0 ? (sMins > 0 ? `${sHrs}h ${sMins}m` : `${sHrs}h`) : `${sMins}m`;
                              return (
                                <div
                                  key={seg.type}
                                  className={cx("flex items-center justify-between py-1.5 px-1", i < arr.length - 1 && "border-b")}
                                  style={{ borderColor: "rgba(0,0,0,0.06)" }}
                                >
                                  <div className="text-[12px]" style={{ color: "rgba(0,0,0,0.65)" }}>{PIE_LABELS[seg.type] || seg.type}</div>
                                  <div className="text-[12px] font-medium" style={{ color: "rgba(0,0,0,0.42)" }}>{label}</div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Top priorities */}
                  <div className="mb-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "rgba(0,0,0,0.40)" }}>
                      Your top priorities today
                    </div>
                    <div className="space-y-2">
                      {topEvents.map((e, i) => (
                        <div key={e.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(0,0,0,0.02)" }}>
                          <div
                            className="h-5 w-5 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ background: rgbaBrand(0.12), color: JYNX_GREEN }}
                          >
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-medium truncate" style={{ color: "rgba(0,0,0,0.88)" }}>{e.title}</div>
                            <div className="text-[11px] truncate" style={{ color: "rgba(0,0,0,0.45)" }}>{formatRange(e.time, e.endTime)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pre-day notes */}
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(0,0,0,0.40)" }}>
                      Before you start
                    </div>
                    <textarea
                      placeholder="Anything on your mind before you kick off the day?"
                      className="w-full rounded-xl px-3.5 py-3 text-[13px] resize-none outline-none border transition"
                      style={{
                        background: "rgba(0,0,0,0.02)",
                        borderColor: "rgba(0,0,0,0.10)",
                        color: "rgba(0,0,0,0.85)",
                        minHeight: 80,
                      }}
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        className="rounded-xl px-4 py-1.5 text-[11px] font-semibold transition hover:opacity-85"
                        style={{ background: JYNX_GREEN, color: "white" }}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Adjust overlay */}
        {adjustOpen && (
          <>
            <button
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60]"
              style={{ animation: "fadeIn 180ms ease-out" }}
              onClick={closeAdjust}
              aria-label="Close adjust"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div
                className="relative rounded-3xl border backdrop-blur overflow-hidden"
                style={{
                  width: adjustW,
                  height: adjustH,
                  background: dark ? "rgba(26,26,26,0.92)" : "rgba(255,255,255,0.92)",
                  borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
                  boxShadow: dark ? "0 30px 120px rgba(0,0,0,0.50)" : "0 30px 120px rgba(0,0,0,0.18)",
                  animation: "fadeScaleIn 220ms ease-out",
                }}
              >
                <div className="px-5 py-4 border-b flex items-center" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
                  <div>
                    <div className="text-sm font-semibold">Adjust schedule</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Add or drop events. Changes apply when you press Apply.</div>
                  </div>
                  <button
                    onClick={closeAdjust}
                    className="ml-auto rounded-xl px-2 py-1 text-xs border hover:bg-black/[0.03] transition"
                    style={getSurfaceSoftStyle(dark)}
                  >
                    ✕
                  </button>
                </div>

                {/* scroll area */}
                <div className="p-5 h-[calc(100%-56px-64px)] overflow-y-auto">
                  <div className="grid grid-cols-12 gap-4">
                    {/* Left: preferences + drop */}
                    <div className="col-span-12 md:col-span-6 space-y-4">
                      <div className="rounded-3xl border p-4 space-y-3" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
                        <ToggleRowLight
                          label="Protect focus blocks"
                          desc="Keeps deep work earlier, reduces interruptions."
                          value={protectFocus}
                          onChange={setProtectFocus}
                        />
                        <ToggleRowLight
                          label="Auto rebalance"
                          desc="When you add or drop events, the day gets re-packed."
                          value={autoRebalance}
                          onChange={setAutoRebalance}
                        />
                      </div>

                      {/* Drop an event */}
                      <div className="rounded-3xl border p-4" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
                        <div className="text-sm font-semibold">Drop an event</div>
                        <div className="mt-3 space-y-2 max-h-[260px] overflow-auto pr-1">
                          {activeEvents.map((e) => {
                            const isStaged = stagedRemovals.includes(e.id);
                            return (
                              <div
                                key={e.id}
                                className={cx("flex items-center gap-2 rounded-2xl border px-3 py-2 transition", isStaged ? "opacity-50" : "")}
                                style={{ ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.04)" : "white" }}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className={cx("text-xs truncate", isStaged ? "line-through text-neutral-400" : "text-neutral-800")}>
                                    {formatRange(e.time, e.endTime)} · {e.title}
                                  </div>
                                  <div className="text-[11px] text-neutral-500 truncate">{e.meta}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (isStaged) {
                                      setStagedRemovals((prev) => prev.filter((id) => id !== e.id));
                                    } else {
                                      setStagedRemovals((prev) => [...prev, e.id]);
                                    }
                                  }}
                                  className="rounded-xl px-2 py-1 text-[11px] font-semibold border transition shrink-0"
                                  style={isStaged
                                    ? { borderColor: rgbaBrand(0.22), background: rgbaBrand(0.08), color: dark ? "rgba(200,240,220,0.80)" : "rgba(25,100,60,0.80)" }
                                    : { ...getSurfaceSoftStyle(dark), background: dark ? "rgba(255,255,255,0.04)" : "white" }
                                  }
                                >
                                  {isStaged ? "Undo" : "Drop"}
                                </button>
                              </div>
                            );
                          })}
                          {!activeEvents.length && <div className="text-xs text-neutral-500">No events on this day.</div>}
                        </div>
                      </div>
                      {/* Quick Add */}
                      <div className="rounded-3xl border p-4" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">Quick Add</div>
                          {quickAddSuggestions.length > 0 && (
                            <div className="text-[11px]" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.35)" }}>
                              Learned from your schedule
                            </div>
                          )}
                        </div>

                        {quickAddSuggestions.length === 0 ? (
                          <div className="mt-3 rounded-2xl border px-3 py-3" style={getSurfaceSoftStyle(dark)}>
                            <div className="text-xs" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)" }}>
                              Jynx is learning your patterns. As you add events, recurring ones will appear here for one-tap scheduling.
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {quickAddSuggestions.map((s) => (
                              <button
                                key={`${s.title}|${s.dayOfWeek}`}
                                onClick={() => setAddForm((p) => ({
                                  ...p,
                                  title: s.title,
                                  type: s.type,
                                  tag: s.title,
                                  date: nextDateForDow(s.dayOfWeek),
                                  time: s.times[0] ?? p.time,
                                }))}
                                className="rounded-2xl border px-3 py-2 text-left transition hover:opacity-80"
                                style={getSurfaceSoftStyle(dark)}
                              >
                                <div className="text-xs font-semibold" style={{ color: dark ? "rgba(240,240,240,0.88)" : "rgba(17,17,17,0.88)" }}>
                                  {s.title}
                                </div>
                                <div className="text-[11px] mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>
                                  {DOW_LABELS[s.dayOfWeek]}s{s.times[0] ? ` · ${s.times[0]}` : ""} · {s.count}×
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: add */}
                    <div className="col-span-12 md:col-span-6 space-y-4">
                      <div className="rounded-3xl border p-4" style={{ ...getSurfaceStyle(dark), background: dark ? "var(--surface)" : "white" }}>
                        <div className="text-sm font-semibold">Add an event</div>

                        <div className="mt-3 grid grid-cols-12 gap-2">
                          <div className="col-span-12">
                            <Label>Date</Label>
                            <input
                              type="date"
                              value={addForm.date}
                              onChange={(e) => setAddForm((p) => ({ ...p, date: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={getSurfaceSoftStyle(dark)}
                            />
                          </div>

                          <div className="col-span-6">
                            <Label>Start time</Label>
                            <input
                              value={addForm.time}
                              onChange={(e) => setAddForm((p) => ({ ...p, time: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={getSurfaceSoftStyle(dark)}
                              placeholder="e.g., 3:30 PM"
                            />
                          </div>
                          <div className="col-span-6">
                            <Label>End time</Label>
                            <input
                              value={addForm.endTime}
                              onChange={(e) => setAddForm((p) => ({ ...p, endTime: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={getSurfaceSoftStyle(dark)}
                              placeholder="e.g., 4:00 PM"
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Title</Label>
                            <input
                              value={addForm.title}
                              onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={getSurfaceSoftStyle(dark)}
                              placeholder="e.g., Call Dylan"
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Notes</Label>
                            <input
                              value={addForm.meta}
                              onChange={(e) => setAddForm((p) => ({ ...p, meta: e.target.value }))}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={getSurfaceSoftStyle(dark)}
                              placeholder="e.g., 20 min · quick sync"
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Category</Label>
                            <select
                              value={addForm.type}
                              onChange={(e) => {
                                const t = e.target.value as EventType;
                                const tagMap: Record<EventType, string> = { class: "Class", work: "Work", health: "Health", prep: "Prep", study: "Study", life: "Life", free: "Flexible" };
                                setAddForm((p) => ({ ...p, type: t, tag: tagMap[t] ?? "Work" }));
                              }}
                              className="mt-1 w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                              style={getSurfaceSoftStyle(dark)}
                            >
                              <option value="class">Class</option>
                              <option value="work">Work</option>
                              <option value="health">Health</option>
                              <option value="prep">Prep</option>
                              <option value="study">Study</option>
                              <option value="life">Life</option>
                            </select>
                          </div>

                          <div className="col-span-12">
                            <Label>Priority</Label>
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
                              <span className="text-sm w-16 text-right" style={{ color: dark ? "rgba(240,240,240,0.80)" : "rgba(0,0,0,0.70)" }}>{getImportanceLabel(addForm.importance)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={stageAddEvent}
                            disabled={!addForm.title.trim()}
                            className={cx(
                              "rounded-2xl px-3 py-2 text-xs font-semibold border transition",
                              addForm.title.trim() ? "hover:bg-black/[0.03]" : "text-neutral-400 cursor-not-allowed"
                            )}
                            style={getSurfaceSoftStyle(dark)}
                          >
                            Queue
                          </button>
                          <button
                            onClick={() => setAddForm((p) => ({ ...p, title: "", meta: "" }))}
                            className="rounded-2xl px-3 py-2 text-xs font-semibold border transition hover:bg-black/[0.03]"
                            style={getSurfaceSoftStyle(dark)}
                          >
                            Clear
                          </button>
                        </div>

                        {/* Pending additions */}
                        {stagedAdditions.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "rgba(0,0,0,0.40)" }}>Queued to add</div>
                            {stagedAdditions.map((sa, i) => (
                              <div key={sa.ev.id} className="flex items-center gap-2 rounded-2xl border px-3 py-2" style={{ ...getSurfaceSoftStyle(dark), background: rgbaBrand(0.05), borderColor: rgbaBrand(0.18) }}>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs truncate" style={{ color: dark ? "rgba(200,240,220,0.90)" : "rgba(20,80,50,0.90)" }}>
                                    {sa.date} · {sa.ev.time}–{sa.ev.endTime} · {sa.ev.title}
                                  </div>
                                </div>
                                <button
                                  onClick={() => setStagedAdditions((prev) => prev.filter((_, j) => j !== i))}
                                  className="text-[11px] transition shrink-0"
                                  style={{ color: "rgba(0,0,0,0.40)" }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="px-5 py-4 border-t flex items-center justify-between"
                  style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
                >
                  <div className="text-xs" style={{ color: "rgba(0,0,0,0.40)" }}>
                    {stagedRemovals.length > 0 || stagedAdditions.length > 0
                      ? `${stagedAdditions.length} to add · ${stagedRemovals.length} to drop`
                      : "No pending changes"}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={closeAdjust}
                      className="rounded-2xl px-3 py-2 text-xs font-semibold border transition hover:bg-black/[0.03]"
                      style={getSurfaceSoftStyle(dark)}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={applyAdjust}
                      className="rounded-2xl px-3 py-2 text-xs font-semibold border transition"
                      style={{
                        background: JYNX_GREEN,
                        borderColor: "transparent",
                        color: "white",
                        opacity: stagedAdditions.length === 0 && stagedRemovals.length === 0 ? 0.5 : 1,
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </>
        )}

        {/* Goals View Modal */}
        {goalsModalWindow && (
          <>
            <button
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60]"
              style={{ animation: "fadeIn 180ms ease-out" }}
              onClick={() => setGoalsModalWindow(null)}
              aria-label="Close goals"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div
                className="relative w-full max-w-xl rounded-3xl border overflow-hidden"
                style={{
                  background: dark ? "var(--surface)" : "white",
                  borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
                  boxShadow: dark ? "0 30px 120px rgba(0,0,0,0.50)" : "0 30px 120px rgba(0,0,0,0.18)",
                  animation: "fadeScaleIn 220ms ease-out",
                }}
              >
                {/* Header */}
                <div className="px-6 pt-6 pb-5 flex items-start justify-between">
                  <div>
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                      style={{
                        background: rgbaBrand(0.1),
                        color: JYNX_GREEN,
                        borderColor: rgbaBrand(0.22),
                      }}
                    >
                      {goalsModalWindow}
                    </span>
                    <div className="mt-2.5 text-[18px] font-semibold text-neutral-900 leading-tight">Goals</div>
                    <div className="mt-0.5 text-[12px] text-neutral-500">
                      {goals.filter((g) => g.timeWindow === goalsModalWindow).length} goal
                      {goals.filter((g) => g.timeWindow === goalsModalWindow).length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => setGoalsModalWindow(null)}
                    className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                    style={getSurfaceSoftStyle(dark)}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Divider */}
                <div className="mx-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }} />

                {/* Goal cards */}
                <div className="px-6 py-5 space-y-3 max-h-[380px] overflow-y-auto">
                  {goals.filter((g) => g.timeWindow === goalsModalWindow).length === 0 ? (
                    <div className="py-8 text-center">
                      <div className="text-[13px] text-neutral-400">No goals yet</div>
                      <div className="mt-1 text-[11px] text-neutral-400">Add one below to get started</div>
                    </div>
                  ) : (
                    goals
                      .filter((g) => g.timeWindow === goalsModalWindow)
                      .map((goal) => (
                        <div
                          key={goal.id}
                          className="relative rounded-xl px-4 py-3.5 pr-8 overflow-hidden"
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            border: "1px solid rgba(0,0,0,0.06)",
                          }}
                        >
                          <div
                            className="absolute left-0 top-0 bottom-0 w-0.5"
                            style={{ background: JYNX_GREEN }}
                          />
                          <div className="text-[13px] font-semibold text-neutral-900">{goal.title}</div>
                          {goal.description && (
                            <div className="mt-1 text-[12px] text-neutral-500 leading-relaxed">{goal.description}</div>
                          )}
                          {goal.targetDate && (
                            <div className="mt-1.5 text-[11px] text-neutral-400">
                              Target · {new Date(goal.targetDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setGoals((prev) => prev.filter((g) => g.id !== goal.id));
                              fetch(`/api/tasks/${goal.id}`, { method: "DELETE" }).catch(console.error);
                            }}
                            className="absolute top-3 right-3 text-[12px] text-neutral-300 hover:text-neutral-500 transition"
                            title="Remove goal"
                          >
                            ✕
                          </button>
                        </div>
                      ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                  <button
                    onClick={() => {
                      if (!goalsModalWindow) return;
                      setAddGoalForm((f) => ({ ...f, timeWindow: goalsModalWindow }));
                      setGoalsModalWindow(null);
                      setAddGoalOpen(true);
                    }}
                    className="w-full h-10 rounded-2xl border text-xs font-semibold transition flex items-center justify-center gap-1.5 hover:bg-black/[0.03]"
                    style={{
                      borderColor: rgbaBrand(0.3),
                      color: JYNX_GREEN,
                    }}
                  >
                    <span>+</span> Add goal
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Add Goal Modal */}
        {addGoalOpen && (
          <>
            <button
              className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60]"
              style={{ animation: "fadeIn 180ms ease-out" }}
              onClick={() => setAddGoalOpen(false)}
              aria-label="Close add goal"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <div
              className="w-full max-w-md rounded-3xl border p-6"
              style={{
                background: dark ? "var(--surface)" : "white",
                borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
                boxShadow: dark ? "0 30px 120px rgba(0,0,0,0.50)" : "0 30px 120px rgba(0,0,0,0.18)",
                animation: "fadeScaleIn 220ms ease-out",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold">New Goal</div>
                  <div className="text-xs text-neutral-500 mt-1">Set a target and track your progress.</div>
                </div>
                <button
                  onClick={() => setAddGoalOpen(false)}
                  className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  style={getSurfaceSoftStyle(dark)}
                  title="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Goal</label>
                  <input
                    type="text"
                    value={addGoalForm.title}
                    onChange={(e) => setAddGoalForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="What do you want to achieve?"
                    className="mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm bg-white outline-none transition"
                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Description</label>
                  <textarea
                    value={addGoalForm.description}
                    onChange={(e) => setAddGoalForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Any details or context…"
                    rows={2}
                    className="mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm bg-white outline-none resize-none transition"
                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Target Date</label>
                  <input
                    type="date"
                    value={addGoalForm.targetDate}
                    onChange={(e) => setAddGoalForm((f) => ({ ...f, targetDate: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border px-3 py-2.5 text-sm bg-white outline-none transition"
                    style={{ borderColor: "rgba(0,0,0,0.10)" }}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Time Window</label>
                  <div className="mt-1.5 flex gap-2">
                    {(["Week", "Month", "Year"] as const).map((tw) => (
                      <button
                        key={tw}
                        onClick={() => setAddGoalForm((f) => ({ ...f, timeWindow: tw }))}
                        className={cx(
                          "flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold border transition",
                          addGoalForm.timeWindow === tw ? "bg-black/[0.03]" : "bg-white hover:bg-black/[0.03]"
                        )}
                        style={{
                          borderColor: addGoalForm.timeWindow === tw ? rgbaBrand(0.22) : "rgba(0,0,0,0.08)",
                          boxShadow: addGoalForm.timeWindow === tw ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
                        }}
                      >
                        {tw}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={async () => {
                    if (!addGoalForm.title.trim()) return;
                    try {
                      const res = await fetch("/api/tasks", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          title: addGoalForm.title.trim(),
                          description: addGoalForm.description.trim() || null,
                          dueDate: addGoalForm.targetDate || null,
                          taskType: "goal",
                          priority: addGoalForm.timeWindow,
                        }),
                      });
                      const body = await res.json();
                      const created = body?.data ?? body;
                      if (created?.id) {
                        setGoals((prev) => [...prev, {
                          id: created.id,
                          title: created.title,
                          description: created.description ?? "",
                          targetDate: created.dueDate ? created.dueDate.slice(0, 10) : "",
                          timeWindow: addGoalForm.timeWindow,
                        }]);
                      }
                    } catch (err) {
                      console.error(err);
                    }
                    setAddGoalForm({ title: "", description: "", targetDate: "", timeWindow: "Week" });
                    setAddGoalOpen(false);
                  }}
                  disabled={!addGoalForm.title.trim()}
                  className={cx(
                    "flex-1 h-10 rounded-2xl px-3 text-xs font-semibold border transition",
                    addGoalForm.title.trim()
                      ? "bg-white hover:bg-black/[0.03]"
                      : "bg-white text-neutral-400 cursor-not-allowed"
                  )}
                  style={getSurfaceSoftStyle(dark)}
                >
                  Add Goal
                </button>
                <button
                  onClick={() => setAddGoalOpen(false)}
                  className="h-10 rounded-2xl px-4 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                  style={getSurfaceSoftStyle(dark)}
                >
                  Cancel
                </button>
              </div>
            </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Segment({ value, options, onChange, dark = false }: { value: string; options: string[]; onChange: (v: string) => void; dark?: boolean }) {
  return (
    <div className="h-10 rounded-2xl border p-1 flex items-center gap-1" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "var(--surface)" : "white" }}>
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="h-8 rounded-xl px-3 text-xs font-semibold transition"
            style={{
              border: "1px solid",
              borderColor: active ? rgbaBrand(0.22) : "rgba(0,0,0,0)",
              boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
              background: active ? (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)") : (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"),
              color: active ? (dark ? "rgba(240,240,240,0.88)" : "rgba(0,0,0,0.88)") : (dark ? "rgba(240,240,240,0.68)" : "rgba(0,0,0,0.68)"),
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

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-neutral-500 font-medium">{children}</div>;
}

function ToggleRowLight({
  label,
  desc,
  value,
  onChange,
  dark = false,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
  dark?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full flex items-start gap-3 rounded-2xl border px-3 py-3 transition text-left"
      style={{
        ...getSurfaceSoftStyle(dark),
        background: dark ? "var(--surface)" : "white",
      }}
    >
      <div
        className="mt-0.5 h-4 w-7 rounded-full border relative"
        style={{
          borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
          background: value ? rgbaBrand(0.16) : (dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"),
          boxShadow: value ? `0 0 0 1px ${rgbaBrand(0.10)}` : undefined,
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full"
          style={{
            left: value ? 16 : 2,
            background: value ? (dark ? "rgba(240,240,240,0.92)" : "rgba(25,25,25,0.92)") : (dark ? "rgba(240,240,240,0.35)" : "rgba(0,0,0,0.35)"),
            transition: "left 140ms ease",
          }}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{label}</div>
        <div className="text-xs mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>{desc}</div>
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
  olive, // FIX: was required by props but not destructured -> TS error
  compact,
  dark = false,
}: {
  event: EventRecord;
  onToggle: () => void;
  onOpen: () => void;
  olive: string;
  compact?: boolean;
  dark?: boolean;
}) {
  void olive; // unused (kept for API symmetry)

  const importanceLevel = getImportanceLabel(event.importance);
  const completed = !!event.completed;

  return (
    <div className={cx("rounded-2xl border bg-white relative overflow-hidden", compact ? "opacity-95" : "")} style={getSurfaceSoftStyle(dark)}>
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

function BlankDayCard({ dark = false, onAddEvent, onBuildBlocks }: { dark?: boolean; onAddEvent?: () => void; onBuildBlocks?: () => void }) {
  return (
    <div className="rounded-3xl border p-6" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "var(--surface)" : "white" }}>
      <div className="text-sm font-semibold text-neutral-900">No events</div>
      <div className="mt-1 text-sm text-neutral-600 leading-relaxed">
        Nothing scheduled for this day. Use Adjust to add events.
      </div>
      <div className="mt-4 flex gap-2">
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border transition"
          style={getSurfaceSoftStyle(dark)}
          onClick={onAddEvent}
        >
          Add event
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border transition"
          style={getSurfaceSoftStyle(dark)}
          onClick={onBuildBlocks}
        >
          Build blocks
        </button>
      </div>
    </div>
  );
}

function BlankDayList({ dark = false }: { dark?: boolean }) {
  return (
    <div className="rounded-2xl border p-5" style={{ ...getSurfaceSoftStyle(dark), background: dark ? "var(--surface)" : "white" }}>
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
