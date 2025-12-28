"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/", active: true },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat" },
  { label: "Files", href: "/files" },
];

type EventType = "class" | "work" | "health" | "prep" | "study" | "life";

type BaseEvent = {
  id: string;
  type: EventType;
  tag: string;
  title: string;
  meta: string;
  time: string;
  location?: string;
  completed?: boolean;
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

  const map: Record<string, { backgroundColor: string; color: string; borderColor: string }> = {
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
  };

  return map[tag] ?? base;
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
      title: "F305 — Intermediate Investments",
      meta: "Hodge Hall 2056 · Exam 1 review",
      location: "Hodge Hall 2056",
      completed: false,
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
      title: "Deep Work — Problem Set",
      meta: "Focus block · 90 min",
      completed: false,
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
      title: "Gym",
      meta: "Chest + tris · 60 min",
      completed: false,
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
      title: "Prep — F305 reading",
      meta: "Ch. 7 · 25 min",
      completed: false,
    },
  ]);

  const tomorrowEvents: EventRecord[] = useMemo(
    () => [
      {
        id: "t1",
        type: "class",
        tag: "Class",
        time: "10:00 AM",
        title: "F305 — Lecture",
        meta: "Portfolio theory",
        location: "Hodge Hall 2056",
        completed: false,
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
        title: "Study — F305",
        meta: "Review notes · 60 min",
        completed: false,
      },
      {
        id: "t3",
        type: "life",
        tag: "Life",
        time: "6:30 PM",
        title: "Dinner + reset",
        meta: "Light night · 45 min",
        completed: false,
      },
    ],
    []
  );

  // Drawer state
  const [selected, setSelected] = useState<EventRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"Overview" | "Files" | "Assignments" | "Notes">(
    "Overview"
  );

  // Quick chat input
  const [quickChat, setQuickChat] = useState("");
  const quickChatRef = useRef<HTMLTextAreaElement | null>(null);

  // "Thoughts?" mini card when event is opened
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const [thoughtsText, setThoughtsText] = useState("");

  // Autosize quick chat + thoughts
  useEffect(() => {
    const el = quickChatRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  }, [quickChat]);

  function openDrawer(ev: EventRecord) {
    setSelected(ev);
    setDrawerOpen(true);
    setDrawerTab("Overview");
    setThoughtsOpen(true);
    setThoughtsText("");
  }

  function closeDrawer() {
    setDrawerOpen(false);
    // keep selected for transition; clear after
    setTimeout(() => setSelected(null), 200);
    setThoughtsOpen(false);
  }

  // ESC to close drawer
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    if (drawerOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen]);

  function toggleComplete(id: string) {
    setTodayEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, completed: !e.completed } : e))
    );
  }

  function sendQuickChat() {
    const text = quickChat.trim();
    if (!text) return;
    // UI shell action — for now we just clear and optionally route to /chat later
    setQuickChat("");
    alert(`UI shell — would send to assistant:\n\n"${text}"`);
  }

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
        {/* Tabs sidebar */}
        <aside className="w-64 border-r border-white/10 bg-neutral-950/60 backdrop-blur hidden md:flex flex-col">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-white/12 bg-white/6 flex items-center justify-center text-xs font-semibold">
                LOGO
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide">Jynx</div>
                <div className="text-xs text-neutral-400">Your schedule system</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition"
                style={
                  t.active
                    ? { backgroundColor: OLIVE, color: "white", fontWeight: 700 }
                    : { color: "#D4D4D4" }
                }
              >
                <span>{t.label}</span>
                {t.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15">
                    Active
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <header className="border-b border-white/10 bg-neutral-950/45 backdrop-blur shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: OLIVE,
                      boxShadow: "0 0 0 4px rgba(85,107,47,0.18)",
                    }}
                  />
                  <div className="text-sm font-semibold tracking-wide">Schedule</div>
                </div>
                <div className="text-xs text-neutral-400 mt-1">Today · Optimized for focus</div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  className="rounded-xl px-3 py-2 text-xs font-semibold border bg-white/6 hover:bg-white/10 transition"
                  style={oliveSoftStyle}
                  onClick={() => alert("UI shell")}
                >
                  Optimize
                </button>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                  UI shell
                </div>
              </div>
            </div>
          </header>

          {/* Body scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
              {/* Schedule timeline */}
              <section className="col-span-12 lg:col-span-8">
                <Section title="Today · Thu, Sep 12">
                  {todayEvents.map((e) => (
                    <TimeBlock
                      key={e.id}
                      event={e}
                      olive={OLIVE}
                      onToggleComplete={() => toggleComplete(e.id)}
                      onOpen={() => openDrawer(e)}
                    />
                  ))}
                </Section>

                <Section title="Tomorrow · Fri, Sep 13">
                  {tomorrowEvents.map((e) => (
                    <TimeBlock
                      key={e.id}
                      event={e}
                      olive={OLIVE}
                      onToggleComplete={() => alert("UI shell")}
                      onOpen={() => openDrawer(e)}
                    />
                  ))}
                </Section>
              </section>

              {/* Right column */}
              <aside className="col-span-12 lg:col-span-4 space-y-4">
                {/* Today’s focus */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Today’s focus</div>
                      <div className="text-[11px] text-neutral-400">nudge</div>
                    </div>
                    <div className="mt-2 text-sm text-neutral-200 leading-relaxed">
                      Your most demanding work is earlier today. Protect that window and keep
                      distractions low.
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

                {/* Patterns */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Patterns</div>
                      <div className="text-[11px] text-neutral-400">insights</div>
                    </div>
                    <ul className="mt-3 space-y-2 text-sm text-neutral-200 list-disc pl-5">
                      <li>Most productive in the late morning</li>
                      <li>Schedule hardest tasks before 2 PM</li>
                      <li>Short prep blocks beat long sessions</li>
                    </ul>
                  </div>
                </div>

                {/* Quick chat — now actually typeable */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Quick chat</div>
                      <div className="text-[11px] text-neutral-400">assistant</div>
                    </div>

                    <div className="mt-2 text-sm text-neutral-200 leading-relaxed">
                      Ask about conflicts, changes, what to focus on next, or optimizing today.
                    </div>

                    <div className="mt-3 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3">
                      <textarea
                        ref={quickChatRef}
                        value={quickChat}
                        onChange={(e) => setQuickChat(e.target.value)}
                        placeholder='Example: "Move my gym after class and add a 45-min F305 study block before dinner."'
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
            boxShadow: "0 0 0 1px rgba(85,107,47,0.25), -24px 0 80px rgba(0,0,0,0.60)",
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
                    {selected?.time}
                    {selected?.location ? ` · ${selected.location}` : ""}
                  </div>
                  {selected?.tag && (
                    <div className="mt-2">
                      <span
                        className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                        style={getTagStyleDark(selected.tag)}
                      >
                        {selected.tag}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  onClick={closeDrawer}
                  className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
                >
                  ✕
                </button>
              </div>

              {/* Tabs (based on type) */}
              <div className="mt-4 flex gap-2 flex-wrap">
                {(["Overview", "Assignments", "Files", "Notes"] as const).map((t) => (
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
                ))}
              </div>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* Mini "Thoughts?" card */}
              {thoughtsOpen && (
                <div className="rounded-3xl border bg-white/6" style={oliveCardStyle}>
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
                      Quick note to yourself (or something you want the assistant to remember).
                    </div>
                    <textarea
                      value={thoughtsText}
                      onChange={(e) => setThoughtsText(e.target.value)}
                      placeholder="e.g., I should ask a question about CAPM in office hours…"
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

              {/* Content based on type + tab */}
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
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                  onClick={() => alert("UI shell — Delete event")}
                >
                  Delete
                </button>
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
      </div>
    </main>
  );
}

function DrawerContent({
  selected,
  tab,
}: {
  selected: EventRecord | null;
  tab: "Overview" | "Files" | "Assignments" | "Notes";
}) {
  if (!selected) {
    return (
      <div className="text-sm text-neutral-400">
        Select an event to view details.
      </div>
    );
  }

  const type = selected.type;

  // Defaults
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
        <Panel title="Assignments" subtitle="due before next class">
          <div className="space-y-2">
            {classD.assignmentsDue.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-neutral-100">{a.title}</div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 border border-white/12 text-neutral-200">
                    {a.points ?? "—"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-neutral-400">Due: {a.due}</div>
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
        <Panel title="Files" subtitle="syllabus + materials">
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
          Wire this to your Files tab later (file ids, uploads, etc.).
        </div>
      </Panel>
    );
  }

  // Notes tab
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
          {subtitle ? <div className="text-[11px] text-neutral-400">{subtitle}</div> : null}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-3">
        {title}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function TimeBlock({
  event,
  olive,
  onToggleComplete,
  onOpen,
}: {
  event: EventRecord;
  olive: string;
  onToggleComplete: () => void;
  onOpen: () => void;
}) {
  const completed = !!event.completed;

  return (
    <div className="flex gap-5">
      {/* Time */}
      <div className="w-24 text-sm font-semibold flex items-center text-neutral-200">
        {event.time}
      </div>

      <div className="relative flex-1">
        {/* Timeline spine */}
        <div className="absolute left-[-16px] top-0 bottom-0 w-[2px] bg-white/10" />

        {/* Timeline dot (clickable to complete) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          className="absolute left-[-23px] top-1/2 -translate-y-1/2 h-[16px] w-[16px] rounded-full ring-[6px] ring-neutral-950 shadow-sm transition z-10 flex items-center justify-center"
          style={{
            backgroundColor: completed ? "rgba(255,255,255,0.18)" : olive,
            boxShadow: completed
              ? "0 0 0 1px rgba(255,255,255,0.12)"
              : "0 0 0 1px rgba(85,107,47,0.55), 0 0 22px rgba(85,107,47,0.22)",
            cursor: "pointer",
          }}
          aria-label={completed ? "Mark as not complete" : "Mark as complete"}
          title={completed ? "Mark as not complete" : "Mark as complete"}
        >
          {completed && (
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-[10px] w-[10px]"
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

        {/* Card (click to open drawer) */}
        <button
          type="button"
          onClick={onOpen}
          className={cx(
            "w-full text-left rounded-3xl border bg-white/6 backdrop-blur px-4 py-3 transition",
            "hover:-translate-y-[1px] hover:bg-white/8"
          )}
          style={{
            borderColor: completed ? "rgba(255,255,255,0.12)" : "rgba(85,107,47,0.50)",
            boxShadow: completed
              ? "0 10px 30px rgba(0,0,0,0.25)"
              : "0 0 0 1px rgba(85,107,47,0.35), 0 16px 44px rgba(0,0,0,0.35)",
            opacity: completed ? 0.88 : 1,
          }}
        >
          <div className="flex justify-between items-center gap-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-neutral-100 truncate">
                {event.title}
              </div>
              <div className="text-xs text-neutral-400 mt-1 truncate">{event.meta}</div>
            </div>

            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border shrink-0"
              style={getTagStyleDark(event.tag)}
            >
              {event.tag}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
