"use client";

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SlidersHorizontal, Pin } from "lucide-react";

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

type Insight = {
  id: string;
  title: string;
  summary: string;
  kind: Milestone["kind"];
  confidencePct: number; // 0..100
  signals: string[];
  appearsWhen: string;
  details: string[];
  trend: number[]; // small sparkline points
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/** Light brand accent (kept subtle) */
const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

function familiarityFromSignals(args: { minutes: number; daysUsed: number; answeredCount: number }): FamiliarityTier {
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

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(n);
}

const QUESTION_BANK: Question[] = [
  { id: "q_pref_structure", tier: "learning", type: "yesno", prompt: "Do you prefer a structured schedule over a flexible one?" },
  { id: "q_stats_preference", tier: "learning", type: "yesno", prompt: "Do you like seeing detailed stats about your time?" },
  { id: "q_morning_productive", tier: "learning", type: "yesno", prompt: "Are mornings usually one of your most productive times?" },
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
    descriptionUnlocked: "You took the first step toward using your time more intentionally. That’s the whole point.",
    appearsWhen: "Appears once you build your first schedule.",
    gate: { minutes: 1, tasks: 1 },
  },
  {
    id: "m2",
    kind: "insight",
    title: "Morning momentum",
    hint: "A safe, early pattern (if it exists).",
    descriptionUnlocked: "You complete tasks more often earlier in the day. Your mornings might be a strong window.",
    appearsWhen: "Emerges with a few consistent days of use.",
    gate: { minutes: 60 },
  },
  {
    id: "m3",
    kind: "insight",
    title: "Evening dip",
    hint: "A gentle contrast pattern.",
    descriptionUnlocked: "Tasks scheduled later are more likely to be skipped. Energy often dips after dinner.",
    appearsWhen: "Emerges once timing patterns stabilize.",
    gate: { minutes: 180 },
  },
  {
    id: "m4",
    kind: "feature",
    title: "Rhythm identity (optional)",
    hint: "A simple label for your rhythm — only when it’s responsible.",
    descriptionUnlocked: "Jynx can describe your rhythm in a simple way (optional). It’s meant to reduce friction, not label you.",
    appearsWhen: "Emerges with enough signal to describe patterns responsibly.",
    gate: { minutes: 350, tasks: 15 },
  },
  {
    id: "m5",
    kind: "insight",
    title: "Power hour",
    hint: "A concrete window when completion is highest.",
    descriptionUnlocked: "Jynx has enough signal to estimate your most reliable hour for harder tasks.",
    appearsWhen: "Appears once completion patterns become consistent.",
    gate: { minutes: 550, tasks: 25 },
  },
];

function isUnlocked(m: Milestone, stats: { minutes: number; tasks: number }) {
  const minOk = m.gate?.minutes == null ? true : stats.minutes >= m.gate.minutes;
  const taskOk = m.gate?.tasks == null ? true : stats.tasks >= m.gate.tasks;
  return minOk && taskOk;
}

function kindMeta(kind: Milestone["kind"]) {
  if (kind === "insight") return { label: "Insight", tint: rgbaBrand(0.10), border: rgbaBrand(0.22) };
  if (kind === "feature") return { label: "Feature", tint: "rgba(0,0,0,0.03)", border: "rgba(0,0,0,0.10)" };
  return { label: "Badge", tint: "rgba(0,0,0,0.03)", border: "rgba(0,0,0,0.10)" };
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function sparkFromSeed(seed: number, len = 10) {
  const arr: number[] = [];
  let v = 50 + (seed % 11) * 2;
  for (let i = 0; i < len; i++) {
    v += ((seed + i * 7) % 9) - 4;
    v = clamp(v, 20, 90);
    arr.push(v);
  }
  return arr;
}

/* ---------- Shared light styles ---------- */

const maxW = "max-w-[1280px]";

const surfaceStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
};

const surfaceSoftStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
};

function Pill({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
      style={{
        borderColor: active ? rgbaBrand(0.22) : "rgba(0,0,0,0.10)",
        background: active ? rgbaBrand(0.10) : "rgba(0,0,0,0.02)",
        color: "rgba(0,0,0,0.78)",
        boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.06)}` : undefined,
      }}
    >
      {children}
    </span>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-3 py-2" style={surfaceSoftStyle}>
      <div className="text-[10px] text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 110;
  const h = 34;
  const pad = 3;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;

  const d = points
    .map((p, i) => {
      const x = pad + (i * (w - pad * 2)) / (points.length - 1);
      const y = pad + (1 - (p - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="block">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.75" />
    </svg>
  );
}

function SimpleBars({
  title,
  bars,
}: {
  title: string;
  bars: Array<{ label: string; value: number }>;
}) {
  return (
    <div className="rounded-3xl border bg-white p-4" style={surfaceStyle}>
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      <div className="mt-3 space-y-2">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <div className="w-16 text-[11px] text-neutral-500">{b.label}</div>
            <div className="flex-1 h-2 rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${clamp(b.value, 0, 100)}%`,
                  background: rgbaBrand(0.35),
                }}
              />
            </div>
            <div className="w-10 text-right text-[11px] text-neutral-600">{Math.round(b.value)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Drawer ---------- */

function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/30" onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-[80] w-[92vw] max-w-[520px] bg-white border-l flex flex-col"
        style={{ borderColor: "rgba(0,0,0,0.10)" }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-neutral-900 truncate">{title}</div>
              {subtitle ? <div className="text-[11px] text-neutral-500 truncate mt-0.5">{subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
              style={surfaceSoftStyle}
              aria-label="Close"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        <div className="px-5 py-4 border-t bg-white" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
            style={surfaceSoftStyle}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}

/* ---------- Orb Visual Module ---------- */

function OrbModule({
  scorePct,
  nodes,
  onOpenInsight,
}: {
  scorePct: number;
  nodes: Array<{ id: string; label: string; confidencePct: number }>;
  onOpenInsight: (id: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [stageW, setStageW] = useState(0);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setStageW(r.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cxp = r.left + r.width / 2;
      const cyp = r.top + r.height / 2;
      const dx = (e.clientX - cxp) / r.width;
      const dy = (e.clientY - cyp) / r.height;

      // IMPORTANT: smaller tilt so 3D never clips
      setTilt({ x: clamp(dx * 6, -6, 6), y: clamp(dy * 6, -6, 6) });
    }

    function onLeave() {
      setTilt({ x: 0, y: 0 });
    }

    const el = wrapRef.current;
    if (!el) return;

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // Responsive sizing so it NEVER cuts off (key fix)
  const stageSize = useMemo(() => {
    // cap to avoid giant orb; pad so rotation/nodes stay in-bounds
    const usable = clamp(stageW, 280, 640);
    // orb group uses radius ~118 + button radius ~20, needs ~280+ with tilt.
    // we keep a comfy envelope with a bigger stage and scale down if narrow.
    const scale = usable < 360 ? 0.86 : usable < 460 ? 0.92 : 1.0;
    return { usable, scale };
  }, [stageW]);

  const ringStyle: CSSProperties = {
    background: `conic-gradient(${rgbaBrand(0.55)} ${scorePct}%, rgba(0,0,0,0.08) 0)`,
  };

  return (
    <div ref={wrapRef} className="rounded-3xl border bg-white p-4 overflow-hidden relative" style={surfaceStyle}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-neutral-900">Reliability map</div>
          <div className="mt-1 text-[11px] text-neutral-500">
            The orb is a visual of confidence: stronger glow = more stable patterns.
          </div>
        </div>
        <Pill active>{Math.round(scorePct)}% stable</Pill>
      </div>

      <div className="mt-4 relative">
        {/* Stage */}
        <div
          ref={stageRef}
          className="relative rounded-3xl border bg-neutral-50"
          style={{
            borderColor: "rgba(0,0,0,0.08)",
            // Taller stage = no clipping
            height: 320,
            // allow subtle 3D without cutting, but still keep rounded corners
            overflow: "hidden",
          }}
        >
          {/* soft ambient */}
          <div
            className="absolute -top-24 left-1/2 h-[360px] w-[560px] -translate-x-1/2 rounded-full blur-3xl opacity-60"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${rgbaBrand(0.24)}, rgba(255,255,255,0) 62%)`,
            }}
          />

          {/* Orb group (scaled) */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(-50%, -50%) scale(${stageSize.scale}) rotateX(${(-tilt.y).toFixed(
                2
              )}deg) rotateY(${tilt.x.toFixed(2)}deg)`,
              transformStyle: "preserve-3d",
              perspective: 900,
            }}
          >
            {/* outer ring */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[190px] w-[190px] rounded-full p-[2px]"
              style={ringStyle}
            >
              <div className="h-full w-full rounded-full bg-white/95" />
            </div>

            {/* orbit ring */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[230px] w-[230px] rounded-full border"
              style={{
                borderColor: "rgba(0,0,0,0.10)",
                boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
              }}
            />

            {/* orb */}
            <div
              className="relative h-[150px] w-[150px] rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.98), ${rgbaBrand(
                  0.16
                )} 35%, rgba(0,0,0,0.06) 72%)`,
                boxShadow: `0 20px 55px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06), 0 0 32px ${rgbaBrand(
                  0.14
                )}`,
                animation: "jynxGlow 4.2s ease-in-out infinite",
              }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 25% 20%, rgba(255,255,255,0.9), rgba(255,255,255,0) 45%)`,
                  opacity: 0.9,
                }}
              />
              <div className="absolute inset-0 rounded-full" style={{ boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.06)` }} />
            </div>

            {/* nodes (clickable) */}
            {nodes.slice(0, 4).map((n, idx) => {
              const angles = [25, 135, 215, 320];
              const a = angles[idx % angles.length];
              const radius = 118;
              const x = Math.cos((a * Math.PI) / 180) * radius;
              const y = Math.sin((a * Math.PI) / 180) * radius;

              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onOpenInsight(n.id)}
                  className="absolute h-10 w-10 rounded-2xl border bg-white hover:bg-black/[0.02] transition flex items-center justify-center"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translate(-50%, -50%)",
                    borderColor: "rgba(0,0,0,0.10)",
                    boxShadow: `0 10px 25px rgba(0,0,0,0.10), 0 0 0 1px ${rgbaBrand(0.06)}`,
                  }}
                  aria-label={`Open insight: ${n.label}`}
                  title={`${n.label} • ${n.confidencePct}%`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: n.confidencePct >= 75 ? rgbaBrand(0.75) : rgbaBrand(0.45),
                      boxShadow: `0 0 0 4px ${rgbaBrand(0.10)}`,
                    }}
                  />
                </button>
              );
            })}
          </div>

          {/* legend row */}
          <div className="absolute left-4 right-4 bottom-4 flex flex-wrap gap-2 items-center">
            <Pill>Click nodes</Pill>
            <span className="text-[11px] text-neutral-500">
              Each node is a reliable insight. Clicking opens details.
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes jynxGlow {
          0% {
            box-shadow: 0 20px 55px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06),
              0 0 22px ${rgbaBrand(0.12)};
          }
          50% {
            box-shadow: 0 26px 70px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.06),
              0 0 34px ${rgbaBrand(0.16)};
          }
          100% {
            box-shadow: 0 20px 55px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06),
              0 0 22px ${rgbaBrand(0.12)};
          }
        }
      `}</style>
    </div>
  );
}

/* ---------- Page ---------- */

export default function MyTimePage() {
  // mock stats (wire later)
  const [intentionalMinutes] = useState(620);
  const [tasksCompleted] = useState(42);
  const [daysUsed] = useState(6);

  // Left sidebar (collapsible) — match Groups/Schedule pattern
  const [leftOpen, setLeftOpen] = useState(true);

  // UI-only mock signals (wire later)
  const observedSignals = useMemo<string[]>(() => ["task_drift_later", "long_focus_blocks", "frequent_reschedules"], []);

  const [answers, setAnswers] = useState<Answer[]>([]);

  // Insight interactions (REAL actions)
  const [pinnedInsightIds, setPinnedInsightIds] = useState<string[]>([]);
  const [dismissedInsightIds, setDismissedInsightIds] = useState<string[]>([]);
  const [prefs, setPrefs] = useState({ padShortTasks: false });

  // Drawer state
  const [openInsightId, setOpenInsightId] = useState<string | null>(null);

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
      if (q.requiresSignals?.length) return q.requiresSignals.every((s) => observedSignals.includes(s));
      return true;
    });

    return eligible.slice(0, 1);
  }, [answeredIds, tier, observedSignals]);

  const showCheckIn = canShowCheckIn && pendingQuestions.length > 0;

  function answer(questionId: string, value: "yes" | "no" | "skip") {
    setAnswers((prev) => [...prev, { questionId, value, answeredAt: Date.now() }]);
  }

  const stats = useMemo(() => ({ minutes: intentionalMinutes, tasks: tasksCompleted }), [intentionalMinutes, tasksCompleted]);

  // Convert milestones -> insights (reliable only)
  const reliableInsights = useMemo<Insight[]>(() => {
    const unlocked = MILESTONES.filter((m) => isUnlocked(m, stats));

    const base = unlocked.map((m, i) => {
      const confidence = clamp(62 + i * 9 + (stats.minutes % 17), 55, 96);
      const signals =
        m.title === "Morning momentum"
          ? ["morning_completion_rate", "early_day_followthrough"]
          : m.title === "Evening dip"
          ? ["late_day_skip_rate", "post_dinner_energy"]
          : m.title === "Power hour"
          ? ["peak_completion_window", "high_quality_blocks"]
          : ["first_schedule_created", "consistent_use"];

      const details =
        m.title === "Morning momentum"
          ? [
              "You complete planned tasks more often earlier in the day.",
              "Shorter ramp-up time in the morning correlates with higher follow-through.",
              "If you want, Jynx can bias harder tasks earlier.",
            ]
          : m.title === "Evening dip"
          ? [
              "Later tasks are more likely to be skipped or pushed.",
              "Energy tends to fall after dinner.",
              "Consider moving high-effort tasks before 6pm.",
            ]
          : m.title === "Power hour"
          ? [
              "Jynx has enough signal to estimate your most reliable hour.",
              "That window is usually when both completion and pace are strongest.",
              "Use it for deep work or the hardest task of the day.",
            ]
          : [
              "This is a safe first insight — it only appears when Jynx is confident it’s true.",
              "Nothing here is a rating of you — it’s confidence in a pattern.",
            ];

      return {
        id: m.id,
        title: m.title,
        summary: m.descriptionUnlocked,
        kind: m.kind,
        confidencePct: confidence,
        signals,
        appearsWhen: m.appearsWhen,
        details,
        trend: sparkFromSeed(i + stats.minutes, 12),
      };
    });

    return base.filter((x) => !dismissedInsightIds.includes(x.id));
  }, [stats, dismissedInsightIds]);

  const latestInsights = useMemo(() => {
    return [
      {
        id: "li_short_tasks",
        title: "Short tasks run longer",
        body: "Tasks under ~30 minutes often run longer than expected. Want Jynx to pad similar tasks automatically?",
        status: prefs.padShortTasks ? "Enabled" : "Suggestion",
      },
      {
        id: "li_weekly_energy",
        title: "Weekly energy patterns",
        body: "Emerges once routines stabilize across multiple weeks.",
        status: "Emerging",
      },
    ] as const;
  }, [prefs.padShortTasks]);

  const stabilityScorePct = useMemo(() => {
    const total = MILESTONES.filter((m) => m.kind !== "badge").length || 1;
    const unlocked = MILESTONES.filter((m) => m.kind !== "badge" && isUnlocked(m, stats)).length;
    return clamp(Math.round((unlocked / total) * 100), 0, 100);
  }, [stats]);

  const insightById = useMemo(() => {
    const map = new Map<string, Insight>();
    reliableInsights.forEach((x) => map.set(x.id, x));
    return map;
  }, [reliableInsights]);

  const openInsight = insightById.get(openInsightId ?? "") ?? null;

  function openInsightDrawer(id: string) {
    if (!insightById.has(id)) return;
    setOpenInsightId(id);
  }

  function closeDrawer() {
    setOpenInsightId(null);
  }

  function togglePinInsight(id: string) {
    setPinnedInsightIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]));
  }

  function dismissInsight(id: string) {
    setDismissedInsightIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setOpenInsightId((cur) => (cur === id ? null : cur));
  }

  const pinnedReliable = useMemo(() => {
    const pins = pinnedInsightIds.map((id) => insightById.get(id)).filter(Boolean) as Insight[];
    return pins;
  }, [pinnedInsightIds, insightById]);

  // Page background
  return (
    <main className="h-screen bg-white text-neutral-950 overflow-hidden">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${rgbaBrand(0.22)}, rgba(255,255,255,0) 60%)`,
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-15 bg-black/10" />
      </div>

      <div className="relative flex h-full">
        {/* LEFT RAIL (Quick check-in + Latest insights live here now) */}
        <div
          className={cx(
            "h-full border-r bg-white/70 backdrop-blur-sm transition-[width] duration-200",
            leftOpen ? "w-[320px]" : "w-[56px]"
          )}
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="h-full flex flex-col">
            <div className="px-3 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLeftOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  style={surfaceSoftStyle}
                  aria-label="Toggle My Time rail"
                  title="My Time rail"
                >
                  <SlidersHorizontal size={18} />
                </button>

                {leftOpen && (
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">My Time</div>
                    <div className="text-xs text-neutral-500">Check-ins, opt-ins, pins</div>
                  </div>
                )}
              </div>
            </div>

            {leftOpen ? (
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                {/* Quick check-in */}
                <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">Quick check-in (optional)</div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">One question max — only when it helps.</div>
                      </div>
                      <Pill active>{tierLabel(tier)}</Pill>
                    </div>

                    <div className="mt-3">
                      {!showCheckIn ? (
                        <div className="rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                          <div className="text-sm text-neutral-700">Nothing to answer right now.</div>
                          <div className="text-[11px] text-neutral-500 mt-1">Jynx asks occasionally — never like a survey.</div>
                        </div>
                      ) : (
                        pendingQuestions.map((q) => (
                          <div key={q.id} className="rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                            <div className="text-sm font-semibold text-neutral-900">{q.prompt}</div>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => answer(q.id, "yes")}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                style={{
                                  ...surfaceSoftStyle,
                                  borderColor: rgbaBrand(0.18),
                                  boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
                                }}
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => answer(q.id, "no")}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                style={surfaceSoftStyle}
                              >
                                No
                              </button>
                              <button
                                type="button"
                                onClick={() => answer(q.id, "skip")}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition text-neutral-600"
                                style={surfaceSoftStyle}
                              >
                                Skip
                              </button>
                            </div>

                            <div className="mt-2 text-[11px] text-neutral-500">
                              This adjusts defaults (timing/pacing). It’s not a score.
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Latest insights */}
                <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                  <div className="p-4">
                    <div className="text-sm font-semibold text-neutral-900">Insights (latest)</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Small decisions you can opt into.</div>

                    <div className="mt-3 space-y-2">
                      {latestInsights.map((i) => (
                        <div key={i.id} className="rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-neutral-900">{i.title}</div>
                              <div className="text-[11px] text-neutral-500 mt-1 leading-relaxed">{i.body}</div>
                            </div>
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                              style={{
                                borderColor: i.status === "Enabled" ? rgbaBrand(0.22) : "rgba(0,0,0,0.10)",
                                background: i.status === "Enabled" ? rgbaBrand(0.10) : "rgba(0,0,0,0.03)",
                                color: "rgba(0,0,0,0.70)",
                              }}
                            >
                              {i.status}
                            </span>
                          </div>

                          {i.id === "li_short_tasks" ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setPrefs((p) => ({ ...p, padShortTasks: true }))}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                style={{
                                  ...surfaceSoftStyle,
                                  borderColor: rgbaBrand(0.18),
                                  boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
                                }}
                              >
                                Yes, pad similar tasks
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrefs((p) => ({ ...p, padShortTasks: false }))}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                style={surfaceSoftStyle}
                              >
                                Not now
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrefs((p) => ({ ...p, padShortTasks: false }))}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition text-neutral-600"
                                style={surfaceSoftStyle}
                              >
                                Not true for me
                              </button>
                            </div>
                          ) : (
                            <div className="mt-3">
                              <button
                                type="button"
                                onClick={() => setOpenInsightId(reliableInsights[0]?.id ?? null)}
                                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                style={surfaceSoftStyle}
                              >
                                See what unlocks this
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pinned insights (compact in rail) */}
                <div className="rounded-3xl border bg-white" style={surfaceStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-neutral-900">Pinned</div>
                      <span className="text-[11px] text-neutral-500">{pinnedReliable.length}</span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {pinnedReliable.length === 0 ? (
                        <div className="rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                          <div className="text-sm text-neutral-700">Nothing pinned yet.</div>
                          <div className="text-[11px] text-neutral-500 mt-1">Open an insight → Pin.</div>
                        </div>
                      ) : (
                        pinnedReliable.slice(0, 5).map((x) => (
                          <button
                            key={x.id}
                            type="button"
                            onClick={() => openInsightDrawer(x.id)}
                            className="w-full text-left rounded-2xl border bg-white px-3 py-2 hover:bg-black/[0.02] transition"
                            style={surfaceSoftStyle}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-neutral-900 truncate">{x.title}</div>
                                <div className="text-[11px] text-neutral-500 truncate">{x.summary}</div>
                              </div>
                              <Pin size={14} className="text-neutral-400 shrink-0" />
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 px-1">
                  Design rule: no feeds, no noise — just confidence + clarity.
                </div>
              </div>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col h-full">
          {/* Top header row (unified, not “card-y”) */}
          <div className="border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <div className={cx(maxW, "mx-auto px-6 py-4 flex flex-wrap items-center gap-3")}>
              <div className="min-w-0">
                <div className="text-sm font-semibold">My Time</div>
                <div className="text-xs text-neutral-500">
                  Insights only when they’re likely to be true — and everything opens into details.
                </div>
              </div>

              <div className="flex-1" />

              <div className="flex items-center gap-2">
                <Pill active>{tierLabel(tier)}</Pill>
                <Pill>{formatNumber(intentionalMinutes)} min</Pill>
                <Pill>{formatNumber(tasksCompleted)} tasks</Pill>
              </div>
            </div>
          </div>

          {/* Content scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className={cx(maxW, "mx-auto px-6 pt-6 pb-10")}>
              {/* Main “one page” surface */}
              <div
                className="rounded-[28px] border bg-white/70 backdrop-blur-sm"
                style={{
                  borderColor: "rgba(0,0,0,0.08)",
                  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 28px 90px rgba(0,0,0,0.08)",
                }}
              >
                <div className="p-5 lg:p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left: Orb + trends */}
                    <div className="lg:col-span-7 space-y-4">
                      <OrbModule
                        scorePct={stabilityScorePct}
                        nodes={reliableInsights.map((x) => ({ id: x.id, label: x.title, confidencePct: x.confidencePct }))}
                        onOpenInsight={openInsightDrawer}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-3xl border bg-white p-4" style={surfaceStyle}>
                          {/* CHANGED: Focused minutes -> Intentional minutes */}
                          <div className="text-sm font-semibold text-neutral-900">Intentional minutes (trend)</div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">Simple sparkline (wire real data later)</div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="text-3xl font-semibold text-neutral-900">{formatNumber(intentionalMinutes)}</div>
                            <div className="text-neutral-700">
                              <Sparkline points={sparkFromSeed(intentionalMinutes, 14)} />
                            </div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <MiniStat label="Most consistent" value="Morning" />
                            <MiniStat label="Best window" value="10–11 AM" />
                          </div>
                        </div>

                        <SimpleBars
                          title="Consistency by category"
                          bars={[
                            { label: "Study", value: 78 },
                            { label: "Work", value: 64 },
                            { label: "Fitness", value: 58 },
                            { label: "Life", value: 46 },
                          ]}
                        />
                      </div>
                    </div>

                    {/* Right: Reliable list */}
                    <div className="lg:col-span-5 space-y-4">
                      <div className="rounded-3xl border bg-white p-4" style={surfaceStyle}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-neutral-900">What’s now reliable</div>
                            <div className="text-[11px] text-neutral-500 mt-0.5">Click any insight to open details.</div>
                          </div>
                          <Pill active>{reliableInsights.length}</Pill>
                        </div>

                        <div className="mt-3 space-y-2">
                          {reliableInsights.length === 0 ? (
                            <div className="rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                              <div className="text-sm text-neutral-700">Nothing reliable yet.</div>
                              <div className="text-[11px] text-neutral-500 mt-1">
                                As you complete planned tasks, confidence grows and this fills in.
                              </div>
                            </div>
                          ) : (
                            reliableInsights
                              .slice()
                              .sort((a, b) => {
                                const ap = pinnedInsightIds.includes(a.id) ? 1 : 0;
                                const bp = pinnedInsightIds.includes(b.id) ? 1 : 0;
                                if (ap !== bp) return bp - ap;
                                return b.confidencePct - a.confidencePct;
                              })
                              .map((x) => {
                                const meta = kindMeta(x.kind);
                                const isPinned = pinnedInsightIds.includes(x.id);

                                // ✅ FIX: make the row itself the button (no overlay)
                                return (
                                  <button
                                    key={x.id}
                                    type="button"
                                    onClick={() => openInsightDrawer(x.id)}
                                    className="w-full text-left rounded-2xl border bg-white px-3 py-3 hover:bg-black/[0.02] transition"
                                    style={surfaceSoftStyle}
                                    aria-label={`Open ${x.title}`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <div className="text-sm font-semibold text-neutral-900 truncate">{x.title}</div>
                                          {isPinned ? (
                                            <span
                                              className="text-[10px] px-2 py-0.5 rounded-full border font-semibold"
                                              style={{
                                                borderColor: rgbaBrand(0.22),
                                                background: rgbaBrand(0.10),
                                                color: "rgba(0,0,0,0.78)",
                                              }}
                                            >
                                              Pinned
                                            </span>
                                          ) : null}
                                        </div>
                                        <div className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{x.summary}</div>
                                      </div>

                                      <div className="shrink-0 text-right">
                                        <div className="text-[11px] text-neutral-600 font-semibold">
                                          {Math.round(x.confidencePct)}%
                                        </div>
                                        <div className="text-neutral-600 mt-1">
                                          <Sparkline points={x.trend.slice(-10)} />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      <span
                                        className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                                        style={{
                                          borderColor: meta.border,
                                          background: meta.tint,
                                          color: "rgba(0,0,0,0.72)",
                                        }}
                                      >
                                        {meta.label}
                                      </span>

                                      <span className="text-[11px] text-neutral-500 truncate">Appears: {x.appearsWhen}</span>
                                    </div>
                                  </button>
                                );
                              })
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-500">
                        Tip: pins float to the top. Dismiss hides an insight and reduces noise.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Insight Drawer */}
      <Drawer
        open={!!openInsight}
        onClose={closeDrawer}
        title={openInsight?.title ?? "Insight"}
        subtitle={
          openInsight
            ? `${kindMeta(openInsight.kind).label} • ${Math.round(openInsight.confidencePct)}% confidence`
            : undefined
        }
      >
        {openInsight ? (
          <div className="space-y-4">
            <div className="rounded-3xl border bg-white p-4" style={surfaceSoftStyle}>
              <div className="text-sm font-semibold text-neutral-900">Summary</div>
              <div className="mt-1 text-sm text-neutral-700 leading-relaxed">{openInsight.summary}</div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Pill active>{Math.round(openInsight.confidencePct)}% confident</Pill>
                <Pill>{openInsight.signals.length} signals</Pill>
                <Pill>{openInsight.appearsWhen}</Pill>
              </div>

              <div className="mt-3 text-[11px] text-neutral-500">
                This is confidence in a pattern — not a judgment of you.
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-4" style={surfaceSoftStyle}>
              <div className="text-sm font-semibold text-neutral-900">Why Jynx thinks this is true</div>
              <div className="mt-3 space-y-2">
                {openInsight.details.map((d, idx) => (
                  <div key={idx} className="rounded-2xl border bg-white px-3 py-2" style={surfaceSoftStyle}>
                    <div className="text-sm text-neutral-800 leading-relaxed">{d}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-4" style={surfaceSoftStyle}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">Confidence trend</div>
                  <div className="text-[11px] text-neutral-500 mt-0.5">UI-ready, real sparkline.</div>
                </div>
                <div className="text-neutral-700">
                  <Sparkline points={openInsight.trend} />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-4" style={surfaceSoftStyle}>
              <div className="text-sm font-semibold text-neutral-900">Actions</div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => togglePinInsight(openInsight.id)}
                  className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                  style={{
                    ...surfaceSoftStyle,
                    borderColor: pinnedInsightIds.includes(openInsight.id) ? rgbaBrand(0.22) : "rgba(0,0,0,0.10)",
                    boxShadow: pinnedInsightIds.includes(openInsight.id)
                      ? `0 0 0 1px ${rgbaBrand(0.06)}`
                      : surfaceSoftStyle.boxShadow,
                  }}
                >
                  {pinnedInsightIds.includes(openInsight.id) ? "Unpin" : "Pin"}
                </button>

                <button
                  type="button"
                  onClick={() => dismissInsight(openInsight.id)}
                  className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition text-neutral-700"
                  style={surfaceSoftStyle}
                >
                  Dismiss
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAnswers((prev) => [
                      ...prev,
                      { questionId: `insight_${openInsight.id}_not_true`, value: "no", answeredAt: Date.now() },
                    ]);
                    dismissInsight(openInsight.id);
                  }}
                  className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition text-neutral-600"
                  style={surfaceSoftStyle}
                >
                  Not true for me
                </button>
              </div>

              <div className="mt-3 text-[11px] text-neutral-500">
                Pin keeps it on your page. Dismiss hides it. “Not true” helps recalibrate.
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </main>
  );
}
