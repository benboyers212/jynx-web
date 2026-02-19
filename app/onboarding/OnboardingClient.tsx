"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "../ThemeContext";

type MeResponse = {
  ok: boolean;
  userId: string;
  dbUser: {
    id: string;
    clerkUserId: string;
    email: string | null;
    name: string | null;
    onboardingCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

const JYNX_GREEN = "#1F8A5B";

type StructurePref =
  | "strong_structure"
  | "lean_structure"
  | "neutral"
  | "lean_flexibility"
  | "strong_flexibility";

type SleepHours = "5-6" | "6-7" | "7-8" | "8+";
type FreeTimeDesire = "very_little" | "some" | "balanced" | "a_lot";
type Occupation =
  | "student"
  | "working_full_time"
  | "working_part_time"
  | "between_things"
  | "other";
type AgeRange = "under_18" | "18-20" | "21-24" | "25-29" | "30+";

const ADJECTIVES = [
  "Disciplined", "Curious", "Anxious", "Ambitious", "Creative",
  "Social", "Introverted", "Reflective", "Practical", "Spontaneous",
  "Organized", "Overwhelmed", "Optimistic", "Cautious", "Driven",
] as const;

const ACTIVITIES = [
  "Exercise", "Learning", "Creative work", "Social time",
  "Entertainment", "Outdoor time", "Reflection / journaling", "Rest / recovery",
] as const;

const GENRES = [
  "Comedy", "Drama", "Action", "Thriller",
  "Documentary", "Romance", "Sci-fi / Fantasy", "Animation",
] as const;

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_TITLES = [
  "How do you operate?",
  "How would you describe yourself?",
  "What does your time look like?",
  "What do you enjoy?",
  "A bit more about you",
];

const STEP_SUBTITLES = [
  "These help Jynx calibrate how structured and proactive to be with you.",
  "Pick words that fit. This shapes how Jynx frames things for you.",
  "Keeps suggestions realistic and schedules feasible.",
  "Light preferences now — more personalization over time.",
  "Optional details that help Jynx stay relevant.",
];

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";
  const { dark } = useTheme();

  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);

  // Step 0 — behavioral
  const [consistency, setConsistency] = useState(6);
  const [motivation, setMotivation] = useState(6);
  const [openness, setOpenness] = useState(6);
  const [followThroughFriction, setFollowThroughFriction] = useState(6);
  const [structurePreference, setStructurePreference] = useState<StructurePref>("lean_structure");

  // Step 1 — identity
  const [adjectives, setAdjectives] = useState<string[]>([]);

  // Step 2 — time reality
  const [sleepHours, setSleepHours] = useState<SleepHours>("7-8");
  const [freeTimeDesire, setFreeTimeDesire] = useState<FreeTimeDesire>("balanced");
  const [occupation, setOccupation] = useState<Occupation>("student");

  // Step 3 — taste
  const [activities, setActivities] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  // Step 4 — context
  const [ageRange, setAgeRange] = useState<AgeRange>("21-24");
  const [location, setLocation] = useState("");

  const answers = useMemo(() => ({
    v: 1,
    behavioral: { consistency, motivation, opennessToChange: openness, followThroughUnderFriction: followThroughFriction, structurePreference },
    identity: { adjectives },
    timeReality: { sleepHours, freeTimeDesire, occupation },
    taste: { preferredActivities: activities, entertainmentGenres: genres },
    context: { ageRange, location: location.trim() || null },
  }), [consistency, motivation, openness, followThroughFriction, structurePreference, adjectives, sleepHours, freeTimeDesire, occupation, activities, genres, ageRange, location]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch("/api/me");
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        const me = (await res.json()) as MeResponse;
        if (!alive) return;
        setData(me);
        if (me?.dbUser?.onboardingCompleted) router.replace(redirect);
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [router, redirect]);

  const stepError = useMemo(() => {
    if (step === 1 && adjectives.length > 5) return "Choose up to 5 adjectives.";
    if (step === 3) {
      if (activities.length < 3) return "Pick at least 3 activity types.";
      if (activities.length > 5) return "Pick up to 5 activity types.";
      if (genres.length > 3) return "Pick up to 3 genres.";
    }
    return null;
  }, [step, adjectives.length, activities.length, genres.length]);

  function nextStep() {
    if (stepError) return;
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  }

  function prevStep() {
    setErr(null);
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  }

  function toggleWithMax(setList: Dispatch<SetStateAction<string[]>>, value: string, max: number) {
    setErr(null);
    setList((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((x) => x !== value);
      if (prev.length >= max) return prev;
      return [...prev, value];
    });
  }

  function toggleActivity(value: string) {
    setErr(null);
    setActivities((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((x) => x !== value);
      if (prev.length >= 5) return prev;
      return [...prev, value];
    });
  }

  async function submitSurvey() {
    if (stepError) return;
    try {
      setSaving(true);
      setErr(null);
      const res = await fetch("/api/onboarding/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed to save (${res.status})`);
      }
      router.replace(redirect);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  // Theme tokens
  const bg = dark ? "#0f0f0f" : "#f8f9fa";
  const surface = dark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)";
  const fg = dark ? "rgba(240,240,240,0.92)" : "rgba(17,17,17,0.92)";
  const muted = dark ? "rgba(240,240,240,0.45)" : "rgba(0,0,0,0.45)";
  const inputBg = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)";
  const inputBorder = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)";

  return (
    // Full viewport, no scroll
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: bg, color: fg }}>

      {/* Top bar */}
      <div
        className="shrink-0 h-14 px-8 flex items-center border-b"
        style={{
          borderColor: border,
          background: dark ? "rgba(15,15,15,0.96)" : "rgba(255,255,255,0.96)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <img
          src={dark ? "/jynx-logo-dark.png" : "/jynx-logo.png"}
          alt="Jynx"
          className="h-8"
          style={{ objectFit: "contain" }}
        />
        <div className="ml-auto text-xs font-medium" style={{ color: muted }}>
          Step {step + 1} of 5
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 h-[2px] w-full" style={{ background: border }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${((step + 1) / 5) * 100}%`, background: JYNX_GREEN }}
        />
      </div>

      {/* Main content — fills remaining height, never scrolls */}
      <div className="flex-1 min-h-0 flex flex-col px-8 py-6 max-w-5xl w-full mx-auto">
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: muted }}>
            Loading…
          </div>
        ) : err && !data ? (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "rgba(220,38,38,0.85)" }}>
            {err}
          </div>
        ) : (
          <>
            {/* Step header */}
            <div className="shrink-0 mb-5">
              {/* Dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === step ? 18 : 6,
                      height: 6,
                      background: i <= step ? JYNX_GREEN : border,
                      opacity: i < step ? 0.35 : 1,
                    }}
                  />
                ))}
              </div>

              <h1 className="text-xl font-semibold tracking-tight" style={{ color: fg }}>
                {STEP_TITLES[step]}
              </h1>
              <p className="mt-1 text-sm" style={{ color: muted }}>
                {STEP_SUBTITLES[step]}
              </p>
            </div>

            {/* Step body — fills remaining space */}
            <div className="flex-1 min-h-0">

              {/* ── STEP 0 ── two-column: sliders left, structure right */}
              {step === 0 && (
                <div className="h-full grid grid-cols-2 gap-4">
                  {/* Left: sliders */}
                  <div className="flex flex-col gap-3 min-h-0">
                    {[
                      { label: "Consistency", hint: "How consistent are you at following through on plans?", value: consistency, set: setConsistency },
                      { label: "Motivation", hint: "How motivated do you generally feel day to day?", value: motivation, set: setMotivation },
                      { label: "Openness to change", hint: "How open are you to trying new routines or suggestions?", value: openness, set: setOpenness },
                      { label: "Follow-through under friction", hint: "When something feels difficult, how likely are you to still do it?", value: followThroughFriction, set: setFollowThroughFriction },
                    ].map(({ label, hint, value, set }) => (
                      <SliderCard
                        key={label}
                        label={label}
                        hint={hint}
                        value={value}
                        setValue={set}
                        surface={surface}
                        border={border}
                        fg={fg}
                        muted={muted}
                      />
                    ))}
                  </div>

                  {/* Right: structure preference */}
                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="text-sm font-semibold mb-1" style={{ color: fg }}>Structure preference</div>
                    <div className="text-xs mb-4" style={{ color: muted }}>Do you prefer rigid plans or staying flexible?</div>
                    <div className="flex flex-col gap-2 flex-1 justify-evenly">
                      {([
                        ["strong_structure", "Strongly prefer structure"],
                        ["lean_structure", "Lean structure"],
                        ["neutral", "Neutral"],
                        ["lean_flexibility", "Lean flexibility"],
                        ["strong_flexibility", "Strongly prefer flexibility"],
                      ] as [StructurePref, string][]).map(([val, label]) => (
                        <OptionRow
                          key={val}
                          label={label}
                          selected={structurePreference === val}
                          onClick={() => setStructurePreference(val)}
                          border={border}
                          fg={fg}
                          muted={muted}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 1 ── adjectives: wide chip grid */}
              {step === 1 && (
                <div
                  className="h-full rounded-2xl p-6 flex flex-col"
                  style={{ background: surface, border: `1px solid ${border}` }}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div className="text-sm font-semibold" style={{ color: fg }}>Pick up to 5 that fit you</div>
                    <div className="text-xs" style={{ color: muted }}>{adjectives.length} / 5 selected</div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 content-start flex-1">
                    {ADJECTIVES.map((w) => {
                      const active = adjectives.includes(w);
                      const disabled = !active && adjectives.length >= 5;
                      return (
                        <ChipButton
                          key={w}
                          active={active}
                          disabled={disabled}
                          onClick={() => toggleWithMax(setAdjectives, w, 5)}
                          border={border}
                          muted={muted}
                        >
                          {w}
                        </ChipButton>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── STEP 2 ── time reality: 3 side-by-side cards */}
              {step === 2 && (
                <div className="h-full grid grid-cols-3 gap-4">
                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="text-sm font-semibold mb-1" style={{ color: fg }}>Sleep</div>
                    <div className="text-xs mb-4" style={{ color: muted }}>Average hours per night</div>
                    <div className="flex flex-col gap-2 flex-1 justify-evenly">
                      {(["5-6", "6-7", "7-8", "8+"] as SleepHours[]).map((v) => (
                        <OptionRow
                          key={v}
                          label={v === "8+" ? "8+ hours" : `${v} hours`}
                          selected={sleepHours === v}
                          onClick={() => setSleepHours(v)}
                          border={border}
                          fg={fg}
                          muted={muted}
                        />
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="text-sm font-semibold mb-1" style={{ color: fg }}>Free time desire</div>
                    <div className="text-xs mb-4" style={{ color: muted }}>How much unscheduled time do you want?</div>
                    <div className="flex flex-col gap-2 flex-1 justify-evenly">
                      {([
                        ["very_little", "Very little — maximize productivity"],
                        ["some", "Some"],
                        ["balanced", "A healthy balance"],
                        ["a_lot", "A lot — protect my free time"],
                      ] as [FreeTimeDesire, string][]).map(([v, label]) => (
                        <OptionRow
                          key={v}
                          label={label}
                          selected={freeTimeDesire === v}
                          onClick={() => setFreeTimeDesire(v)}
                          border={border}
                          fg={fg}
                          muted={muted}
                        />
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="text-sm font-semibold mb-1" style={{ color: fg }}>Primary occupation</div>
                    <div className="text-xs mb-4" style={{ color: muted }}>What best describes your current situation?</div>
                    <div className="flex flex-col gap-2 flex-1 justify-evenly">
                      {([
                        ["student", "Student"],
                        ["working_full_time", "Working full-time"],
                        ["working_part_time", "Working part-time"],
                        ["between_things", "Between things"],
                        ["other", "Other"],
                      ] as [Occupation, string][]).map(([v, label]) => (
                        <OptionRow
                          key={v}
                          label={label}
                          selected={occupation === v}
                          onClick={() => setOccupation(v)}
                          border={border}
                          fg={fg}
                          muted={muted}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3 ── taste: two columns */}
              {step === 3 && (
                <div className="h-full grid grid-cols-2 gap-4">
                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold" style={{ color: fg }}>Activity types</div>
                      <div className="text-xs" style={{ color: muted }}>{activities.length} selected (3–5)</div>
                    </div>
                    <div className="text-xs mb-4" style={{ color: muted }}>What kinds of activities do you value most?</div>
                    <div className="flex flex-wrap gap-2 content-start flex-1">
                      {ACTIVITIES.map((a) => {
                        const active = activities.includes(a);
                        const disabled = !active && activities.length >= 5;
                        return (
                          <ChipButton
                            key={a}
                            active={active}
                            disabled={disabled}
                            onClick={() => toggleActivity(a)}
                            border={border}
                            muted={muted}
                          >
                            {a}
                          </ChipButton>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm font-semibold" style={{ color: fg }}>Entertainment taste</div>
                      <div className="text-xs" style={{ color: muted }}>{genres.length} / 3 selected</div>
                    </div>
                    <div className="text-xs mb-4" style={{ color: muted }}>What do you watch or read for fun?</div>
                    <div className="flex flex-wrap gap-2 content-start flex-1">
                      {GENRES.map((g) => {
                        const active = genres.includes(g);
                        const disabled = !active && genres.length >= 3;
                        return (
                          <ChipButton
                            key={g}
                            active={active}
                            disabled={disabled}
                            onClick={() => toggleWithMax(setGenres, g, 3)}
                            border={border}
                            muted={muted}
                          >
                            {g}
                          </ChipButton>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 4 ── context: two columns */}
              {step === 4 && (
                <div className="h-full grid grid-cols-2 gap-4">
                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="text-sm font-semibold mb-1" style={{ color: fg }}>Age range</div>
                    <div className="text-xs mb-4" style={{ color: muted }}>Helps tailor suggestions to your life stage.</div>
                    <div className="flex flex-col gap-2 flex-1 justify-evenly">
                      {([
                        ["under_18", "Under 18"],
                        ["18-20", "18–20"],
                        ["21-24", "21–24"],
                        ["25-29", "25–29"],
                        ["30+", "30+"],
                      ] as [AgeRange, string][]).map(([v, label]) => (
                        <OptionRow
                          key={v}
                          label={label}
                          selected={ageRange === v}
                          onClick={() => setAgeRange(v)}
                          border={border}
                          fg={fg}
                          muted={muted}
                        />
                      ))}
                    </div>
                  </div>

                  <div
                    className="rounded-2xl p-5 flex flex-col"
                    style={{ background: surface, border: `1px solid ${border}` }}
                  >
                    <div className="text-sm font-semibold mb-1" style={{ color: fg }}>Location</div>
                    <div className="text-xs mb-4" style={{ color: muted }}>Optional — city or region helps with local context.</div>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City or region…"
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition"
                      style={{
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        color: fg,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="shrink-0 mt-5 flex items-center justify-between">
              <button
                onClick={prevStep}
                disabled={step === 0 || saving}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-30 hover:opacity-75"
                style={{ border: `1px solid ${border}`, background: "transparent", color: fg }}
              >
                Back
              </button>

              <div className="flex items-center gap-4">
                {stepError && (
                  <span className="text-xs" style={{ color: dark ? "rgba(251,191,36,0.85)" : "rgba(146,64,14,0.85)" }}>
                    {stepError}
                  </span>
                )}
                {err && (
                  <span className="text-xs" style={{ color: dark ? "rgba(252,165,165,0.9)" : "rgba(185,28,28,0.9)" }}>
                    {err}
                  </span>
                )}
                <span className="text-xs hidden sm:block" style={{ color: muted }}>
                  You can update these later in Profile.
                </span>

                {step < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={!!stepError || saving}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 hover:opacity-85"
                    style={{ background: JYNX_GREEN, color: "#ffffff" }}
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={submitSurvey}
                    disabled={!!stepError || saving}
                    className="px-6 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-40 hover:opacity-85"
                    style={{ background: JYNX_GREEN, color: "#ffffff" }}
                  >
                    {saving ? "Saving…" : "Finish setup"}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SliderCard({
  label, hint, value, setValue,
  surface, border, fg, muted,
}: {
  label: string; hint: string; value: number; setValue: (n: number) => void;
  surface: string; border: string; fg: string; muted: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col justify-between"
      style={{ background: surface, border: `1px solid ${border}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color: fg }}>{label}</div>
          <div className="text-xs mt-0.5" style={{ color: muted }}>{hint}</div>
        </div>
        <div
          className="shrink-0 rounded-lg px-2.5 py-1 text-sm font-semibold tabular-nums"
          style={{ background: "rgba(31,138,91,0.10)", color: JYNX_GREEN, border: "1px solid rgba(31,138,91,0.20)" }}
        >
          {value}
        </div>
      </div>

      <div className="mt-3">
        <input
          type="range"
          min={1}
          max={10}
          step={1}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="w-full accent-[#1F8A5B]"
        />
        <div className="flex justify-between text-[11px] mt-0.5" style={{ color: muted }}>
          <span>1 — Low</span>
          <span>10 — High</span>
        </div>
      </div>
    </div>
  );
}

function OptionRow({
  label, selected, onClick, border, fg, muted,
}: {
  label: string; selected: boolean; onClick: () => void;
  border: string; fg: string; muted: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-left transition"
      style={{
        border: `1px solid ${selected ? "rgba(31,138,91,0.40)" : border}`,
        background: selected ? "rgba(31,138,91,0.08)" : "transparent",
        color: selected ? JYNX_GREEN : fg,
        fontWeight: selected ? 600 : 400,
      }}
    >
      <span
        className="shrink-0 h-4 w-4 rounded-full border-2 flex items-center justify-center"
        style={{ borderColor: selected ? JYNX_GREEN : muted }}
      >
        {selected && (
          <span className="h-2 w-2 rounded-full" style={{ background: JYNX_GREEN }} />
        )}
      </span>
      {label}
    </button>
  );
}

function ChipButton({
  active, disabled, onClick, border, muted, children,
}: {
  active: boolean; disabled?: boolean; onClick: () => void;
  border: string; muted: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => { if (!disabled) onClick(); }}
      className="rounded-full px-4 py-2 text-sm font-medium transition"
      style={
        active
          ? { border: "1px solid rgba(31,138,91,0.40)", background: "rgba(31,138,91,0.10)", color: JYNX_GREEN }
          : disabled
          ? { border: `1px solid ${border}`, background: "transparent", color: muted, opacity: 0.35, cursor: "not-allowed" }
          : { border: `1px solid ${border}`, background: "transparent", color: muted }
      }
      aria-disabled={disabled ? true : undefined}
    >
      {children}
    </button>
  );
}
