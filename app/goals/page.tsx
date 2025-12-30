"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/" },
  { label: "Chat", href: "/chat" },
  { label: "Files", href: "/files" },
];

type Trajectory = {
  id: string;
  title: string;
  description?: string;
};

type Milestone = { text: string; done: boolean };

type TargetBase = {
  id: string;
  title: string;
  window: string; // "This week", "Next 10 days", etc.
  trajectoryId: string;
  notes?: string;
  files?: Array<{ name: string; href: string }>;
};

type MilestoneTarget = TargetBase & {
  type: "milestones";
  milestones: Milestone[];
};

type MetricTarget = TargetBase & {
  type: "metric";
  current: number;
  goal: number;
  unit?: string;
};

type Target = MilestoneTarget | MetricTarget;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function progressOf(t: Target) {
  if (t.type === "metric") {
    if (t.goal <= 0) return 0;
    return clamp(t.current / t.goal, 0, 1);
  }
  const total = t.milestones.length || 1;
  const done = t.milestones.filter((m) => m.done).length;
  return clamp(done / total, 0, 1);
}

function nextActionOf(t: Target) {
  if (t.type === "metric") {
    const remaining = Math.max(0, t.goal - t.current);
    if (remaining === 0) return "Complete — keep momentum";
    return `Push ${remaining}${t.unit ? ` ${t.unit}` : ""} more`;
  }
  const next = t.milestones.find((m) => !m.done);
  return next ? next.text : "Complete — keep momentum";
}

function trajectoryName(traj: Trajectory[], id: string) {
  return traj.find((t) => t.id === id)?.title ?? "—";
}

function pillStyleDark(kind: string) {
  // uses olive when possible; otherwise neutral
  const base = {
    borderColor: "rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.86)",
    backgroundColor: "rgba(255,255,255,0.06)",
  };

  const olivey = {
    backgroundColor: "rgba(85,107,47,0.14)",
    color: "rgba(235,245,230,0.95)",
    borderColor: "rgba(85,107,47,0.40)",
  };

  // simple heuristic
  if (/school|finance|class|study/i.test(kind)) return base;
  if (/fitness|health|gym/i.test(kind)) return olivey;
  if (/jynx|build|product/i.test(kind)) return olivey;
  if (/career|recruit/i.test(kind)) return olivey;

  return base;
}

type DrawerTab = "Overview" | "Milestones" | "Files" | "Notes";

export default function GoalsPage() {
  // Trajectories (long-term direction)
  const [trajectories, setTrajectories] = useState<Trajectory[]>([
    {
      id: "tr1",
      title: "Top-quartile finance performance",
      description: "Consistent prep, practice, and exam execution.",
    },
    {
      id: "tr2",
      title: "Build a strong, consistent body",
      description: "Consistency > intensity. Stack weeks.",
    },
    {
      id: "tr3",
      title: "Ship Jynx to real users",
      description: "Keep building. Tighten feedback loops.",
    },
    {
      id: "tr4",
      title: "Career momentum",
      description: "Recruiting cadence, reps, and follow-through.",
    },
  ]);

  // Focus (singular)
  const [focus, setFocus] = useState("Protect deep work before noon");
  const [focusEditing, setFocusEditing] = useState(false);
  const [focusDraft, setFocusDraft] = useState(focus);
  const focusInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (focusEditing) {
      setTimeout(() => focusInputRef.current?.focus(), 0);
    }
  }, [focusEditing]);

  // Targets (short-term outcomes)
  const [targets, setTargets] = useState<Target[]>([
    {
      id: "tg1",
      type: "milestones",
      title: "Ace Exam 1 (F305)",
      window: "This week",
      trajectoryId: "tr1",
      milestones: [
        { text: "Finish Ch. 7 notes", done: true },
        { text: "Problem Set 3 (Q1–Q8)", done: false },
        { text: "Practice Exam A", done: false },
        { text: "Review errors + make question list", done: false },
        { text: "Office hours (ask 3 questions)", done: false },
      ],
      files: [
        { name: "Syllabus (PDF)", href: "/files" },
        { name: "Exam 1 Review Sheet", href: "/files" },
      ],
      notes: "",
    },
    {
      id: "tg2",
      type: "metric",
      title: "Lift 3x this week",
      window: "This week",
      trajectoryId: "tr2",
      current: 1,
      goal: 3,
      unit: "sessions",
      notes: "Keep sessions crisp. Avoid knee aggravators.",
    },
    {
      id: "tg3",
      type: "milestones",
      title: "Ship Goals tab v1",
      window: "Next 10 days",
      trajectoryId: "tr3",
      milestones: [
        { text: "Goals UI (focus + targets + drawer)", done: true },
        { text: "Persist to DB (later)", done: false },
        { text: "Link targets to schedule blocks (later)", done: false },
      ],
    },
    {
      id: "tg4",
      type: "metric",
      title: "Send 5 recruiting touchpoints",
      window: "This week",
      trajectoryId: "tr4",
      current: 2,
      goal: 5,
      unit: "messages",
      notes: "Keep it short. Ask for a 10-min call or a quick update.",
    },
  ]);

  // Create Target Modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWindow, setNewWindow] = useState("This week");
  const [newTrajectoryId, setNewTrajectoryId] = useState("tr1");
  const [newType, setNewType] = useState<Target["type"]>("milestones");

  // Milestones create
  const [newMilestones, setNewMilestones] = useState<Milestone[]>([
    { text: "First step", done: false },
    { text: "Second step", done: false },
    { text: "Third step", done: false },
  ]);

  // Metric create
  const [newCurrent, setNewCurrent] = useState(0);
  const [newGoal, setNewGoal] = useState(3);
  const [newUnit, setNewUnit] = useState("sessions");

  // Drawer (target detail)
  const [selected, setSelected] = useState<Target | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("Overview");

  // "Thoughts?" mini card inside drawer
  const [thoughtsOpen, setThoughtsOpen] = useState(false);
  const [thoughtsText, setThoughtsText] = useState("");

  // inline “quick increment” for metric targets in drawer
  const [metricBump, setMetricBump] = useState(1);

  function openDrawer(t: Target) {
    setSelected(t);
    setDrawerOpen(true);
    setDrawerTab("Overview");
    setThoughtsOpen(true);
    setThoughtsText("");
    setMetricBump(1);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setThoughtsOpen(false);
    setTimeout(() => setSelected(null), 200);
  }

  // ESC closes drawer / modals
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showCreate) setShowCreate(false);
        if (drawerOpen) closeDrawer();
        if (focusEditing) {
          setFocusEditing(false);
          setFocusDraft(focus);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreate, drawerOpen, focusEditing, focus]);

  function updateTarget(id: string, patch: Partial<Target>) {
    setTargets((prev) =>
      prev.map((t) => (t.id === id ? ({ ...t, ...patch } as Target) : t))
    );
  }

  function updateSelected(patch: Partial<Target>) {
    if (!selected) return;
    updateTarget(selected.id, patch);
    setSelected((s) => (s ? ({ ...s, ...patch } as Target) : s));
  }

  function toggleMilestone(targetId: string, idx: number) {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        if (t.type !== "milestones") return t;
        const ms = t.milestones.map((m, i) => (i === idx ? { ...m, done: !m.done } : m));
        return { ...t, milestones: ms };
      })
    );

    setSelected((s) => {
      if (!s || s.id !== targetId) return s;
      if (s.type !== "milestones") return s;
      const ms = s.milestones.map((m, i) => (i === idx ? { ...m, done: !m.done } : m));
      return { ...s, milestones: ms };
    });
  }

  function bumpMetric(targetId: string, amt: number) {
    setTargets((prev) =>
      prev.map((t) => {
        if (t.id !== targetId) return t;
        if (t.type !== "metric") return t;
        const next = clamp(t.current + amt, 0, t.goal);
        return { ...t, current: next };
      })
    );

    setSelected((s) => {
      if (!s || s.id !== targetId) return s;
      if (s.type !== "metric") return s;
      const next = clamp(s.current + amt, 0, s.goal);
      return { ...s, current: next };
    });
  }

  function resetCreate() {
    setNewTitle("");
    setNewWindow("This week");
    setNewTrajectoryId("tr1");
    setNewType("milestones");
    setNewMilestones([
      { text: "First step", done: false },
      { text: "Second step", done: false },
      { text: "Third step", done: false },
    ]);
    setNewCurrent(0);
    setNewGoal(3);
    setNewUnit("sessions");
  }

  function createTargetNow() {
    const title = newTitle.trim();
    if (!title) return alert("Add a target title.");

    const id = `tg_${Date.now()}_${uid()}`;

    let t: Target;
    if (newType === "metric") {
      t = {
        id,
        type: "metric",
        title,
        window: newWindow,
        trajectoryId: newTrajectoryId,
        current: Math.max(0, newCurrent),
        goal: Math.max(1, newGoal),
        unit: newUnit.trim() || undefined,
      };
    } else {
      const ms = newMilestones
        .map((m) => ({ ...m, text: m.text.trim() }))
        .filter((m) => m.text.length > 0);

      t = {
        id,
        type: "milestones",
        title,
        window: newWindow,
        trajectoryId: newTrajectoryId,
        milestones: ms.length ? ms : [{ text: "First step", done: false }],
      };
    }

    setTargets((prev) => [t, ...prev]);
    setShowCreate(false);
    resetCreate();
  }

  const targetsByTrajectory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of targets) {
      map[t.trajectoryId] = (map[t.trajectoryId] || 0) + 1;
    }
    return map;
  }, [targets]);

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
        {/* Sidebar (tabs) */}
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
                  <div className="text-sm font-semibold tracking-wide">Goals</div>
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Focus → Targets → Trajectory
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => {
                    resetCreate();
                    setShowCreate(true);
                  }}
                  className="rounded-xl px-3 py-2 text-xs font-semibold border bg-white/6 hover:bg-white/10 transition"
                  style={oliveSoftStyle}
                >
                  Create target
                </button>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                  UI shell
                </div>
              </div>
            </div>
          </header>

          {/* Content scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
              {/* Left / main */}
              <section className="col-span-12 lg:col-span-8 space-y-4">
                {/* Focus */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold">Focus</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          One sentence. Direction for today.
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!focusEditing ? (
                          <button
                            onClick={() => {
                              setFocusDraft(focus);
                              setFocusEditing(true);
                            }}
                            className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                            style={oliveSoftStyle}
                          >
                            Edit
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                const v = focusDraft.trim();
                                if (v) setFocus(v);
                                setFocusEditing(false);
                              }}
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                              style={oliveSoftStyle}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setFocusEditing(false);
                                setFocusDraft(focus);
                              }}
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      {!focusEditing ? (
                        <button
                          onClick={() => {
                            setFocusDraft(focus);
                            setFocusEditing(true);
                          }}
                          className="w-full text-left rounded-3xl border border-white/12 bg-neutral-900/35 px-4 py-4 hover:bg-white/6 transition"
                          style={oliveSoftStyle}
                        >
                          <div className="text-lg font-semibold text-neutral-100 leading-snug">
                            {focus}
                          </div>
                          <div className="mt-1 text-xs text-neutral-400">
                            Click to edit
                          </div>
                        </button>
                      ) : (
                        <div
                          className="rounded-3xl border border-white/12 bg-neutral-900/35 px-4 py-4"
                          style={oliveSoftStyle}
                        >
                          <input
                            ref={focusInputRef}
                            value={focusDraft}
                            onChange={(e) => setFocusDraft(e.target.value)}
                            className="w-full bg-transparent outline-none text-lg font-semibold text-neutral-100 placeholder:text-neutral-500"
                            placeholder="Your focus for today…"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const v = focusDraft.trim();
                                if (v) setFocus(v);
                                setFocusEditing(false);
                              }
                            }}
                          />
                          <div className="mt-2 text-[11px] text-neutral-500">
                            Enter to save • Esc to cancel
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Targets */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Targets</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Short-term outcomes. Progress stays honest.
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          resetCreate();
                          setShowCreate(true);
                        }}
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                      >
                        + New
                      </button>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {targets.map((t) => (
                        <TargetCard
                          key={t.id}
                          t={t}
                          trajectories={trajectories}
                          onOpen={() => openDrawer(t)}
                          onQuickToggle={(idx) => toggleMilestone(t.id, idx)}
                          onQuickBump={(amt) => bumpMetric(t.id, amt)}
                        />
                      ))}
                    </div>

                    {targets.length === 0 && (
                      <div className="mt-4 rounded-3xl border border-white/12 bg-neutral-900/35 p-5 text-sm text-neutral-300">
                        No targets yet. Create one to start building momentum.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* Right column */}
              <aside className="col-span-12 lg:col-span-4 space-y-4">
                {/* Trajectories */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Trajectories</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Long-term direction. No checkboxes.
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border bg-white/6"
                        style={{
                          borderColor: "rgba(85,107,47,0.35)",
                          color: "rgba(235,245,230,0.92)",
                        }}
                      >
                        Compass
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {trajectories.map((tr) => (
                        <div
                          key={tr.id}
                          className="rounded-3xl border border-white/12 bg-neutral-900/35 px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-neutral-100 truncate">
                                {tr.title}
                              </div>
                              {tr.description ? (
                                <div className="text-xs text-neutral-400 mt-1">
                                  {tr.description}
                                </div>
                              ) : null}
                              <div className="mt-2 text-[11px] text-neutral-300">
                                Targets: {targetsByTrajectory[tr.id] ?? 0}
                              </div>
                            </div>

                            <span
                              className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border shrink-0"
                              style={pillStyleDark(tr.title)}
                            >
                              Trajectory
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/35 p-4 text-sm text-neutral-300">
                      Targets should map to a trajectory. If something doesn’t… it’s probably noise.
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="text-sm font-semibold">Quick actions</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Lightweight nudges (UI shell for now)
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        className="rounded-2xl px-3 py-3 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                        onClick={() => setFocus("Protect deep work before noon")}
                      >
                        Reset Focus
                      </button>
                      <button
                        className="rounded-2xl px-3 py-3 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                        onClick={() => alert("UI shell")}
                      >
                        Weekly review
                      </button>
                      <button
                        className="rounded-2xl px-3 py-3 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                        onClick={() => alert("UI shell")}
                      >
                        Suggest targets
                      </button>
                      <button
                        className="rounded-2xl px-3 py-3 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                        onClick={() => {
                          resetCreate();
                          setShowCreate(true);
                        }}
                      >
                        New target
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
            "fixed top-0 right-0 h-full w-[440px] max-w-[92vw] z-50",
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
                  T
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold truncate">
                    {selected?.title ?? "Target"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    {selected
                      ? `${selected.window} · ${trajectoryName(
                          trajectories,
                          selected.trajectoryId
                        )}`
                      : ""}
                  </div>

                  {selected ? (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                        style={pillStyleDark(
                          trajectoryName(trajectories, selected.trajectoryId)
                        )}
                      >
                        {trajectoryName(trajectories, selected.trajectoryId)}
                      </span>

                      <span className="text-[11px] text-neutral-400">
                        {(progressOf(selected) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ) : null}
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
                {(["Overview", "Milestones", "Files", "Notes"] as DrawerTab[]).map((t) => (
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
              {/* Mini Thoughts card */}
              {thoughtsOpen && selected && (
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
                      placeholder="e.g., Make a list of the 5 topics I keep missing…"
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

              <DrawerContent
                tab={drawerTab}
                selected={selected}
                trajectories={trajectories}
                onToggleMilestone={toggleMilestone}
                onUpdateSelected={updateSelected}
                onBumpMetric={bumpMetric}
                metricBump={metricBump}
                setMetricBump={setMetricBump}
              />
            </div>

            {/* Drawer footer */}
            <div className="px-5 py-4 border-t border-white/10 bg-neutral-950/60">
              <div className="flex gap-2">
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                  style={oliveSoftStyle}
                  onClick={() => alert("UI shell — edit target")}
                >
                  Edit
                </button>
                <button
                  className="rounded-2xl px-4 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                  onClick={() => {
                    if (!selected) return;
                    const ok = confirm("Delete this target? (UI only)");
                    if (!ok) return;
                    setTargets((prev) => prev.filter((t) => t.id !== selected.id));
                    closeDrawer();
                  }}
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

        {/* Create Target Modal */}
        {showCreate && (
          <ModalDark onClose={() => setShowCreate(false)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Create target</div>
                <div className="text-xs text-neutral-400 mt-1">
                  Targets are short-term outcomes (milestones or metrics).
                </div>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <FieldDark label="Title">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                  placeholder="e.g., Finish Exam 1 prep"
                />
              </FieldDark>

              <div className="grid grid-cols-2 gap-3">
                <FieldDark label="Window">
                  <select
                    value={newWindow}
                    onChange={(e) => setNewWindow(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                  >
                    <option>This week</option>
                    <option>Next 10 days</option>
                    <option>This month</option>
                    <option>Next 30 days</option>
                  </select>
                </FieldDark>

                <FieldDark label="Trajectory">
                  <select
                    value={newTrajectoryId}
                    onChange={(e) => setNewTrajectoryId(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                  >
                    {trajectories.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </FieldDark>
              </div>

              <FieldDark label="Type">
                <div className="flex gap-2">
                  <button
                    className={cx(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                      newType === "milestones"
                        ? "bg-white/12 border-white/14"
                        : "bg-white/6 border-white/10 hover:bg-white/10"
                    )}
                    style={newType === "milestones" ? oliveSoftStyle : undefined}
                    onClick={() => setNewType("milestones")}
                    type="button"
                  >
                    Milestones
                  </button>
                  <button
                    className={cx(
                      "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                      newType === "metric"
                        ? "bg-white/12 border-white/14"
                        : "bg-white/6 border-white/10 hover:bg-white/10"
                    )}
                    style={newType === "metric" ? oliveSoftStyle : undefined}
                    onClick={() => setNewType("metric")}
                    type="button"
                  >
                    Metric
                  </button>
                </div>
              </FieldDark>

              {newType === "milestones" ? (
                <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-4">
                  <div className="text-sm font-semibold">Milestones</div>
                  <div className="text-xs text-neutral-400 mt-1">
                    3–6 steps works best. Keep them concrete.
                  </div>

                  <div className="mt-3 space-y-2">
                    {newMilestones.map((m, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          value={m.text}
                          onChange={(e) => {
                            const v = e.target.value;
                            setNewMilestones((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, text: v } : x))
                            );
                          }}
                          className="flex-1 rounded-2xl border border-white/12 bg-neutral-950/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                        />
                        <button
                          className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                          onClick={() =>
                            setNewMilestones((prev) => prev.filter((_, i) => i !== idx))
                          }
                          type="button"
                          disabled={newMilestones.length <= 1}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex justify-between">
                    <button
                      className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                      style={oliveSoftStyle}
                      onClick={() =>
                        setNewMilestones((prev) => [...prev, { text: "Next step", done: false }])
                      }
                      type="button"
                    >
                      + Add step
                    </button>
                    <div className="text-[11px] text-neutral-500">
                      {newMilestones.filter((m) => m.text.trim()).length} steps
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-4">
                  <div className="text-sm font-semibold">Metric</div>
                  <div className="text-xs text-neutral-400 mt-1">Example: 2 / 5 messages</div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div>
                      <div className="text-[11px] text-neutral-400 mb-1">Current</div>
                      <input
                        type="number"
                        value={newCurrent}
                        onChange={(e) => setNewCurrent(parseInt(e.target.value || "0", 10))}
                        className="w-full rounded-2xl border border-white/12 bg-neutral-950/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-400 mb-1">Goal</div>
                      <input
                        type="number"
                        value={newGoal}
                        onChange={(e) =>
                          setNewGoal(Math.max(1, parseInt(e.target.value || "1", 10)))
                        }
                        className="w-full rounded-2xl border border-white/12 bg-neutral-950/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                      />
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-400 mb-1">Unit</div>
                      <input
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="w-full rounded-2xl border border-white/12 bg-neutral-950/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                        placeholder="sessions"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-2 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
              >
                Cancel
              </button>
              <button
                onClick={createTargetNow}
                className="rounded-2xl px-3 py-2 text-xs font-semibold text-white"
                style={{ backgroundColor: OLIVE }}
              >
                Create
              </button>
            </div>
          </ModalDark>
        )}
      </div>
    </main>
  );
}

/**
 * ✅ FIXED: TargetCard wrapper is now a clickable <div role="button">,
 * so we don't have <button> inside <button> (hydration error).
 */
function TargetCard({
  t,
  trajectories,
  onOpen,
  onQuickToggle,
  onQuickBump,
}: {
  t: Target;
  trajectories: Trajectory[];
  onOpen: () => void;
  onQuickToggle: (idx: number) => void;
  onQuickBump: (amt: number) => void;
}) {
  const p = progressOf(t);
  const pct = Math.round(p * 100);
  const trajName = trajectoryName(trajectories, t.trajectoryId);
  const next = nextActionOf(t);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="w-full text-left rounded-3xl border bg-neutral-900/35 hover:bg-white/6 transition px-4 py-4 cursor-pointer outline-none focus:ring-2 focus:ring-white/10"
      style={{
        borderColor: "rgba(85,107,47,0.45)",
        boxShadow: "0 0 0 1px rgba(85,107,47,0.22), 0 16px 44px rgba(0,0,0,0.35)",
      }}
      aria-label={`Open target: ${t.title}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-neutral-100 truncate">{t.title}</div>
          <div className="text-xs text-neutral-400 mt-1">{t.window}</div>
        </div>

        <span
          className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border shrink-0"
          style={pillStyleDark(trajName)}
        >
          {trajName}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-white/10 border border-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, rgba(85,107,47,0.95), rgba(85,107,47,0.55))`,
              boxShadow: "0 0 18px rgba(85,107,47,0.22)",
            }}
          />
        </div>

        <div className="mt-3 text-xs text-neutral-300">
          <span className="text-neutral-400">Next:</span> {next}
        </div>
      </div>

      {/* Quick micro-actions */}
      <div className="mt-4">
        {t.type === "milestones" ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">Quick:</span>
            {t.milestones.slice(0, 2).map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickToggle(idx);
                }}
                className={cx(
                  "text-[11px] px-2 py-1 rounded-full border transition",
                  m.done
                    ? "border-white/12 bg-white/6 text-neutral-300"
                    : "border-white/12 bg-neutral-950/25 text-neutral-200 hover:bg-white/6"
                )}
                style={!m.done ? { borderColor: "rgba(85,107,47,0.35)" } : undefined}
                title={m.text}
              >
                {m.done ? "✓" : "○"} Step {idx + 1}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-500">Quick:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuickBump(1);
              }}
              className="text-[11px] px-2 py-1 rounded-full border border-white/12 bg-neutral-950/25 text-neutral-200 hover:bg-white/6 transition"
              style={{ borderColor: "rgba(85,107,47,0.35)" }}
            >
              +1
            </button>
            <span className="text-[11px] text-neutral-400">
              {t.current}/{t.goal}
              {t.unit ? ` ${t.unit}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- rest of your file unchanged below ---- */

function DrawerContent({
  tab,
  selected,
  trajectories,
  onToggleMilestone,
  onUpdateSelected,
  onBumpMetric,
  metricBump,
  setMetricBump,
}: {
  tab: DrawerTab;
  selected: Target | null;
  trajectories: Trajectory[];
  onToggleMilestone: (id: string, idx: number) => void;
  onUpdateSelected: (patch: Partial<Target>) => void;
  onBumpMetric: (id: string, amt: number) => void;
  metricBump: number;
  setMetricBump: (n: number) => void;
}) {
  if (!selected) {
    return (
      <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
        <div className="p-4 text-sm text-neutral-300">Select a target to view details.</div>
      </div>
    );
  }

  const trajName = trajectoryName(trajectories, selected.trajectoryId);

  if (tab === "Overview") {
    const p = progressOf(selected);
    const pct = Math.round(p * 100);
    return (
      <div className="space-y-4">
        <Panel title="Overview" subtitle="high-level">
          <div className="text-sm text-neutral-200 leading-relaxed">
            <div className="text-xs text-neutral-400">Window</div>
            <div className="mt-1">{selected.window}</div>

            <div className="mt-4 text-xs text-neutral-400">Trajectory</div>
            <div className="mt-1">{trajName}</div>

            <div className="mt-4 text-xs text-neutral-400">Next action</div>
            <div className="mt-1">{nextActionOf(selected)}</div>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span>Progress</span>
                <span>{pct}%</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, rgba(85,107,47,0.95), rgba(85,107,47,0.55))`,
                    boxShadow: "0 0 18px rgba(85,107,47,0.22)",
                  }}
                />
              </div>
            </div>

            {selected.type === "metric" ? (
              <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/35 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Metric</div>
                  <div className="text-sm text-neutral-200">
                    {selected.current}/{selected.goal}
                    {selected.unit ? ` ${selected.unit}` : ""}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                    style={oliveSoftStyle}
                    onClick={() => onBumpMetric(selected.id, metricBump)}
                  >
                    +{metricBump}
                  </button>
                  <input
                    type="number"
                    value={metricBump}
                    onChange={(e) =>
                      setMetricBump(Math.max(1, parseInt(e.target.value || "1", 10)))
                    }
                    className="w-24 rounded-2xl border border-white/12 bg-neutral-950/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                  />
                  <button
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
                    onClick={() => onBumpMetric(selected.id, -metricBump)}
                  >
                    -{metricBump}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </Panel>

        {selected.notes ? (
          <Panel title="Notes" subtitle="saved">
            <div className="text-sm text-neutral-200 leading-relaxed">{selected.notes}</div>
          </Panel>
        ) : null}
      </div>
    );
  }

  if (tab === "Milestones") {
    if (selected.type === "metric") {
      return (
        <Panel title="Milestones" subtitle="not applicable">
          <div className="text-sm text-neutral-300">
            This target uses a metric. Use Overview to update progress.
          </div>
        </Panel>
      );
    }

    const done = selected.milestones.filter((m) => m.done).length;
    const total = selected.milestones.length || 1;

    return (
      <Panel title="Milestones" subtitle={`${done}/${total}`}>
        <div className="space-y-2">
          {selected.milestones.map((m, idx) => (
            <button
              key={idx}
              onClick={() => onToggleMilestone(selected.id, idx)}
              className={cx(
                "w-full text-left rounded-2xl border px-3 py-3 transition",
                m.done
                  ? "border-white/12 bg-white/6 text-neutral-200"
                  : "border-white/12 bg-neutral-900/35 text-neutral-100 hover:bg-white/6"
              )}
              style={!m.done ? { borderColor: "rgba(85,107,47,0.35)" } : undefined}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-6 w-6 rounded-full border flex items-center justify-center"
                  style={
                    m.done
                      ? {
                          borderColor: "rgba(255,255,255,0.18)",
                          background: "rgba(255,255,255,0.08)",
                        }
                      : {
                          borderColor: "rgba(85,107,47,0.45)",
                          background: "rgba(85,107,47,0.14)",
                        }
                  }
                >
                  {m.done ? (
                    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                      <path
                        d="M16.5 6.0L8.5 14.0L4.0 9.5"
                        stroke="rgba(255,255,255,0.95)"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="text-[11px] text-white/80">•</span>
                  )}
                </span>
                <div className="text-sm">{m.text}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 text-xs text-neutral-500">
          Tip: keep steps concrete. If a step takes more than ~45 minutes, split it.
        </div>
      </Panel>
    );
  }

  if (tab === "Files") {
    const files = selected.files ?? [];
    return (
      <Panel title="Files" subtitle={files.length ? "linked" : "none"}>
        {files.length ? (
          <div className="space-y-2">
            {files.map((f) => (
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
        ) : (
          <div className="text-sm text-neutral-300">
            Wire this into Files later (ids, uploads, attachments).
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
            style={oliveSoftStyle}
            onClick={() => alert("UI shell — add file")}
          >
            + Add file
          </button>
          <button
            className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
            onClick={() => alert("UI shell — manage files")}
          >
            Manage
          </button>
        </div>
      </Panel>
    );
  }

  // Notes
  return (
    <Panel title="Notes" subtitle="freeform">
      <textarea
        className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3 text-sm outline-none placeholder:text-neutral-500 resize-none"
        rows={7}
        placeholder="Add notes for this target…"
        value={selected.notes ?? ""}
        onChange={(e) => onUpdateSelected({ notes: e.target.value } as any)}
      />

      <div className="mt-3 flex gap-2">
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
          style={oliveSoftStyle}
          onClick={() => alert("UI shell — saved automatically")}
        >
          Save
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
          onClick={() => onUpdateSelected({ notes: "" } as any)}
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

function FieldDark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

function ModalDark({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl border border-white/10 bg-neutral-950/85 backdrop-blur p-6"
        style={{
          boxShadow: "0 0 0 1px rgba(85,107,47,0.25), 0 30px 90px rgba(0,0,0,0.75)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
