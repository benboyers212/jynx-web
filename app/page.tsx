"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

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

function getTagStyleDark(tag: string) {
  const base = {
    borderColor: "rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.86)",
    backgroundColor: "rgba(255,255,255,0.06)",
  };

  const map: Record<
    string,
    { backgroundColor: string; color: string; borderColor: string }
  > = {
    Class: {
      backgroundColor: "rgba(85,107,47,0.14)",
      color: "rgba(235,245,230,0.95)",
      borderColor: "rgba(85,107,47,0.40)",
    },
    Work: {
      backgroundColor: "rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.88)",
      borderColor: "rgba(255,255,255,0.16)",
    },
    Health: {
      backgroundColor: "rgba(85,107,47,0.18)",
      color: "rgba(235,245,230,0.95)",
      borderColor: "rgba(85,107,47,0.46)",
    },
    Prep: {
      backgroundColor: "rgba(85,107,47,0.10)",
      color: "rgba(235,245,230,0.92)",
      borderColor: "rgba(85,107,47,0.34)",
    },
    Study: {
      backgroundColor: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.88)",
      borderColor: "rgba(255,255,255,0.14)",
    },
    Life: {
      backgroundColor: "rgba(85,107,47,0.12)",
      color: "rgba(235,245,230,0.92)",
      borderColor: "rgba(85,107,47,0.36)",
    },
    Flexible: {
      backgroundColor: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.72)",
      borderColor: "rgba(255,255,255,0.10)",
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

function getImportancePillStyle(level: "High" | "Medium" | "Low") {
  if (level === "High") {
    return {
      backgroundColor: "rgba(85,107,47,0.18)",
      borderColor: "rgba(85,107,47,0.52)",
      color: "rgba(235,245,230,0.95)",
      boxShadow: "0 0 0 1px rgba(85,107,47,0.18)",
    } as React.CSSProperties;
  }
  if (level === "Low") {
    return {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(255,255,255,0.10)",
      color: "rgba(255,255,255,0.72)",
    } as React.CSSProperties;
  }
  return {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.12)",
    color: "rgba(255,255,255,0.80)",
  } as React.CSSProperties;
}

const oliveCardStyle: React.CSSProperties = {
  borderColor: "rgba(85,107,47,0.60)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.42)",
};

const oliveSoftStyle: React.CSSProperties = {
  borderColor: "rgba(85,107,47,0.42)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function Home() {
  // Demo schedule data (UI shell)
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
          plan: [
            "Incline chest press",
            "Cable fly",
            "Triceps pushdown",
            "Incline walk 10 min",
          ],
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
          assignmentsDue: [
            { title: "Reading: Ch. 7", due: "Before class", points: "—" },
          ],
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

  // Tomorrow collapsible
  const [tomorrowOpen, setTomorrowOpen] = useState(false);

  // Drawer state
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<
    "Overview" | "Files" | "Assignments" | "Notes"
  >("Overview");

  // Quick chat
  const [quickChat, setQuickChat] = useState("");
  const quickChatRef = useRef<HTMLTextAreaElement | null>(null);

  // Thoughts mini card
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const [thoughtsText, setThoughtsText] = useState("");

  // NEW: Adjust modal (schedule controls)
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [freeTimePct, setFreeTimePct] = useState(22); // UI shell
  const [protectFocus, setProtectFocus] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(true);

  // Make Adjust modal wider (keep content the same)
  const adjustW = "min(96vw, 1160px)";
  const adjustH = "min(86vh, 760px)";

  // Add-event form (inside Adjust)
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

  // Focus (right rail)
  const [focusMode, setFocusMode] = useState<
    "Auto" | "Morning" | "Afternoon" | "Evening"
  >("Auto");

  const focusCopy = useMemo(() => {
    const map: Record<typeof focusMode, string> = {
      Auto: "Auto: Jynx chooses the focus based on what’s scheduled next.",
      Morning:
        "Protect your early block. Keep distractions low and stay on rails.",
      Afternoon:
        "Use the mid-day gap well. Keep transitions clean and don’t drift.",
      Evening:
        "Close loops. Light prep, reset, and set up tomorrow so your morning starts clean.",
    };
    return map[focusMode];
  }, [focusMode]);

  // Autosize quick chat
  useEffect(() => {
    const el = quickChatRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [quickChat]);

  function openDrawer(ev: EventRecord) {
    // Don’t open the drawer for free-time “gap bars”
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

  function toggleComplete(which: "today" | "tomorrow", id: string) {
    const setter = which === "today" ? setTodayEvents : setTomorrowEvents;
    setter((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  }

  function setImportance(id: string, importance: 1 | 2 | 3 | 4 | 5) {
    // only editing today's for UI shell (matches your prior behavior)
    setTodayEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, importance } : e))
    );
    if (selected?.id === id) setSelected((s) => (s ? { ...s, importance } : s));
  }

  function removeEvent(id: string) {
    setTodayEvents((prev) => prev.filter((e) => e.id !== id));
    if (selected?.id === id) closeDrawer();
  }

  function addEvent() {
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
    setTodayEvents((prev) =>
      [...prev, newEv].sort((a, b) => timeSort(a.time) - timeSort(b.time))
    );
    setAddForm((p) => ({ ...p, title: "", meta: "" }));
  }

  function sendQuickChat() {
    const text = quickChat.trim();
    if (!text) return;
    setQuickChat("");
    alert(`UI shell — would send to assistant:\n\n"${text}"`);
  }

  // Build "display blocks" with free-time inserted between scheduled events
  const todayBlocks = useMemo(
    () => buildBlocksWithFreeTime(todayEvents),
    [todayEvents]
  );
  const tomorrowBlocks = useMemo(
    () => buildBlocksWithFreeTime(tomorrowEvents),
    [tomorrowEvents]
  );

  return (
    <main className="h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(85,107,47,0.90), rgba(17,17,17,0) 60%)",
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-15 bg-white/20" />
      </div>

      <div className="relative flex h-full">
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[1280px] mx-auto px-6 pt-6 pb-10 grid grid-cols-12 gap-6">
              {/* Schedule timeline (wide) */}
              <section className="col-span-12 lg:col-span-9">
                <Section
                  title="Today"
                  subtitle="Thu, Sep 12"
                  right={
                    <div className="flex items-center gap-2">
                      <PillStat label="Free time" value={`${freeTimePct}%`} />
                      <button
                        onClick={() => setAdjustOpen(true)}
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                      >
                        Adjust
                      </button>
                    </div>
                  }
                >
                  <TimelineWithDayparts
                    blocks={todayBlocks}
                    olive={OLIVE}
                    onToggleComplete={(id) => toggleComplete("today", id)}
                    onOpen={openDrawer}
                  />
                </Section>

                {/* Tomorrow — collapsible so it’s there but not competing */}
                <div className="mb-8">
                  <button
                    className="w-full flex items-center justify-between rounded-3xl border bg-white/6 backdrop-blur px-4 py-3 hover:bg-white/8 transition"
                    style={oliveSoftStyle}
                    onClick={() => setTomorrowOpen((v) => !v)}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cx(
                          "transition-transform",
                          tomorrowOpen ? "rotate-180" : ""
                        )}
                      >
                        ▾
                      </span>
                      <div className="text-sm font-semibold">Tomorrow</div>
                      <div className="text-xs text-neutral-400">Fri, Sep 13</div>
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {tomorrowEvents.length} items
                    </div>
                  </button>

                  {tomorrowOpen && (
                    <div className="mt-4">
                      <TimelineWithDayparts
                        blocks={tomorrowBlocks}
                        olive={OLIVE}
                        onToggleComplete={(id) => toggleComplete("tomorrow", id)}
                        onOpen={openDrawer}
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Right rail */}
              <aside className="col-span-12 lg:col-span-3 lg:pl-8 space-y-4 flex flex-col items-end">
                {/* Focus */}
                <div
                  className="w-full max-w-[340px] rounded-3xl border bg-white/6 backdrop-blur"
                  style={oliveCardStyle}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Focus</div>
                      <div className="text-[11px] text-neutral-400">
                        {focusMode === "Auto" ? "auto" : "manual"}
                      </div>
                    </div>

                    {/* keep these INSIDE the card + wrap */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["Auto", "Morning", "Afternoon", "Evening"] as const).map(
                        (k) => {
                          const active = focusMode === k;
                          return (
                            <button
                              key={k}
                              onClick={() => setFocusMode(k)}
                              className={cx(
                                "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                                active
                                  ? "bg-white/12 border-white/14"
                                  : "bg-white/6 border-white/10 hover:bg-white/10"
                              )}
                              style={active ? oliveSoftStyle : undefined}
                            >
                              {k}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="mt-3 text-sm text-neutral-200 leading-relaxed">
                      {focusCopy}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                        onClick={() => alert("UI shell")}
                      >
                        Build blocks
                      </button>
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                        onClick={() => alert("UI shell")}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick chat */}
                <div
                  className="w-full max-w-[340px] rounded-3xl border bg-white/6 backdrop-blur"
                  style={oliveCardStyle}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">
                        Schedule assistant
                      </div>
                      <div className="text-[11px] text-neutral-400">quick</div>
                    </div>

                    <div className="mt-2 text-sm text-neutral-200 leading-relaxed">
                      Conflicts, swaps, adding free time, or rebalancing your day.
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3">
                      <textarea
                        ref={quickChatRef}
                        value={quickChat}
                        onChange={(e) => setQuickChat(e.target.value)}
                        placeholder='Example: "Move gym to 5pm and add 30min deep work after class."'
                        rows={1}
                        className="w-full resize-none bg-transparent outline-none text-sm text-neutral-100 placeholder:text-neutral-500 leading-relaxed"
                        style={{ height: 0 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendQuickChat();
                          }
                        }}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500">
                          Enter to send • Shift+Enter for new line
                        </span>
                        <button
                          onClick={sendQuickChat}
                          disabled={!quickChat.trim()}
                          className={cx(
                            "ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold border transition",
                            quickChat.trim()
                              ? "bg-white/10 hover:bg-white/14 border-white/12"
                              : "bg-white/5 border-white/5 text-neutral-500 cursor-not-allowed"
                          )}
                          style={quickChat.trim() ? oliveSoftStyle : undefined}
                        >
                          Send
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        href="/chat"
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                      >
                        Open Chat
                      </Link>
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                        onClick={() => setQuickChat("")}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* Drawer overlay */}
        {drawerOpen && (
          <button
            className="fixed inset-0 bg-black/55 backdrop-blur-[1px] z-40"
            onClick={closeDrawer}
            aria-label="Close drawer"
          />
        )}

        {/* Drawer */}
        <div
          className={cx(
            "fixed top-0 right-0 h-full w-[420px] max-w-[92vw] z-50",
            "border-l border-white/10 bg-neutral-950/80 backdrop-blur",
            "transition-transform duration-200",
            drawerOpen ? "translate-x-0" : "translate-x-full"
          )}
          style={{
            boxShadow:
              "0 0 0 1px rgba(85,107,47,0.25), -24px 0 80px rgba(0,0,0,0.60)",
          }}
        >
          <div className="h-full flex flex-col">
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-2xl border bg-white/6 flex items-center justify-center text-sm font-semibold"
                  style={oliveSoftStyle}
                >
                  {selected?.tag?.slice(0, 1) ?? "E"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {selected?.title ?? "Event"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {formatRange(selected?.time, selected?.endTime)}
                    {selected?.location ? ` · ${selected.location}` : ""}
                  </div>

                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {selected?.tag && (
                      <span
                        className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                        style={getTagStyleDark(selected.tag)}
                      >
                        {selected.tag}
                      </span>
                    )}

                    {/* Importance control */}
                    {selected?.id && (
                      <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
                        <span className="text-[11px] text-neutral-400">
                          Importance
                        </span>

                        <select
                          value={getImportanceLabel(selected.importance)}
                          onChange={(e) => {
                            const tier = e.target.value as
                              | "Low"
                              | "Medium"
                              | "High";
                            const mapped: 1 | 2 | 3 | 4 | 5 =
                              tier === "High" ? 4 : tier === "Low" ? 2 : 3;
                            setImportance(selected.id, mapped);
                          }}
                          className="bg-transparent text-[11px] text-neutral-200 outline-none"
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
                  className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              {/* Tabs */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {(["Overview", "Assignments", "Files", "Notes"] as const).map(
                  (t) => (
                    <button
                      key={t}
                      onClick={() => setDrawerTab(t)}
                      className={cx(
                        "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                        drawerTab === t
                          ? "bg-white/12 border-white/14"
                          : "bg-white/6 border-white/10 hover:bg-white/10"
                      )}
                      style={drawerTab === t ? oliveSoftStyle : undefined}
                    >
                      {t}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Thoughts mini card */}
              {thoughtsOpen && (
                <div
                  className="rounded-3xl border bg-white/6"
                  style={oliveCardStyle}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Thoughts?</div>
                      <button
                        className="text-[11px] text-neutral-400 hover:text-neutral-200"
                        onClick={() => setThoughtsOpen(false)}
                      >
                        hide
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">
                      Quick note to yourself (or something you want the assistant
                      to remember).
                    </div>
                    <textarea
                      value={thoughtsText}
                      onChange={(e) => setThoughtsText(e.target.value)}
                      placeholder="e.g., Ask about CAPM intuition in office hours…"
                      className="mt-3 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3 text-sm outline-none placeholder:text-neutral-500 resize-none"
                      rows={3}
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                        onClick={() => alert("UI shell — would save note")}
                        disabled={!thoughtsText.trim()}
                      >
                        Save
                      </button>
                      <button
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                        onClick={() => setThoughtsText("")}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <DrawerContent selected={selected} tab={drawerTab} />
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-white/10 bg-neutral-950/60">
              <div className="flex gap-2">
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                  style={oliveSoftStyle}
                  onClick={() => alert("UI shell — Edit event")}
                >
                  Edit
                </button>
                {selected?.id && (
                  <button
                    className="rounded-2xl px-4 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                    onClick={() => removeEvent(selected.id)}
                  >
                    Drop
                  </button>
                )}
                <div className="ml-auto" />
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
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
              className="fixed inset-0 bg-black/65 backdrop-blur-[1px] z-[60]"
              style={{ animation: "fadeIn 180ms ease-out" }}
              onClick={() => setAdjustOpen(false)}
              aria-label="Close adjust"
            />
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
              <div
                className="relative rounded-3xl border bg-neutral-950/90 backdrop-blur overflow-hidden"
                style={{
                  width: adjustW,
                  height: adjustH,
                  borderColor: "rgba(85,107,47,0.40)",
                  boxShadow:
                    "0 0 0 1px rgba(85,107,47,0.25), 0 30px 120px rgba(0,0,0,0.70)",
                  animation: "fadeScaleIn 220ms ease-out",
                }}
              >
                <div className="px-5 py-4 border-b border-white/10 flex items-center">
                  <div>
                    <div className="text-sm font-semibold">Adjust</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Tune free time, focus protection, and quick edits (UI shell).
                    </div>
                  </div>
                  <button
                    onClick={() => setAdjustOpen(false)}
                    className="ml-auto rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
                  >
                    ✕
                  </button>
                </div>

                {/* scroll area */}
                <div className="p-5 h-[calc(100%-56px-64px)] overflow-y-auto">
                  <div className="grid grid-cols-12 gap-4">
                    {/* Controls */}
                    <div className="col-span-12 md:col-span-6 space-y-4">
                      <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold">Free time</div>
                          <div className="text-xs text-neutral-300">
                            {freeTimePct}%
                          </div>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          More free time = fewer blocks packed back-to-back.
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={45}
                          value={freeTimePct}
                          onChange={(e) => setFreeTimePct(Number(e.target.value))}
                          className="mt-3 w-full accent-[rgba(85,107,47,0.95)]"
                        />
                        <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
                          <span>10%</span>
                          <span>45%</span>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-white/10 bg-white/6 p-4 space-y-3">
                        <ToggleRow
                          label="Protect focus blocks"
                          desc="Keeps deep work earlier, reduces interruptions."
                          value={protectFocus}
                          onChange={setProtectFocus}
                        />
                        <ToggleRow
                          label="Auto rebalance"
                          desc="When you add/drop, the day gets re-packed."
                          value={autoRebalance}
                          onChange={setAutoRebalance}
                        />
                      </div>

                      {/* KEEP: Drop an event */}
                      <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                        <div className="text-sm font-semibold">Drop an event</div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Quick remove (UI shell).
                        </div>
                        <div className="mt-3 space-y-2 max-h-[260px] overflow-auto pr-1">
                          {todayEvents.map((e) => (
                            <div
                              key={e.id}
                              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-neutral-900/35 px-3 py-2"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="text-xs text-neutral-300 truncate">
                                  {formatRange(e.time, e.endTime)} · {e.title}
                                </div>
                                <div className="text-[11px] text-neutral-500 truncate">
                                  {e.meta}
                                </div>
                              </div>
                              <button
                                onClick={() => removeEvent(e.id)}
                                className="rounded-xl px-2 py-1 text-[11px] font-semibold border border-white/12 bg-white/6 hover:bg-white/10 transition"
                              >
                                Drop
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Add / Info */}
                    <div className="col-span-12 md:col-span-6 space-y-4">
                      <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                        <div className="text-sm font-semibold">Add an event</div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Adds to Today (UI shell).
                        </div>

                        <div className="mt-3 grid grid-cols-12 gap-2">
                          <div className="col-span-6">
                            <Label>Start</Label>
                            <input
                              value={addForm.time}
                              onChange={(e) =>
                                setAddForm((p) => ({
                                  ...p,
                                  time: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none"
                            />
                          </div>
                          <div className="col-span-6">
                            <Label>End</Label>
                            <input
                              value={addForm.endTime}
                              onChange={(e) =>
                                setAddForm((p) => ({
                                  ...p,
                                  endTime: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none"
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Title</Label>
                            <input
                              value={addForm.title}
                              onChange={(e) =>
                                setAddForm((p) => ({
                                  ...p,
                                  title: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none"
                              placeholder="e.g., Call Dylan"
                            />
                          </div>

                          <div className="col-span-12">
                            <Label>Meta</Label>
                            <input
                              value={addForm.meta}
                              onChange={(e) =>
                                setAddForm((p) => ({
                                  ...p,
                                  meta: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none"
                              placeholder="e.g., 20 min · quick sync"
                            />
                          </div>

                          <div className="col-span-6">
                            <Label>Type</Label>
                            <select
                              value={addForm.type}
                              onChange={(e) =>
                                setAddForm((p) => ({
                                  ...p,
                                  type: e.target.value as EventType,
                                }))
                              }
                              className="mt-1 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none"
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
                              onChange={(e) =>
                                setAddForm((p) => ({
                                  ...p,
                                  tag: e.target.value as any,
                                }))
                              }
                              className="mt-1 w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none"
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
                                    importance: Number(e.target.value) as
                                      | 1
                                      | 2
                                      | 3
                                      | 4
                                      | 5,
                                  }))
                                }
                                className="flex-1 accent-[rgba(85,107,47,0.95)]"
                              />
                              <span className="text-sm text-neutral-200 w-16 text-right">
                                {getImportanceLabel(addForm.importance)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            onClick={addEvent}
                            disabled={!addForm.title.trim()}
                            className={cx(
                              "rounded-2xl px-3 py-2 text-xs font-semibold border transition",
                              addForm.title.trim()
                                ? "bg-white/10 hover:bg-white/14 border-white/12"
                                : "bg-white/5 border-white/5 text-neutral-500 cursor-not-allowed"
                            )}
                            style={addForm.title.trim() ? oliveSoftStyle : undefined}
                          >
                            Add
                          </button>
                          <button
                            onClick={() =>
                              setAddForm((p) => ({ ...p, title: "", meta: "" }))
                            }
                            className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* KEEP: What this is */}
                      <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
                        <div className="text-sm font-semibold">What this is (for now)</div>
                        <div className="mt-2 text-sm text-neutral-300 leading-relaxed">
                          This “Adjust” panel is the control center. Later it becomes the place where
                          Jynx actually rebalances your day (importance, constraints, free time).
                        </div>
                        <div className="mt-3 text-xs text-neutral-500">
                          UI shell: protectFocus={String(protectFocus)} · autoRebalance=
                          {String(autoRebalance)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 border-t border-white/10 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setAdjustOpen(false)}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => alert("UI shell — would apply rebalance")}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                    style={oliveSoftStyle}
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

function TimelineWithDayparts({
  blocks,
  olive,
  onToggleComplete,
  onOpen,
}: {
  blocks: EventRecord[];
  olive: string;
  onToggleComplete: (id: string) => void;
  onOpen: (ev: EventRecord) => void;
}) {
  // boundaries: Morning < 12:00, Afternoon 12:00–5:00, Evening >= 5:00
  const marks = useMemo(() => {
    const firstAfternoonIdx = blocks.findIndex(
      (b) => timeSort(b.time) >= 12 * 60
    );
    const firstEveningIdx = blocks.findIndex((b) => timeSort(b.time) >= 17 * 60);
    return { firstAfternoonIdx, firstEveningIdx };
  }, [blocks]);

  return (
    <div className="space-y-3">
      <DaypartLine label="MORNING" hint="Before noon" />
      <div className="space-y-3">
        {blocks.map((e, idx) => {
          const showAfternoon =
            idx === marks.firstAfternoonIdx && marks.firstAfternoonIdx !== -1;
          const showEvening =
            idx === marks.firstEveningIdx && marks.firstEveningIdx !== -1;
          return (
            <div key={e.id}>
              {showAfternoon ? <DaypartLine label="AFTERNOON" hint="12–5 PM" /> : null}
              {showEvening ? <DaypartLine label="EVENING" hint="After 5 PM" /> : null}
              <TimeBlock
                event={e}
                olive={olive}
                isLast={idx === blocks.length - 1}
                onToggleComplete={() => onToggleComplete(e.id)}
                onOpen={() => onOpen(e)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DaypartLine({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-2">
      <div className="text-[11px] tracking-widest text-neutral-500 font-semibold">
        {label}
      </div>
      <div className="h-px flex-1 bg-white/8" />
      {hint ? <div className="text-[11px] text-neutral-500">{hint}</div> : null}
    </div>
  );
}

function DrawerContent({
  selected,
  tab,
}: {
  selected: EventRecord | null;
  tab: "Overview" | "Files" | "Assignments" | "Notes";
}) {
  if (!selected)
    return (
      <div className="text-sm text-neutral-400">
        Select an event to view details.
      </div>
    );

  const type = selected.type;
  const classD = selected.details?.class;
  const workD = selected.details?.work;
  const healthD = selected.details?.health;

  if (tab === "Overview") {
    return (
      <div className="space-y-4">
        <Panel title="Overview" subtitle="high-level details">
          <div className="text-sm text-neutral-200 leading-relaxed">
            {selected.meta}
          </div>

          {type === "class" && classD && (
            <div className="mt-4 space-y-2 text-sm">
              <InfoRow label="Instructor" value={classD.instructor} />
              <InfoRow label="Email" value={classD.email ?? "—"} />
              <InfoRow label="Room" value={classD.room} />
              <InfoRow label="Meets" value={classD.meetingPattern} />
              <div className="mt-3 text-xs text-neutral-400">Summary</div>
              <div className="text-sm text-neutral-200 leading-relaxed">
                {classD.shortSummary}
              </div>
            </div>
          )}

          {type === "work" && workD && (
            <div className="mt-4 space-y-2 text-sm">
              <InfoRow label="Owner" value={workD.owner ?? "—"} />
              <InfoRow label="Priority" value={workD.priority ?? "—"} />
              {workD.deliverables?.length ? (
                <>
                  <div className="mt-3 text-xs text-neutral-400">Deliverables</div>
                  <ul className="text-sm text-neutral-200 list-disc pl-5 space-y-1">
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
              <InfoRow label="Duration" value={healthD.duration ?? "—"} />
              {healthD.plan?.length ? (
                <>
                  <div className="mt-3 text-xs text-neutral-400">Plan</div>
                  <ul className="text-sm text-neutral-200 list-disc pl-5 space-y-1">
                    {healthD.plan.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {healthD.notes ? (
                <>
                  <div className="mt-3 text-xs text-neutral-400">Notes</div>
                  <div className="text-sm text-neutral-200 leading-relaxed">
                    {healthD.notes}
                  </div>
                </>
              ) : null}
            </div>
          )}
        </Panel>

        {type === "class" && classD?.nextTopics?.length ? (
          <Panel title="Next topics" subtitle="coming up">
            <ul className="text-sm text-neutral-200 list-disc pl-5 space-y-1">
              {classD.nextTopics.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Panel>
        ) : null}
      </div>
    );
  }

  if (tab === "Assignments") {
    if (type === "class" && classD?.assignmentsDue?.length) {
      return (
        <Panel title="Assignments" subtitle="due soon">
          <div className="space-y-2">
            {classD.assignmentsDue.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-neutral-100">
                    {a.title}
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/12 text-neutral-200">
                    {a.points ?? "—"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-400">
                  Due: {a.due}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      );
    }

    return (
      <Panel title="Assignments" subtitle="none found">
        <div className="text-sm text-neutral-400">
          This event type doesn’t have assignments yet.
        </div>
      </Panel>
    );
  }

  if (tab === "Files") {
    if (type === "class" && classD?.syllabusFiles?.length) {
      return (
        <Panel title="Files" subtitle="materials">
          <div className="space-y-2">
            {classD.syllabusFiles.map((f) => (
              <Link
                key={f.name}
                href={f.href}
                className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3 hover:bg-white/6 transition"
              >
                <div className="text-sm text-neutral-100">{f.name}</div>
                <div className="text-xs text-neutral-400">open</div>
              </Link>
            ))}
          </div>
        </Panel>
      );
    }

    if (type === "work" && workD?.links?.length) {
      return (
        <Panel title="Links" subtitle="resources">
          <div className="space-y-2">
            {workD.links.map((l) => (
              <Link
                key={l.name}
                href={l.href}
                className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3 hover:bg-white/6 transition"
              >
                <div className="text-sm text-neutral-100">{l.name}</div>
                <div className="text-xs text-neutral-400">open</div>
              </Link>
            ))}
          </div>
        </Panel>
      );
    }

    return (
      <Panel title="Files" subtitle="not available yet">
        <div className="text-sm text-neutral-400">
          Wire this to your Files tab later.
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Notes" subtitle="freeform">
      <textarea
        className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3 text-sm outline-none placeholder:text-neutral-500 resize-none"
        rows={6}
        placeholder="Add notes for this event…"
        defaultValue=""
      />
      <div className="mt-3 flex gap-2">
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
          style={oliveSoftStyle}
          onClick={() => alert("UI shell — save notes")}
        >
          Save
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
          onClick={() => alert("UI shell — clear notes")}
        >
          Clear
        </button>
      </div>
    </Panel>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">{title}</div>
          {subtitle ? (
            <div className="text-[11px] text-neutral-400">{subtitle}</div>
          ) : null}
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="text-sm text-neutral-200 text-right">{value}</div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div className="flex items-baseline gap-2">
          <div className="text-sm font-semibold text-neutral-100">{title}</div>
          {subtitle ? (
            <div className="text-xs text-neutral-500">{subtitle}</div>
          ) : null}
        </div>
        {right ?? null}
      </div>
      <div>{children}</div>
    </div>
  );
}

function PillStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1.5">
      <span className="text-[11px] text-neutral-400">{label}</span>
      <span className="text-[11px] font-semibold text-neutral-200">{value}</span>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] text-neutral-400 font-medium">{children}</div>;
}

function ToggleRow({
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
      className="w-full flex items-start gap-3 rounded-2xl border border-white/10 bg-neutral-900/30 px-3 py-3 hover:bg-white/6 transition text-left"
    >
      <div
        className="mt-0.5 h-4 w-7 rounded-full border border-white/15 relative"
        style={{
          background: value ? "rgba(85,107,47,0.35)" : "rgba(255,255,255,0.06)",
          boxShadow: value ? "0 0 0 1px rgba(85,107,47,0.25)" : undefined,
        }}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full"
          style={{
            left: value ? 16 : 2,
            background: value
              ? "rgba(235,245,230,0.95)"
              : "rgba(255,255,255,0.45)",
            transition: "left 140ms ease",
          }}
        />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-neutral-100">{label}</div>
        <div className="text-xs text-neutral-400 mt-0.5">{desc}</div>
      </div>
    </button>
  );
}

/**
 * ✅ Free time = “lane”, not a card
 * - subtle dashed capsule
 * - + Add appears on hover
 */
function GapBar({
  start,
  end,
  hint = "flexible",
  onAdd,
}: {
  start: string;
  end?: string;
  hint?: string;
  onAdd: () => void;
}) {
  return (
    <div className="group w-full">
      <div
        className="rounded-2xl px-4 py-3 border bg-white/[0.03]"
        style={{
          borderStyle: "dashed",
          borderColor: "rgba(255,255,255,0.14)",
          boxShadow: "inset 0 0 0 1px rgba(85,107,47,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5"
            style={{
              borderColor: "rgba(85,107,47,0.30)",
              background: "rgba(85,107,47,0.09)",
              color: "rgba(255,255,255,0.82)",
            }}
          >
            <span className="text-[11px] font-semibold">Free time</span>
          </span>

          <div className="min-w-0 flex items-center gap-2 text-[11px] text-neutral-400">
            <span className="truncate">
              {start}
              {end ? `–${end}` : ""}
            </span>
            <span className="text-neutral-600">•</span>
            <span className="font-semibold text-neutral-300">{hint}</span>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd();
            }}
            className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-neutral-200 hover:bg-white/8"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({
  event,
  olive,
  onToggleComplete,
  onOpen,
  isLast,
}: {
  event: EventRecord;
  olive: string;
  onToggleComplete: () => void;
  onOpen: () => void;
  isLast?: boolean;
}) {
  const completed = !!event.completed;
  const isFree = !!event.isFree;

  const cardStyle: React.CSSProperties = completed
    ? {
        opacity: 0.72,
        filter: "blur(1.15px) saturate(0.92)",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.22)",
      }
    : {
        opacity: 1,
        filter: "none",
        borderColor: isFree ? "rgba(255,255,255,0.08)" : "rgba(85,107,47,0.50)",
        boxShadow: isFree
          ? "none"
          : "0 0 0 1px rgba(85,107,47,0.35), 0 16px 44px rgba(0,0,0,0.35)",
      };

  const importanceLevel = getImportanceLabel(event.importance);

  // ✅ Free time dot = hollow marker
  const dotBg = isFree
    ? "rgba(0,0,0,0)"
    : completed
    ? "rgba(255,255,255,0.16)"
    : olive;

  const dotShadow = isFree
    ? "0 0 0 2px rgba(255,255,255,0.16)"
    : completed
    ? "0 0 0 1px rgba(255,255,255,0.12)"
    : "0 0 0 1px rgba(85,107,47,0.55), 0 0 22px rgba(85,107,47,0.22)";

  return (
    <div className="relative pl-8">
      {/* timeline spine */}
      <div
        className="absolute left-[10px] top-[-10px] bottom-[-10px] w-[2px]"
        style={{
          background: isLast
            ? "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.00))"
            : "linear-gradient(to bottom, rgba(255,255,255,0.10), rgba(255,255,255,0.10))",
        }}
      />

      {/* dot */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isFree) onToggleComplete();
        }}
        className={cx(
          "absolute left-[1px] top-6 h-[18px] w-[18px] rounded-full ring-[7px] ring-neutral-950 transition z-10 flex items-center justify-center",
          isFree ? "cursor-default" : "cursor-pointer"
        )}
        style={{
          backgroundColor: dotBg,
          boxShadow: dotShadow,
        }}
        aria-label={
          isFree
            ? "Free time marker"
            : completed
            ? "Mark as not complete"
            : "Mark as complete"
        }
        title={
          isFree ? "Free time" : completed ? "Mark as not complete" : "Mark as complete"
        }
      >
        {!isFree && completed && (
          <svg
            viewBox="0 0 20 20"
            fill="none"
            className="h-[11px] w-[11px]"
            aria-hidden="true"
          >
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

      {/* CONTENT */}
      {isFree ? (
        <div className="py-1">
          <GapBar
            start={event.time}
            end={event.endTime}
            hint="flexible"
            onAdd={() => alert("UI shell — add something into this free time")}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className={cx(
            "group w-full text-left rounded-3xl border backdrop-blur px-4 py-3 transition",
            "bg-white/6 hover:bg-white/8 hover:-translate-y-[1px]"
          )}
          style={cardStyle}
        >
          {/* time range INSIDE the block */}
          <div className="text-[11px] text-neutral-400 mb-1">
            {formatRange(event.time, event.endTime)}
          </div>

          <div className="flex justify-between items-center gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-100 truncate">
                {event.title}
              </div>
              <div className="text-xs text-neutral-400 mt-1 truncate">
                {event.meta}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span
                className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                style={getImportancePillStyle(importanceLevel)}
              >
                {importanceLevel}
              </span>

              <span
                className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                style={getTagStyleDark(event.tag)}
              >
                {event.tag}
              </span>
            </div>
          </div>

          {/* Hover behavior: unblur completed items */}
          {completed && (
            <style jsx>{`
              button.group:hover {
                filter: none !important;
                opacity: 0.92 !important;
              }
            `}</style>
          )}
        </button>
      )}
    </div>
  );
}

function formatRange(start?: string, end?: string) {
  if (!start && !end) return "—";
  if (start && end) return `${start}–${end}`;
  return start ?? end ?? "—";
}

/** Build free-time blocks between events (clean flow). */
function buildBlocksWithFreeTime(events: EventRecord[]) {
  const sorted = [...events].sort((a, b) => timeSort(a.time) - timeSort(b.time));
  const out: EventRecord[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const cur = sorted[i];
    out.push(cur);

    const next = sorted[i + 1];
    if (!next) continue;

    const curEnd = cur.endTime ? timeSort(cur.endTime) : timeSort(cur.time) + 60;
    const nextStart = timeSort(next.time);

    // only insert if meaningful gap (>= 20 min)
    if (nextStart - curEnd >= 20) {
      out.push({
        id: `free-${cur.id}-${next.id}`,
        type: "free",
        tag: "Flexible",
        title: "Free time",
        meta: `${minsToTime(curEnd)}–${minsToTime(nextStart)} · flexible`,
        time: minsToTime(curEnd),
        endTime: minsToTime(nextStart),
        completed: false,
        importance: 1,
        isFree: true,
      });
    }
  }

  return out;
}

function minsToTime(mins: number) {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const ap = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${String(m).padStart(2, "0")} ${ap}`;
}

/** simple helper: rough ordering for AM/PM strings (UI shell) */
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
