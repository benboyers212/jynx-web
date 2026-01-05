"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

const OLIVE = "#556B2F";

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
  "Disciplined",
  "Curious",
  "Anxious",
  "Ambitious",
  "Creative",
  "Social",
  "Introverted",
  "Reflective",
  "Practical",
  "Spontaneous",
  "Organized",
  "Overwhelmed",
  "Optimistic",
  "Cautious",
  "Driven",
] as const;

const ACTIVITIES = [
  "Exercise",
  "Learning",
  "Creative work",
  "Social time",
  "Entertainment",
  "Outdoor time",
  "Reflection / journaling",
  "Rest / recovery",
] as const;

const GENRES = [
  "Comedy",
  "Drama",
  "Action",
  "Thriller",
  "Documentary",
  "Romance",
  "Sci-fi / Fantasy",
  "Animation",
] as const;

type Step = 0 | 1 | 2 | 3 | 4;

export default function OnboardingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/";

  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [step, setStep] = useState<Step>(0);

  // SECTION 1 — core behavioral self ratings
  const [consistency, setConsistency] = useState(6);
  const [motivation, setMotivation] = useState(6);
  const [openness, setOpenness] = useState(6);
  const [followThroughFriction, setFollowThroughFriction] = useState(6);
  const [structurePreference, setStructurePreference] =
    useState<StructurePref>("lean_structure");

  // SECTION 2 — identity adjectives (max 5)
  const [adjectives, setAdjectives] = useState<string[]>([]);

  // SECTION 3 — time reality + constraints
  const [sleepHours, setSleepHours] = useState<SleepHours>("7-8");
  const [freeTimeDesire, setFreeTimeDesire] =
    useState<FreeTimeDesire>("balanced");
  const [occupation, setOccupation] = useState<Occupation>("student");

  // SECTION 4 — taste anchors
  const [activities, setActivities] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);

  // SECTION 5 — context (optional)
  const [ageRange, setAgeRange] = useState<AgeRange>("21-24");
  const [location, setLocation] = useState("");

  const answers = useMemo(() => {
    return {
      v: 1,
      behavioral: {
        consistency,
        motivation,
        opennessToChange: openness,
        followThroughUnderFriction: followThroughFriction,
        structurePreference,
      },
      identity: {
        adjectives, // max 5 (enforced)
      },
      timeReality: {
        sleepHours, // 5-6 / 6-7 / 7-8 / 8+
        freeTimeDesire,
        occupation,
      },
      taste: {
        preferredActivities: activities, // min 3 max 5 (enforced)
        entertainmentGenres: genres, // max 3 (enforced)
      },
      context: {
        ageRange,
        location: location.trim() || null,
      },
    };
  }, [
    consistency,
    motivation,
    openness,
    followThroughFriction,
    structurePreference,
    adjectives,
    sleepHours,
    freeTimeDesire,
    occupation,
    activities,
    genres,
    ageRange,
    location,
  ]);

  async function loadMe() {
    const res = await fetch("/api/me", { method: "GET" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Failed to load /api/me (${res.status})`);
    }
    return (await res.json()) as MeResponse;
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const me = await loadMe();
        if (!alive) return;

        setData(me);

        // If already done, bounce out
        if (me?.dbUser?.onboardingCompleted) {
          router.replace(redirect);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message ?? "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, redirect]);

  // ----- validation per step -----
  const stepError = useMemo(() => {
    if (step === 1) {
      if (adjectives.length > 5) return "Choose up to 5 adjectives.";
    }
    if (step === 3) {
      if (activities.length < 3) return "Pick at least 3 activity types.";
      if (activities.length > 5) return "Pick up to 5 activity types.";
      if (genres.length > 3) return "Pick up to 3 genres.";
    }
    return null;
  }, [step, adjectives.length, activities.length, genres.length]);

  function canContinue() {
    return !stepError;
  }

  function nextStep() {
    if (!canContinue()) return;
    setStep((s) => (s < 4 ? ((s + 1) as Step) : s));
  }

  function prevStep() {
    setErr(null);
    setStep((s) => (s > 0 ? ((s - 1) as Step) : s));
  }

  // ----- selection helpers with limits -----
  function toggleWithMax(
    setList: Dispatch<SetStateAction<string[]>>,
    value: string,
    max: number
  ) {
    setErr(null);
    setList((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((x) => x !== value);
      if (prev.length >= max) return prev; // block
      return [...prev, value];
    });
  }

  function toggleActivity(value: string) {
    setErr(null);
    setActivities((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((x) => x !== value);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, value];
    });
  }

  async function submitSurvey() {
    if (!canContinue()) return;

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

  const title = useMemo(() => {
    switch (step) {
      case 0:
        return "Core ratings";
      case 1:
        return "Describe yourself";
      case 2:
        return "Time reality";
      case 3:
        return "Taste anchors";
      case 4:
        return "Context";
      default:
        return "Onboarding";
    }
  }, [step]);

  const subtitle = useMemo(() => {
    switch (step) {
      case 0:
        return "These help Jynx calibrate how structured and proactive it should be.";
      case 1:
        return "Pick words that fit you. This is used for tone and framing (not shown back to you).";
      case 2:
        return "This keeps recommendations realistic and schedules feasible.";
      case 3:
        return "Light preferences now — more personalization later.";
      case 4:
        return "Optional details to improve relevance.";
      default:
        return "";
    }
  }, [step]);

  return (
    <main className="bg-neutral-950 text-neutral-100 min-h-screen">
      <div className="max-w-3xl mx-auto p-6">
        <div
          className="rounded-3xl border bg-white/6 p-6"
          style={{
            borderColor: "rgba(85,107,47,0.60)",
            boxShadow:
              "0 0 0 1px rgba(85,107,47,0.40), 0 18px 50px rgba(0,0,0,0.40)",
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-xs font-semibold"
              style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.22)" }}
            >
              ✓
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">Quick setup</h1>
              <p className="text-sm text-neutral-400">
                Establish a few priors — Jynx earns accuracy over time.
              </p>
            </div>

            <div className="ml-auto text-xs text-neutral-400">
              Step {step + 1} / 5
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            {loading ? (
              <div className="text-sm text-neutral-300">Loading…</div>
            ) : err ? (
              <div className="text-sm text-red-300 whitespace-pre-wrap">
                {err}
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-base font-semibold">{title}</div>
                    <div className="text-sm text-neutral-400 mt-1">
                      {subtitle}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {/* STEP 1 */}
                  {step === 0 && (
                    <div className="space-y-4">
                      <SliderField
                        label="Consistency"
                        hint="How consistent are you at following through on plans you make?"
                        value={consistency}
                        setValue={setConsistency}
                      />
                      <SliderField
                        label="Motivation"
                        hint="How motivated do you generally feel day to day?"
                        value={motivation}
                        setValue={setMotivation}
                      />
                      <SliderField
                        label="Openness to change"
                        hint="How open are you to trying new routines, habits, or suggestions?"
                        value={openness}
                        setValue={setOpenness}
                      />
                      <SliderField
                        label="Follow-through under friction"
                        hint="When something feels difficult or inconvenient, how likely are you to still do it?"
                        value={followThroughFriction}
                        setValue={setFollowThroughFriction}
                      />

                      <Field label="Structure preference">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Pill
                            active={structurePreference === "strong_structure"}
                            onClick={() =>
                              setStructurePreference("strong_structure")
                            }
                          >
                            Strongly prefer structure
                          </Pill>
                          <Pill
                            active={structurePreference === "lean_structure"}
                            onClick={() =>
                              setStructurePreference("lean_structure")
                            }
                          >
                            Lean structure
                          </Pill>
                          <Pill
                            active={structurePreference === "neutral"}
                            onClick={() => setStructurePreference("neutral")}
                          >
                            Neutral
                          </Pill>
                          <Pill
                            active={structurePreference === "lean_flexibility"}
                            onClick={() =>
                              setStructurePreference("lean_flexibility")
                            }
                          >
                            Lean flexibility
                          </Pill>
                          <Pill
                            active={structurePreference === "strong_flexibility"}
                            onClick={() =>
                              setStructurePreference("strong_flexibility")
                            }
                          >
                            Strongly prefer flexibility
                          </Pill>
                        </div>
                      </Field>
                    </div>
                  )}

                  {/* STEP 2 */}
                  {step === 1 && (
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">
                          Which words describe you best?
                        </div>
                        <div className="ml-auto text-xs text-neutral-400">
                          {adjectives.length} / 5 selected
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ADJECTIVES.map((w) => {
                          const active = adjectives.includes(w);
                          const disabled = !active && adjectives.length >= 5;
                          return (
                            <Tag
                              key={w}
                              active={active}
                              disabled={disabled}
                              onClick={() =>
                                toggleWithMax(setAdjectives, w, 5)
                              }
                            >
                              {w}
                            </Tag>
                          );
                        })}
                      </div>

                      {adjectives.length >= 5 && (
                        <div className="mt-3 text-xs text-neutral-500">
                          Max 5 selected. Unselect one to choose another.
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 3 */}
                  {step === 2 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Sleep">
                        <select
                          value={sleepHours}
                          onChange={(e) =>
                            setSleepHours(e.target.value as any)
                          }
                          className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-3 text-sm outline-none"
                        >
                          <option value="5-6">5–6</option>
                          <option value="6-7">6–7</option>
                          <option value="7-8">7–8</option>
                          <option value="8+">8+</option>
                        </select>
                      </Field>

                      <Field label="Free time desire">
                        <select
                          value={freeTimeDesire}
                          onChange={(e) =>
                            setFreeTimeDesire(e.target.value as any)
                          }
                          className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-3 text-sm outline-none"
                        >
                          <option value="very_little">
                            Very little (maximize productivity)
                          </option>
                          <option value="some">Some</option>
                          <option value="balanced">A healthy balance</option>
                          <option value="a_lot">A lot (protect my free time)</option>
                        </select>
                      </Field>

                      <div className="sm:col-span-2">
                        <Field label="Primary occupation">
                          <select
                            value={occupation}
                            onChange={(e) =>
                              setOccupation(e.target.value as any)
                            }
                            className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-3 text-sm outline-none"
                          >
                            <option value="student">Student</option>
                            <option value="working_full_time">
                              Working full-time
                            </option>
                            <option value="working_part_time">
                              Working part-time
                            </option>
                            <option value="between_things">Between things</option>
                            <option value="other">Other</option>
                          </select>
                        </Field>
                      </div>
                    </div>
                  )}

                  {/* STEP 4 */}
                  {step === 3 && (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">
                            Preferred activity types
                          </div>
                          <div className="ml-auto text-xs text-neutral-400">
                            {activities.length} selected (pick 3–5)
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {ACTIVITIES.map((a) => {
                            const active = activities.includes(a);
                            const disabled = !active && activities.length >= 5;
                            return (
                              <Tag
                                key={a}
                                active={active}
                                disabled={disabled}
                                onClick={() => toggleActivity(a)}
                              >
                                {a}
                              </Tag>
                            );
                          })}
                        </div>
                        {activities.length < 3 ? (
                          <div className="mt-3 text-xs text-neutral-500">
                            Pick at least 3.
                          </div>
                        ) : activities.length >= 5 ? (
                          <div className="mt-3 text-xs text-neutral-500">
                            Max 5 selected. Unselect one to choose another.
                          </div>
                        ) : null}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">
                            Entertainment taste
                          </div>
                          <div className="ml-auto text-xs text-neutral-400">
                            {genres.length} / 3 selected
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {GENRES.map((g) => {
                            const active = genres.includes(g);
                            const disabled = !active && genres.length >= 3;
                            return (
                              <Tag
                                key={g}
                                active={active}
                                disabled={disabled}
                                onClick={() => toggleWithMax(setGenres, g, 3)}
                              >
                                {g}
                              </Tag>
                            );
                          })}
                        </div>

                        {genres.length >= 3 && (
                          <div className="mt-3 text-xs text-neutral-500">
                            Max 3 selected. Unselect one to choose another.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 5 */}
                  {step === 4 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Age range">
                        <select
                          value={ageRange}
                          onChange={(e) => setAgeRange(e.target.value as any)}
                          className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-3 text-sm outline-none"
                        >
                          <option value="under_18">Under 18</option>
                          <option value="18-20">18–20</option>
                          <option value="21-24">21–24</option>
                          <option value="25-29">25–29</option>
                          <option value="30+">30+</option>
                        </select>
                      </Field>

                      <Field label="Location (city or region)">
                        <input
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="City / region (optional)"
                          className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-3 text-sm outline-none"
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* Step validation message */}
                {stepError && (
                  <div className="mt-5 text-sm text-amber-200 border border-amber-200/20 bg-amber-200/10 rounded-2xl px-4 py-3">
                    {stepError}
                  </div>
                )}

                {/* Footer actions */}
                <div className="mt-6 flex items-center">
                  <button
                    onClick={prevStep}
                    disabled={step === 0 || saving}
                    className="rounded-2xl border border-white/12 bg-transparent hover:bg-white/6 px-4 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    Back
                  </button>

                  <div className="ml-auto flex items-center gap-3">
                    <div className="text-xs text-neutral-500 hidden sm:block">
                      You can update these later in Profile.
                    </div>

                    {step < 4 ? (
                      <button
                        onClick={nextStep}
                        disabled={!canContinue() || saving}
                        className="rounded-2xl border border-white/12 bg-white/12 hover:bg-white/16 px-5 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{
                          boxShadow:
                            "0 0 0 2px rgba(85,107,47,0.35), 0 12px 30px rgba(0,0,0,0.35)",
                        }}
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        onClick={submitSurvey}
                        disabled={!canContinue() || saving}
                        className="rounded-2xl border border-white/12 bg-white/12 hover:bg-white/16 px-5 py-2 text-sm font-semibold disabled:opacity-60"
                        style={{
                          boxShadow:
                            "0 0 0 2px rgba(85,107,47,0.35), 0 12px 30px rgba(0,0,0,0.35)",
                        }}
                      >
                        {saving ? "Submitting…" : "Submit"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Debug */}
                <div className="mt-4 text-[11px] text-neutral-500">
                  Debug: {data?.dbUser?.email ?? "no email"} • redirect →{" "}
                  <span className="text-neutral-300">{redirect}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// ---------- UI helpers ----------
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border px-3 py-2 text-sm font-semibold transition text-left"
      style={
        active
          ? {
              borderColor: "rgba(85,107,47,0.62)",
              backgroundColor: "rgba(85,107,47,0.22)",
              boxShadow: "0 0 0 1px rgba(85,107,47,0.30)",
            }
          : {
              borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.05)",
            }
      }
    >
      {children}
    </button>
  );
}

function Tag({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onClick();
      }}
      className="rounded-full border px-4 py-2 text-sm font-semibold transition"
      style={
        active
          ? {
              borderColor: "rgba(85,107,47,0.62)",
              backgroundColor: "rgba(85,107,47,0.22)",
              boxShadow: "0 0 0 1px rgba(85,107,47,0.30)",
              opacity: 1,
            }
          : disabled
          ? {
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: "rgba(255,255,255,0.03)",
              opacity: 0.45,
              cursor: "not-allowed",
            }
          : {
              borderColor: "rgba(255,255,255,0.12)",
              backgroundColor: "rgba(255,255,255,0.05)",
              opacity: 1,
            }
      }
      aria-disabled={disabled ? true : undefined}
    >
      {children}
    </button>
  );
}

function SliderField({
  label,
  hint,
  value,
  setValue,
}: {
  label: string;
  hint: string;
  value: number;
  setValue: (n: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">{label}</div>
          <div className="text-xs text-neutral-400 mt-1">{hint}</div>
        </div>
        <div
          className="shrink-0 rounded-xl border border-white/12 bg-white/6 px-3 py-1 text-sm font-semibold"
          style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.18)" }}
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
          className="w-full"
        />
        <div className="mt-2 flex justify-between text-[11px] text-neutral-500">
          <span>1</span>
          <span>10</span>
        </div>
      </div>
    </div>
  );
}
