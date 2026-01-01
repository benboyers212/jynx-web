"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

type FamiliarityTier = "learning" | "calibrating" | "clear";

type Question = {
  id: string;
  tier: FamiliarityTier;
  prompt: string;
  type: "yesno";
  requiresSignals?: string[];
};

type Answer = {
  questionId: string;
  value: "yes" | "no" | "skip";
  answeredAt: number;
};

type Milestone = {
  id: string;
  kind: "insight" | "badge" | "feature";
  title: string;
  hint: string;
  descriptionUnlocked: string;
  appearsWhen: string;
  gate?: { minutes?: number; tasks?: number };
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function familiarityFromSignals(args: {
  minutes: number;
  daysUsed: number;
  answeredCount: number;
}): FamiliarityTier {
  const { minutes, daysUsed, answeredCount } = args;
  if (minutes >= 1800 && daysUsed >= 14) return "clear";
  if (minutes >= 400 && (daysUsed >= 5 || answeredCount >= 3)) return "calibrating";
  return "learning";
}

function tierLabel(t: FamiliarityTier) {
  if (t === "learning") return "Learning";
  if (t === "calibrating") return "Calibrating";
  return "Clearer patterns";
}

function tierTitle(t: FamiliarityTier) {
  if (t === "learning") return "Jynx is learning your rhythm";
  if (t === "calibrating") return "Jynx is calibrating to you";
  return "Patterns look clearer";
}

function tierSubcopy(t: FamiliarityTier) {
  if (t === "learning") {
    return "Early on, Jynx stays conservative. It only shows patterns when they’re likely to be true.";
  }
  if (t === "calibrating") {
    return "There’s enough signal to personalize timing and pacing — still refining what matters most.";
  }
  return "With stable patterns, check-ins fade and recommendations get more specific.";
}

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

/** Shared card primitive */
function Card({
  title,
  subtitle,
  right,
  children,
  olive = true,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  olive?: boolean;
}) {
  const panelBase = "rounded-3xl border bg-white/6 backdrop-blur";
  const oliveCardStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };
  const softCardStyle: React.CSSProperties = {
    borderColor: "rgba(255,255,255,0.12)",
    boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
  };

  return (
    <div className={panelBase} style={olive ? oliveCardStyle : softCardStyle}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold tracking-wide">{title}</div>
            {subtitle ? (
              <div className="mt-0.5 text-xs text-neutral-400">{subtitle}</div>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/** Simple popover (click to open, click outside / ESC to close) */
function InfoPopover({
  label = "Info",
  title,
  body,
}: {
  label?: string;
  title: string;
  body: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "h-7 w-7 rounded-full border border-white/12 bg-white/6 hover:bg-white/10 transition",
          "flex items-center justify-center text-xs font-semibold text-neutral-200"
        )}
        style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.18)" }}
      >
        ?
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-20 top-9 right-0 w-[320px] rounded-2xl border border-white/12 bg-neutral-950/90 backdrop-blur p-3"
          style={{
            boxShadow: "0 18px 50px rgba(0,0,0,0.55)",
            borderColor: "rgba(85,107,47,0.35)",
          }}
        >
          <div className="text-xs font-semibold text-neutral-100">{title}</div>
          <div className="mt-2 text-xs text-neutral-300 leading-relaxed">{body}</div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Tip: you can ignore this — it won’t change anything unless you want it to.
          </div>
        </div>
      )}
    </div>
  );
}

const QUESTION_BANK: Question[] = [
  {
    id: "q_pref_structure",
    tier: "learning",
    type: "yesno",
    prompt: "Do you prefer a structured schedule over a flexible one?",
  },
  {
    id: "q_stats_preference",
    tier: "learning",
    type: "yesno",
    prompt: "Do you like seeing detailed stats about your time?",
  },
  {
    id: "q_morning_productive",
    tier: "learning",
    type: "yesno",
    prompt: "Are mornings usually one of your most productive times?",
  },
  {
    id: "q_move_tasks_later",
    tier: "calibrating",
    type: "yesno",
    prompt: "Tasks often drift later — is that usually intentional?",
    requiresSignals: ["task_drift_later"],
  },
  {
    id: "q_long_sessions",
    tier: "calibrating",
    type: "yesno",
    prompt: "You tend to work in longer focus blocks — does that feel accurate?",
    requiresSignals: ["long_focus_blocks"],
  },
  {
    id: "q_change_strategy",
    tier: "clear",
    type: "yesno",
    prompt: "When plans change, do you prefer rescheduling rather than reducing scope?",
    requiresSignals: ["frequent_reschedules"],
  },
];

const MILESTONES: Milestone[] = [
  {
    id: "m1",
    kind: "insight",
    title: "Welcome to Jynx",
    hint: "A short note about why this matters.",
    descriptionUnlocked:
      "You took the first step toward using your time more intentionally. That’s the whole point.",
    appearsWhen: "Appears once you build your first schedule.",
    gate: { minutes: 1, tasks: 1 },
  },
  {
    id: "m2",
    kind: "insight",
    title: "Morning momentum",
    hint: "A safe, early pattern (if it exists).",
    descriptionUnlocked:
      "You complete tasks more often earlier in the day. Your mornings might be a strong window.",
    appearsWhen: "Emerges with a few consistent days of use.",
    gate: { minutes: 60 },
  },
  {
    id: "m3",
    kind: "insight",
    title: "Evening dip",
    hint: "A gentle contrast pattern.",
    descriptionUnlocked:
      "Tasks scheduled later are more likely to be skipped. Energy often dips after dinner.",
    appearsWhen: "Emerges once timing patterns stabilize.",
    gate: { minutes: 180 },
  },
  {
    id: "m4",
    kind: "feature",
    title: "Rhythm identity (optional)",
    hint: "A simple label for your rhythm — only when it’s responsible.",
    descriptionUnlocked:
      "Jynx can describe your rhythm in a simple way (optional). It’s meant to reduce friction, not label you.",
    appearsWhen: "Emerges with enough signal to describe patterns responsibly.",
    gate: { minutes: 350, tasks: 15 },
  },
  {
    id: "m5",
    kind: "insight",
    title: "Power hour",
    hint: "A concrete window when completion is highest.",
    descriptionUnlocked:
      "Jynx has enough signal to estimate your most reliable hour for harder tasks.",
    appearsWhen: "Appears once completion patterns become consistent.",
    gate: { minutes: 550, tasks: 25 },
  },
];

function kindPill(kind: Milestone["kind"]) {
  if (kind === "insight") return { label: "Insight", bg: "rgba(85,107,47,0.18)" };
  if (kind === "badge") return { label: "Badge", bg: "rgba(255,255,255,0.10)" };
  return { label: "Feature", bg: "rgba(255,255,255,0.10)" };
}

function isUnlocked(m: Milestone, stats: { minutes: number; tasks: number }) {
  const minOk = m.gate?.minutes == null ? true : stats.minutes >= m.gate.minutes;
  const taskOk = m.gate?.tasks == null ? true : stats.tasks >= m.gate.tasks;
  return minOk && taskOk;
}

export default function MyTimePage() {
  // mock stats (wire later)
  const [intentionalMinutes] = useState(620);
  const [tasksCompleted] = useState(42);
  const [daysUsed] = useState(6);

  // UI-only mock signals (wire later)
  const observedSignals = useMemo<string[]>(
    () => ["task_drift_later", "long_focus_blocks", "frequent_reschedules"],
    []
  );

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showDetail, setShowDetail] = useState(false);

  const tier = useMemo(
    () =>
      familiarityFromSignals({
        minutes: intentionalMinutes,
        daysUsed,
        answeredCount: answers.length,
      }),
    [intentionalMinutes, daysUsed, answers.length]
  );

  const answeredIds = useMemo(() => new Set(answers.map((a) => a.questionId)), [answers]);

  // throttle check-ins so it never feels like a survey
  const lastAnswerTime = useMemo(() => {
    if (!answers.length) return null;
    return Math.max(...answers.map((a) => a.answeredAt));
  }, [answers]);

  const canShowCheckIn = useMemo(() => {
    if (!lastAnswerTime) return true;
    const hoursSince = (Date.now() - lastAnswerTime) / (1000 * 60 * 60);
    return hoursSince >= 12;
  }, [lastAnswerTime]);

  const pendingQuestions = useMemo(() => {
    const rank: Record<FamiliarityTier, number> = { learning: 0, calibrating: 1, clear: 2 };

    const eligible = QUESTION_BANK.filter((q) => {
      if (answeredIds.has(q.id)) return false;
      if (rank[tier] < rank[q.tier]) return false;
      if (q.requiresSignals?.length) {
        return q.requiresSignals.every((s) => observedSignals.includes(s));
      }
      return true;
    });

    return eligible.slice(0, 1); // ONE question max
  }, [answeredIds, tier, observedSignals]);

  const showCheckIn = canShowCheckIn && pendingQuestions.length > 0;

  function answer(questionId: string, value: "yes" | "no" | "skip") {
    setAnswers((prev) => [...prev, { questionId, value, answeredAt: Date.now() }]);
  }

  // styling tokens
  const panelInner = "rounded-2xl border bg-neutral-900/40";
  const buttonBase = "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  const oliveCardStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };

  const oliveSoftStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.42)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
  };

  const stats = useMemo(
    () => ({ minutes: intentionalMinutes, tasks: tasksCompleted }),
    [intentionalMinutes, tasksCompleted]
  );

  // Only show what’s “now reliable”
  const reliable = useMemo(() => MILESTONES.filter((m) => isUnlocked(m, stats)), [stats]);

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

      <div className="relative h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-6">
          {/* Lightweight top row */}
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: OLIVE,
                    boxShadow: "0 0 0 4px rgba(85,107,47,0.18)",
                  }}
                />
                <div className="text-sm font-semibold tracking-wide truncate">My Time</div>
              </div>
              <div className="text-xs text-neutral-400 mt-1">
                A quiet mirror — what’s reliable, and what’s still forming.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200"
                style={{ borderColor: "rgba(85,107,47,0.28)" }}
              >
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: OLIVE }} />
                {tierLabel(tier)}
              </div>
            </div>
          </div>

          {/* HERO */}
          <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
            <div className="p-5">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border border-white/12 bg-white/10 text-neutral-200"
                      style={{ borderColor: "rgba(85,107,47,0.35)" }}
                    >
                      {tierLabel(tier)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="text-xs text-neutral-400">Intentional Minutes</div>
                    <InfoPopover
                      title="What are Intentional Minutes?"
                      body="Intentional Minutes are time spent completing planned work from your schedule — not time inside the app. It’s not a goal or a score. Just a quiet record of follow-through."
                    />
                  </div>

                  <div className="mt-1 flex items-baseline gap-3">
                    <div className="text-4xl md:text-5xl font-semibold tracking-tight">
                      {formatNumber(intentionalMinutes)}
                    </div>
                    <div className="text-sm text-neutral-400">minutes</div>
                  </div>

                  <div className="mt-3 text-sm text-neutral-200 leading-relaxed">
                    {tierTitle(tier)} — {tierSubcopy(tier)}
                  </div>

                  <div className="mt-3 text-[11px] text-neutral-500">
                    Nothing here is a rating of you. It’s only confidence in patterns.
                  </div>
                </div>

                <div className="w-full md:w-[300px]">
                  <div
                    className={cx(panelInner, "px-3 py-3")}
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-neutral-400">Tasks completed</div>
                      <div className="text-sm font-semibold text-neutral-100">
                        {formatNumber(tasksCompleted)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-neutral-400">Days used</div>
                      <div className="text-sm font-semibold text-neutral-100">
                        {formatNumber(daysUsed)}
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-neutral-500">
                      Used for context — not comparison.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDetail((v) => !v)}
                  className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                  style={oliveSoftStyle}
                >
                  {showDetail ? "Hide detail" : "Show detail"}
                </button>
              </div>

              {showDetail && (
                <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/40 p-4">
                  <div className="flex flex-wrap gap-2 text-[11px] text-neutral-300">
                    <span className="px-2 py-0.5 rounded-full bg-white/12">
                      Signals available: <span className="font-semibold">{observedSignals.length}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/12">
                      Check-ins answered: <span className="font-semibold">{answers.length}</span>
                    </span>
                  </div>

                  <div className="mt-3 text-xs text-neutral-400">
                    “Reliable” means: Jynx believes this pattern is stable enough to be useful without guessing.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="h-4" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT */}
            <div className="lg:col-span-7 space-y-4">
              <Card
                title="What’s now reliable"
                subtitle="A small set of patterns Jynx is confident enough to show."
                right={
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/12 text-neutral-200">
                    Confidence-based
                  </span>
                }
                olive
              >
                {reliable.length === 0 ? (
                  <div
                    className={cx(panelInner, "px-3 py-4")}
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    <div className="text-sm text-neutral-200">Nothing reliable to show yet.</div>
                    <div className="mt-1 text-xs text-neutral-400 leading-relaxed">
                      As you complete planned tasks, patterns become clearer — and this section quietly fills in.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reliable.map((m) => {
                      const pill = kindPill(m.kind);
                      return (
                        <div
                          key={m.id}
                          className={cx("rounded-2xl border px-3 py-3 flex gap-3 bg-neutral-900/40")}
                          style={{ borderColor: "rgba(255,255,255,0.12)" }}
                        >
                          <div className="shrink-0">
                            <div
                              className="h-9 w-9 rounded-2xl border flex items-center justify-center text-xs font-semibold"
                              style={{
                                borderColor: "rgba(85,107,47,0.45)",
                                background: "rgba(85,107,47,0.16)",
                                color: "rgba(255,255,255,0.92)",
                              }}
                            >
                              ✓
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-neutral-100 truncate">
                                  {m.title}
                                </div>
                                <div className="mt-0.5 text-xs text-neutral-400">
                                  {m.descriptionUnlocked}
                                </div>
                              </div>

                              <span
                                className="text-[10px] px-2 py-0.5 rounded-full border border-white/12"
                                style={{
                                  background: pill.bg,
                                  color: "rgba(255,255,255,0.80)",
                                  fontWeight: 700,
                                  borderColor: "rgba(85,107,47,0.35)",
                                }}
                              >
                                {pill.label}
                              </span>
                            </div>

                            <div className="mt-2 text-[11px] text-neutral-500">
                              Note: <span className="text-neutral-400">{m.hint}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-3">
                  <div className="text-xs text-neutral-400">
                    If anything here feels wrong, you can dismiss it later — Jynx will adapt.
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT */}
            <div className="lg:col-span-5 space-y-4">
              <Card
                title="Help Jynx learn (optional)"
                subtitle="One quick question when it meaningfully improves decisions."
                right={
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border border-white/12 bg-white/10 text-neutral-200"
                    style={{ borderColor: "rgba(85,107,47,0.35)" }}
                  >
                    {tierLabel(tier)}
                  </span>
                }
                olive
              >
                {!showCheckIn ? (
                  <div
                    className={cx(panelInner, "px-3 py-4")}
                    style={{ borderColor: "rgba(255,255,255,0.12)" }}
                  >
                    <div className="text-sm text-neutral-200">Nothing to answer right now.</div>
                    <div className="mt-1 text-xs text-neutral-400">
                      Jynx asks occasionally — not continuously — so it never feels like a survey.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingQuestions.map((q) => (
                      <div
                        key={q.id}
                        className={cx(panelInner, "px-3 py-3")}
                        style={{ borderColor: "rgba(255,255,255,0.12)" }}
                      >
                        <div className="text-sm font-semibold text-neutral-100">{q.prompt}</div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => answer(q.id, "yes")}
                            className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                            style={oliveSoftStyle}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => answer(q.id, "no")}
                            className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => answer(q.id, "skip")}
                            className={cx(
                              buttonBase,
                              "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                            )}
                          >
                            Skip
                          </button>
                        </div>

                        <div className="mt-2 text-[11px] text-neutral-500">
                          This doesn’t judge you. It only adjusts defaults (timing, pacing, explanations).
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* MOVED: Insights (latest) to right column */}
              <Card
                title="Insights (latest)"
                subtitle="Short reflections — with optional confirmation."
                olive
              >
                <div className="space-y-3">
                  {[
                    {
                      title: "Short tasks tend to run longer",
                      body:
                        "Tasks under ~30 minutes often run longer than expected. Want Jynx to pad similar tasks automatically?",
                      status: "Active",
                    },
                    {
                      title: "Weekly energy patterns",
                      body: "Emerges once routines stabilize across multiple weeks.",
                      status: "Emerging",
                    },
                  ].map((i) => (
                    <div
                      key={i.title}
                      className={cx(panelInner, "px-3 py-3")}
                      style={{ borderColor: "rgba(255,255,255,0.12)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-100">{i.title}</div>
                          <div className="mt-1 text-xs text-neutral-400 leading-relaxed">{i.body}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/12 text-neutral-200">
                          {i.status}
                        </span>
                      </div>

                      {i.status === "Active" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                            style={oliveSoftStyle}
                          >
                            Yes, pad similar tasks
                          </button>
                          <button className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}>
                            Not now
                          </button>
                          <button
                            className={cx(
                              buttonBase,
                              "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                            )}
                          >
                            Not true for me
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </main>
  );
}
