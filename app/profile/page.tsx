"use client";

import React, { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import AccountPanel from "./AccountPanel";
import { useTheme } from "../ThemeContext";

const OLIVE = "#556B2F";

type TopTab = "preferences" | "settings";
type PrefSection = "medication" | "reminders" | "health" | "study" | "scheduling" | "survey";
type SettingsSection = "account" | "privacy" | "notifications" | "appearance";

type MedRecurrence = "Daily" | "Weekdays" | "Custom";

type Medication = {
  id: string;
  name: string;
  dosage: string;
  recurrence: MedRecurrence;
  times?: string | null;
  pharmacy?: string | null;
  qty?: number | null;
  refills?: number | null;
  notes?: string | null;
};

type ReminderSchedule = "once" | "daily" | "weekdays" | "custom";

type Reminder = {
  id: string;
  title: string;
  notes: string | null;
  enabled: boolean;
  schedule: ReminderSchedule;
  timeOfDay: string | null; // stored as "HH:MM" (24h)
  daysOfWeek: string | null; // stored as JSON string e.g. "[1,2,3]"
  date: string | null; // "YYYY-MM-DD" (for once, optional otherwise)
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}
function toNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) && v.trim() !== "" ? n : undefined;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function to24hTime(hour: number, minute: number, ampm: "AM" | "PM") {
  let h = hour % 12;
  if (ampm === "PM") h += 12;
  return `${pad2(h)}:${pad2(minute)}`; // "HH:MM"
}

function formatTime12(time: string | null | undefined) {
  if (!time) return "—";
  const [hhS, mmS] = time.split(":");
  const hh = Number(hhS);
  const mm = Number(mmS);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return time;
  const ampm: "AM" | "PM" = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${pad2(mm)} ${ampm}`;
}

const DOW: Array<{ n: number; label: string }> = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 7, label: "Sun" },
];

function parseDays(daysOfWeek: string | null): number[] {
  if (!daysOfWeek) return [];
  try {
    const v = JSON.parse(daysOfWeek);
    return Array.isArray(v)
      ? v.filter((x) => Number.isFinite(Number(x))).map((x) => Number(x))
      : [];
  } catch {
    return [];
  }
}

function formatDays(days: number[]) {
  if (!days.length) return "—";
  const map = new Map(DOW.map((d) => [d.n, d.label]));
  return days
    .slice()
    .sort((a, b) => a - b)
    .map((n) => map.get(n) || String(n))
    .join(", ");
}

/** Light brand accent (matches My Time) */
const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
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

const brandSoftStyle: CSSProperties = {
  borderColor: rgbaBrand(0.22),
  boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
};

export default function ProfilePage() {
  const { dark } = useTheme();
  const { user: clerkUser } = useUser();

  // === style tokens aligned to your NEW shell ===
  const surfaceStyle = getSurfaceStyle(dark);
  const surfaceSoftStyle = getSurfaceSoftStyle(dark);
  const panelBase = "rounded-3xl border";
  const panelInner = "rounded-2xl border";
  const buttonBase =
    "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  // ✅ Progressive disclosure state:
  const [topTab, setTopTab] = useState<TopTab | null>(null);
  const [prefSection, setPrefSection] = useState<PrefSection | null>(null);
  const [settingsSection, setSettingsSection] =
    useState<SettingsSection | null>(null);

  const stage = useMemo(() => {
    if (!topTab) return 1;
    if (topTab === "preferences" && prefSection) return 3;
    if (topTab === "settings" && settingsSection) return 3;
    return 2;
  }, [topTab, prefSection, settingsSection]);

  function goStage1() {
    setTopTab(null);
    setPrefSection(null);
    setSettingsSection(null);
  }

  function chooseTop(tab: TopTab) {
    setTopTab(tab);
    setPrefSection(null);
    setSettingsSection(null);
  }

  function choosePref(sec: PrefSection) {
    setPrefSection(sec);
    setSettingsSection(null);
  }

  function chooseSettings(sec: SettingsSection) {
    setSettingsSection(sec);
    setPrefSection(null);
  }

  const userInitial =
    clerkUser?.firstName?.[0]?.toUpperCase() ??
    clerkUser?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ??
    "?";

  // =========================
  // ✅ Medication DB wiring
  // =========================
  const [meds, setMeds] = useState<Medication[]>([]);
  const [medsLoading, setMedsLoading] = useState(false);
  const [medsError, setMedsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadMeds() {
    setMedsError(null);
    setMedsLoading(true);
    try {
      const res = await fetch("/api/medications", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load meds");
      }
      setMeds(Array.isArray(data.meds) ? data.meds : []);
    } catch (e: any) {
      setMedsError(e?.message || "Failed to load meds");
    } finally {
      setMedsLoading(false);
    }
  }

  // only load meds when user opens Preferences -> Medication
  useEffect(() => {
    const isMedScreen = topTab === "preferences" && prefSection === "medication";
    if (isMedScreen) loadMeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTab, prefSection]);

  async function createMed(payload: Omit<Medication, "id">) {
    setSaving(true);
    setMedsError(null);
    try {
      const res = await fetch("/api/medications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to create med");
      }
      await loadMeds();
    } catch (e: any) {
      setMedsError(e?.message || "Failed to create med");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMed(id: string) {
    const prev = meds;
    setMeds((m) => m.filter((x) => x.id !== id));
    setMedsError(null);

    try {
      const res = await fetch(`/api/medications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to delete med");
      }
    } catch (e: any) {
      setMeds(prev);
      setMedsError(e?.message || "Failed to delete med");
    }
  }

  // Medication form state
  const [mName, setMName] = useState("");
  const [mDosage, setMDosage] = useState("");
  const [mRecurrence, setMRecurrence] = useState<MedRecurrence>("Daily");
  const [mTimes, setMTimes] = useState("");
  const [mPharmacy, setMPharmacy] = useState("");
  const [mQty, setMQty] = useState<string>("");
  const [mRefills, setMRefills] = useState<string>("");
  const [mNotes, setMNotes] = useState("");

  async function addMedication() {
    const name = mName.trim();
    if (!name) return;

    const payload = {
      name,
      dosage: mDosage.trim() || "—",
      recurrence: mRecurrence,
      times: mTimes.trim() || undefined,
      pharmacy: mPharmacy.trim() || undefined,
      qty: toNum(mQty),
      refills: toNum(mRefills),
      notes: mNotes.trim() || undefined,
    };

    await createMed(payload);

    setMName("");
    setMDosage("");
    setMRecurrence("Daily");
    setMTimes("");
    setMPharmacy("");
    setMQty("");
    setMRefills("");
    setMNotes("");
  }

  function removeMedication(id: string) {
    deleteMed(id);
  }

  // =========================
  // ✅ Reminders DB wiring
  // =========================
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remLoading, setRemLoading] = useState(false);
  const [remError, setRemError] = useState<string | null>(null);
  const [remSaving, setRemSaving] = useState(false);

  // Create form state (full)
  const [rTitle, setRTitle] = useState("");
  const [rNotes, setRNotes] = useState("");
  const [rSchedule, setRSchedule] = useState<ReminderSchedule>("daily");

  const [rDate, setRDate] = useState(""); // "YYYY-MM-DD" required when once
  const [rLocation, setRLocation] = useState("");

  const [rHour, setRHour] = useState(8); // 1..12
  const [rMinute, setRMinute] = useState(0); // 0..59
  const [rAmPm, setRAmPm] = useState<"AM" | "PM">("AM");

  const [rDays, setRDays] = useState<number[]>([1, 2, 3, 4, 5]); // for custom

  useEffect(() => {
    if (rSchedule === "weekdays") setRDays([1, 2, 3, 4, 5]);
    if (rSchedule === "daily") setRDays([]);
    if (rSchedule === "once") setRDays([]);
  }, [rSchedule]);

  async function loadReminders() {
    setRemError(null);
    setRemLoading(true);
    try {
      const res = await fetch("/api/reminders", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to load reminders");
      }
      setReminders(Array.isArray(data.reminders) ? data.reminders : []);
    } catch (e: any) {
      setRemError(e?.message || "Failed to load reminders");
    } finally {
      setRemLoading(false);
    }
  }

  // only load reminders when user opens Preferences -> Reminders
  useEffect(() => {
    const isRemScreen = topTab === "preferences" && prefSection === "reminders";
    if (isRemScreen) loadReminders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topTab, prefSection]);

  async function createReminder() {
    const title = rTitle.trim();
    if (!title) return;

    if (rSchedule === "once" && !rDate) {
      setRemError("Date is required for one-time reminders.");
      return;
    }

    const timeOfDay = to24hTime(rHour, rMinute, rAmPm);

    let daysOfWeek: number[] | null = null;
    if (rSchedule === "weekdays") daysOfWeek = [1, 2, 3, 4, 5];
    if (rSchedule === "custom") {
      if (rDays.length === 0) {
        setRemError("Pick at least one day for Custom recurrence.");
        return;
      }
      daysOfWeek = rDays.slice().sort((a, b) => a - b);
    }

    setRemSaving(true);
    setRemError(null);

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          notes: rNotes.trim() ? rNotes.trim() : null,
          schedule: rSchedule,
          timeOfDay,
          daysOfWeek,
          date: rDate ? rDate : null,
          location: rLocation.trim() ? rLocation.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to create reminder");
      }

      await loadReminders();

      setRTitle("");
      setRNotes("");
      setRSchedule("daily");
      setRDate("");
      setRLocation("");
      setRHour(8);
      setRMinute(0);
      setRAmPm("AM");
      setRDays([1, 2, 3, 4, 5]);
    } catch (e: any) {
      setRemError(e?.message || "Failed to create reminder");
    } finally {
      setRemSaving(false);
    }
  }

  async function toggleReminder(id: string, enabled: boolean) {
    setRemError(null);

    const prev = reminders;
    setReminders((xs) => xs.map((r) => (r.id === id ? { ...r, enabled } : r)));

    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to update reminder");
      }
      await loadReminders();
    } catch (e: any) {
      setReminders(prev);
      setRemError(e?.message || "Failed to update reminder");
    }
  }

  async function deleteReminder(id: string) {
    setRemError(null);

    const prev = reminders;
    setReminders((xs) => xs.filter((r) => r.id !== id));

    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "Failed to delete reminder");
      }
    } catch (e: any) {
      setReminders(prev);
      setRemError(e?.message || "Failed to delete reminder");
    }
  }

  // =========================
  // Survey responses
  // =========================
  const [surveyAnswers, setSurveyAnswers] = useState<any>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  useEffect(() => {
    if (topTab === "preferences" && prefSection === "survey") {
      setSurveyError(null);
      setSurveyLoading(true);
      fetch("/api/onboarding/response")
        .then((r) => r.json())
        .then((data) => {
          if (data?.ok) setSurveyAnswers(data.answers ?? {});
          else setSurveyError(data?.error ?? "Failed to load");
        })
        .catch((e) => setSurveyError(e?.message ?? "Failed to load"))
        .finally(() => setSurveyLoading(false));
    }
  }, [topTab, prefSection]);

  const crumbs = useMemo(() => {
    const out: Array<{ label: string; onClick: () => void }> = [
      { label: "Profile", onClick: goStage1 },
    ];

    if (!topTab) return out;

    out.push({
      label: topTab === "preferences" ? "Preferences" : "Settings",
      onClick: () => {
        if (topTab === "preferences") setPrefSection(null);
        else setSettingsSection(null);
      },
    });

    if (topTab === "preferences" && prefSection) {
      out.push({ label: prettyPref(prefSection), onClick: () => {} });
    }

    if (topTab === "settings" && settingsSection) {
      out.push({ label: prettySettings(settingsSection), onClick: () => {} });
    }

    return out;
  }, [topTab, prefSection, settingsSection]);

  const gridCols =
    stage === 1
      ? "grid-cols-1"
      : stage === 2
      ? "grid-cols-1 lg:grid-cols-12"
      : "grid-cols-1 lg:grid-cols-12";

  const col1Span =
    stage === 1 ? "lg:col-span-12" : stage === 2 ? "lg:col-span-4" : "lg:col-span-3";

  const col2Span = stage === 2 ? "lg:col-span-8" : "lg:col-span-3";
  const col3Span = "lg:col-span-6";

  const sectionCardStyle: CSSProperties = surfaceStyle;
  const innerCardStyle: CSSProperties = surfaceSoftStyle;
  const activeChipStyle: CSSProperties = brandSoftStyle;

  return (
    <main className="h-screen overflow-hidden min-h-0" style={{ background: dark ? "var(--background)" : "white", color: dark ? "var(--foreground)" : "rgba(0,0,0,0.95)" }}>
      {/* Ambient background */}
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

      {/* Header */}
      <div
        className="border-b bg-white/80 backdrop-blur shrink-0"
        style={{ borderColor: "rgba(0,0,0,0.08)" }}
      >
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-start gap-3">
          <div
            className="h-11 w-11 rounded-2xl border bg-white flex items-center justify-center text-sm font-semibold shrink-0"
            style={surfaceSoftStyle}
          >
            {userInitial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Profile</div>
            <div className="mt-0.5 text-xs text-neutral-500">
              Preferences, settings, reminders & privacy.
            </div>

            {/* Breadcrumbs */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
              {crumbs.map((c, idx) => (
                <span key={c.label} className="flex items-center gap-2">
                  <button
                    onClick={c.onClick}
                    className={cx(
                      "font-semibold",
                      idx === crumbs.length - 1
                        ? "text-neutral-900 cursor-default"
                        : "text-neutral-700 hover:text-neutral-900"
                    )}
                    disabled={idx === crumbs.length - 1}
                    title={idx === crumbs.length - 1 ? undefined : "Back"}
                  >
                    {c.label}
                  </button>
                  {idx !== crumbs.length - 1 ? (
                    <span className="text-neutral-400">›</span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Body */}
      <div className="h-[calc(100vh-72px)] overflow-y-auto">
        <div className="w-full max-w-[1200px] 2xl:max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24">
          <div className={cx("grid gap-4", gridCols)}>
            {/* Column 1 */}
            <aside className={cx(col1Span, "space-y-4")}>
              <div className={panelBase} style={{ ...sectionCardStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-4">
                  <div className="text-xs font-semibold text-neutral-700">Tabs</div>

                  <div className="mt-3 space-y-2">
                    <TopButton
                      active={topTab === "preferences"}
                      label="Preferences"
                      sub="Things Jynx learns + uses"
                      onClick={() => chooseTop("preferences")}
                      activeStyle={activeChipStyle}
                    />

                    <TopButton
                      active={topTab === "settings"}
                      label="Settings"
                      sub="Account, privacy, app"
                      onClick={() => chooseTop("settings")}
                      activeStyle={activeChipStyle}
                    />
                  </div>

                  <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={innerCardStyle}>
                    <div className="text-[11px] text-neutral-500">
                      Click a tab to open the next menu.
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Column 2 */}
            {stage >= 2 && (
              <aside className={cx(col2Span, "space-y-4")}>
                <div className={panelBase} style={{ ...sectionCardStyle, background: dark ? "var(--surface)" : "white" }}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-neutral-700">
                        {topTab === "preferences" ? "Preferences" : "Settings"}
                      </div>

                      <button
                        onClick={goStage1}
                        className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                        style={surfaceSoftStyle}
                        title="Back"
                      >
                        ← Back
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {topTab === "preferences" ? (
                        <>
                          <SubButton
                            active={prefSection === "medication"}
                            label="Medication"
                            sub="Reminders + refill/pickup logic"
                            onClick={() => choosePref("medication")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={prefSection === "reminders"}
                            label="Reminders"
                            sub="Recurring tasks & nudges"
                            onClick={() => choosePref("reminders")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={prefSection === "health"}
                            label="Health"
                            sub="Injuries, allergies, basics"
                            onClick={() => choosePref("health")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={prefSection === "study"}
                            label="Study"
                            sub="Class load, exam windows"
                            onClick={() => choosePref("study")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={prefSection === "scheduling"}
                            label="Scheduling"
                            sub="Deep work rules, focus style"
                            onClick={() => choosePref("scheduling")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={prefSection === "survey"}
                            label="Initial Survey"
                            sub="Your onboarding responses"
                            onClick={() => choosePref("survey")}
                            activeStyle={activeChipStyle}
                          />
                        </>
                      ) : (
                        <>
                          <SubButton
                            active={settingsSection === "account"}
                            label="Account"
                            sub="Profile + sign-in"
                            onClick={() => chooseSettings("account")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={settingsSection === "privacy"}
                            label="Privacy"
                            sub="Data controls + sharing"
                            onClick={() => chooseSettings("privacy")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={settingsSection === "notifications"}
                            label="Notifications"
                            sub="Push, email, SMS"
                            onClick={() => chooseSettings("notifications")}
                            activeStyle={activeChipStyle}
                          />
                          <SubButton
                            active={settingsSection === "appearance"}
                            label="Appearance"
                            sub="Theme + density"
                            onClick={() => chooseSettings("appearance")}
                            activeStyle={activeChipStyle}
                          />
                        </>
                      )}
                    </div>

                    {stage === 2 && (
                      <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={innerCardStyle}>
                        <div className="text-[11px] text-neutral-500">
                          Now pick a section to open details.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}

            {/* Column 3 */}
            {stage === 3 && (
              <section className={cx(col3Span, "space-y-4")}>
                {topTab === "preferences" && prefSection === "medication" && (
                  <div className={panelBase} style={{ ...sectionCardStyle, background: dark ? "var(--surface)" : "white" }}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">Medication</div>
                        <div className="ml-auto text-[11px] text-neutral-500">
                          reminders + refill/pickup logic
                        </div>
                      </div>

                      <div className="mt-1 text-xs text-neutral-500">
                        Store meds so Jynx can remind you to take them, track refills, and prompt pickups.
                      </div>

                      <div className="mt-3 text-[11px] text-neutral-500 flex items-center gap-3">
                        {medsLoading ? <span>Loading…</span> : <span>Loaded</span>}
                        {medsError ? <span className="text-red-600">{medsError}</span> : null}
                        <button
                          className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                          style={surfaceSoftStyle}
                          onClick={loadMeds}
                          disabled={medsLoading}
                          title="Refresh"
                        >
                          Refresh
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {meds.length === 0 && !medsLoading ? (
                          <div className="text-xs text-neutral-500">No medications yet.</div>
                        ) : null}

                        {meds.map((m) => (
                          <div key={m.id} className={cx(panelInner, "px-3 py-3")} style={{ ...innerCardStyle, background: dark ? "rgba(255,255,255,0.04)" : "white" }}>
                            <div className="flex items-start gap-3">
                              <div
                                className="h-10 w-10 rounded-2xl border bg-white flex items-center justify-center text-[11px] font-semibold shrink-0"
                                style={brandSoftStyle}
                              >
                                Rx
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-sm font-semibold text-neutral-900">{m.name}</div>
                                  <Pill style={brandSoftStyle}>{m.dosage}</Pill>
                                  <Pill style={surfaceSoftStyle}>{m.recurrence}</Pill>
                                </div>

                                <div className="mt-1 text-xs text-neutral-600">
                                  {m.times ? `Times: ${m.times}` : "Times: —"} •{" "}
                                  {m.pharmacy ? `Pharmacy: ${m.pharmacy}` : "Pharmacy: —"} • Qty:{" "}
                                  {m.qty ?? "—"} • Refills: {m.refills ?? "—"}
                                </div>

                                {m.notes ? (
                                  <div className="mt-1 text-xs text-neutral-700">{m.notes}</div>
                                ) : null}
                              </div>

                              <div className="flex flex-col gap-2">
                                <button
                                  className={cx(buttonBase, "bg-white hover:bg-black/[0.03]")}
                                  style={brandSoftStyle}
                                  onClick={() => { choosePref("reminders"); }}
                                >
                                  Remind
                                </button>

                                <button
                                  className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                                  style={surfaceSoftStyle}
                                  onClick={() => removeMedication(m.id)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-3xl border bg-white" style={surfaceSoftStyle}>
                        <div className="p-4">
                          <div className="text-sm font-semibold">Add medication</div>

                          <div className="mt-3 space-y-3">
                            <Field label="Name">
                              <input
                                value={mName}
                                onChange={(e) => setMName(e.target.value)}
                                placeholder="e.g., Lamotrigine"
                                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                style={{ borderColor: "rgba(0,0,0,0.10)" }}
                              />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="Dosage">
                                <input
                                  value={mDosage}
                                  onChange={(e) => setMDosage(e.target.value)}
                                  placeholder="e.g., 150mg"
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              </Field>

                              <Field label="Recurrence">
                                <select
                                  value={mRecurrence}
                                  onChange={(e) => setMRecurrence(e.target.value as MedRecurrence)}
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                  <option>Daily</option>
                                  <option>Weekdays</option>
                                  <option>Custom</option>
                                </select>
                              </Field>
                            </div>

                            <Field label="Times (optional)">
                              <input
                                value={mTimes}
                                onChange={(e) => setMTimes(e.target.value)}
                                placeholder="e.g., 8:00 AM, 10:00 PM"
                                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                style={{ borderColor: "rgba(0,0,0,0.10)" }}
                              />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Field label="Pharmacy (optional)">
                                <input
                                  value={mPharmacy}
                                  onChange={(e) => setMPharmacy(e.target.value)}
                                  placeholder="e.g., CVS"
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              </Field>

                              <Field label="Qty">
                                <input
                                  value={mQty}
                                  onChange={(e) => setMQty(e.target.value)}
                                  placeholder="0"
                                  inputMode="numeric"
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              </Field>

                              <Field label="Refills">
                                <input
                                  value={mRefills}
                                  onChange={(e) => setMRefills(e.target.value)}
                                  placeholder="0"
                                  inputMode="numeric"
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              </Field>
                            </div>

                            <Field label="Notes (optional)">
                              <input
                                value={mNotes}
                                onChange={(e) => setMNotes(e.target.value)}
                                placeholder="e.g., take with food"
                                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                style={{ borderColor: "rgba(0,0,0,0.10)" }}
                              />
                            </Field>

                            <div className="flex items-center justify-between">
                              <button
                                className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                                style={surfaceSoftStyle}
                                onClick={() => { choosePref("reminders"); }}
                              >
                                Reminders
                              </button>

                              <button
                                className={cx(buttonBase, "bg-white hover:bg-black/[0.03]")}
                                style={brandSoftStyle}
                                onClick={addMedication}
                                disabled={saving || !mName.trim()}
                                title={!mName.trim() ? "Enter a name first" : saving ? "Saving…" : "Save"}
                              >
                                {saving ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 text-[11px] text-neutral-500 flex items-center justify-between">
                            <span>Now connected to DB via /api/medications.</span>
                            <span style={{ color: rgbaBrand(0.9) }}>Jynx learns quietly</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ Reminders (full UI) */}
                {topTab === "preferences" && prefSection === "reminders" && (
                  <div className={panelBase} style={{ ...sectionCardStyle, background: dark ? "var(--surface)" : "white" }}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">Reminders</div>
                        <div className="ml-auto text-[11px] text-neutral-500">recurring tasks & nudges</div>
                      </div>

                      <div className="mt-1 text-xs text-neutral-500">
                        Date, time (AM/PM), recurrence, location — plus Custom day picking.
                      </div>

                      <div className="mt-3 text-[11px] text-neutral-500 flex items-center gap-3">
                        {remLoading ? <span>Loading…</span> : <span>Loaded</span>}
                        {remError ? <span className="text-red-600">{remError}</span> : null}
                        <button
                          className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                          style={surfaceSoftStyle}
                          onClick={loadReminders}
                          disabled={remLoading}
                          title="Refresh"
                        >
                          Refresh
                        </button>
                      </div>

                      <div className="mt-4 rounded-3xl border bg-white" style={surfaceSoftStyle}>
                        <div className="p-4">
                          <div className="text-sm font-semibold">New reminder</div>

                          <div className="mt-3 space-y-3">
                            <Field label="Title">
                              <input
                                value={rTitle}
                                onChange={(e) => setRTitle(e.target.value)}
                                placeholder="e.g., Pay rent, Stretch, Call mom"
                                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                style={{ borderColor: "rgba(0,0,0,0.10)" }}
                              />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <Field label="Recurrence">
                                <select
                                  value={rSchedule}
                                  onChange={(e) => setRSchedule(e.target.value as ReminderSchedule)}
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekdays">Weekdays</option>
                                  <option value="custom">Custom</option>
                                  <option value="once">Once</option>
                                </select>
                              </Field>

                              <Field label="Location">
                                <input
                                  value={rLocation}
                                  onChange={(e) => setRLocation(e.target.value)}
                                  placeholder="e.g., Library, Gym, Home"
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              </Field>
                            </div>

                            {rSchedule === "once" ? (
                              <Field label="Date">
                                <input
                                  type="date"
                                  value={rDate}
                                  onChange={(e) => setRDate(e.target.value)}
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                />
                              </Field>
                            ) : null}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <Field label="Hour">
                                <select
                                  value={rHour}
                                  onChange={(e) => setRHour(Number(e.target.value))}
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                    <option key={h} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </Field>

                              <Field label="Minute">
                                <select
                                  value={rMinute}
                                  onChange={(e) => setRMinute(Number(e.target.value))}
                                  className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                                  style={{ borderColor: "rgba(0,0,0,0.10)" }}
                                >
                                  {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                                    <option key={m} value={m}>
                                      {pad2(m)}
                                    </option>
                                  ))}
                                </select>
                              </Field>

                              <Field label="AM / PM">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setRAmPm("AM")}
                                    className="flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition bg-white hover:bg-black/[0.03]"
                                    style={rAmPm === "AM" ? brandSoftStyle : surfaceSoftStyle}
                                  >
                                    AM
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRAmPm("PM")}
                                    className="flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition bg-white hover:bg-black/[0.03]"
                                    style={rAmPm === "PM" ? brandSoftStyle : surfaceSoftStyle}
                                  >
                                    PM
                                  </button>
                                </div>
                              </Field>
                            </div>

                            {rSchedule === "custom" ? (
                              <div>
                                <div className="text-[11px] text-neutral-500">Days of week</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {DOW.map((d) => {
                                    const on = rDays.includes(d.n);
                                    return (
                                      <button
                                        key={d.n}
                                        type="button"
                                        onClick={() => {
                                          setRDays((prev) =>
                                            prev.includes(d.n)
                                              ? prev.filter((x) => x !== d.n)
                                              : [...prev, d.n]
                                          );
                                        }}
                                        className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition bg-white hover:bg-black/[0.03]"
                                        style={on ? brandSoftStyle : surfaceSoftStyle}
                                      >
                                        {d.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}

                            <Field label="Notes (optional)">
                              <input
                                value={rNotes}
                                onChange={(e) => setRNotes(e.target.value)}
                                placeholder="e.g., do it before 11am"
                                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-black/[0.06]"
                                style={{ borderColor: "rgba(0,0,0,0.10)" }}
                              />
                            </Field>

                            <div className="flex items-center justify-end">
                              <button
                                className={cx(buttonBase, "bg-white hover:bg-black/[0.03]")}
                                style={brandSoftStyle}
                                onClick={createReminder}
                                disabled={remSaving || !rTitle.trim()}
                                title={!rTitle.trim() ? "Enter a title first" : remSaving ? "Saving…" : "Save"}
                              >
                                {remSaving ? "Saving…" : "Save"}
                              </button>
                            </div>
                          </div>

                          <div className="mt-4 text-[11px] text-neutral-500 flex items-center justify-between">
                            <span>Now connected to DB via /api/reminders.</span>
                            <span style={{ color: rgbaBrand(0.9) }}>Jynx nudges quietly</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {reminders.length === 0 && !remLoading ? (
                          <div className="text-xs text-neutral-500">No reminders yet.</div>
                        ) : null}

                        {reminders.map((r) => {
                          const days = parseDays(r.daysOfWeek);
                          const dayLabel =
                            r.schedule === "daily"
                              ? "Every day"
                              : r.schedule === "weekdays"
                              ? "Mon–Fri"
                              : r.schedule === "custom"
                              ? formatDays(days)
                              : r.date
                              ? r.date
                              : "—";

                          return (
                            <div key={r.id} className={cx("rounded-2xl border bg-white px-3 py-3")} style={innerCardStyle}>
                              <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-2xl border bg-white flex items-center justify-center text-[11px] font-semibold shrink-0" style={brandSoftStyle}>
                                  ⏰
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <div className={cx("text-sm font-semibold", r.enabled ? "text-neutral-900" : "text-neutral-400 line-through")}>
                                      {r.title}
                                    </div>
                                    <Pill style={surfaceSoftStyle}>{r.schedule}</Pill>
                                    <Pill style={surfaceSoftStyle}>{formatTime12(r.timeOfDay)}</Pill>
                                    {r.location ? <Pill style={surfaceSoftStyle}>{r.location}</Pill> : null}
                                    <Pill style={surfaceSoftStyle}>{dayLabel}</Pill>
                                    <Pill style={r.enabled ? brandSoftStyle : surfaceSoftStyle}>{r.enabled ? "On" : "Off"}</Pill>
                                  </div>

                                  <div className="mt-1 text-xs text-neutral-600">{r.notes ? r.notes : "Notes: —"}</div>
                                </div>

                                <div className="flex flex-col gap-2 items-end">
                                  <label className="text-[11px] text-neutral-700 flex items-center gap-2 select-none">
                                    <input
                                      type="checkbox"
                                      checked={r.enabled}
                                      onChange={(e) => toggleReminder(r.id, e.target.checked)}
                                    />
                                    Enabled
                                  </label>

                                  <button
                                    className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                                    style={surfaceSoftStyle}
                                    onClick={() => deleteReminder(r.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {topTab === "preferences" && prefSection === "survey" && (
                  <div className={panelBase} style={{ ...sectionCardStyle, background: dark ? "var(--surface)" : "white" }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Initial Survey</div>
                          <div className="mt-0.5 text-xs text-neutral-500">Your onboarding responses — used by Jynx as a starting context.</div>
                        </div>
                      </div>

                      {surveyLoading && (
                        <div className="mt-4 text-xs text-neutral-500">Loading…</div>
                      )}
                      {surveyError && (
                        <div className="mt-4 text-xs text-red-500">{surveyError}</div>
                      )}

                      {!surveyLoading && !surveyError && surveyAnswers && (
                        <div className="mt-4 space-y-4">
                          {/* Behavioral */}
                          {surveyAnswers.behavioral && (
                            <SurveySection title="Behavioral" surfaceSoftStyle={surfaceSoftStyle}>
                              {[
                                { label: "Consistency", value: surveyAnswers.behavioral.consistency },
                                { label: "Motivation", value: surveyAnswers.behavioral.motivation },
                                { label: "Openness to change", value: surveyAnswers.behavioral.opennessToChange },
                                { label: "Follow-through under friction", value: surveyAnswers.behavioral.followThroughUnderFriction },
                              ].map(({ label, value }) => (
                                <div key={label} className="flex items-center justify-between gap-3">
                                  <span className="text-xs text-neutral-600 min-w-0">{label}</span>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.07)" }}>
                                      <div
                                        className="h-full rounded-full"
                                        style={{ width: `${((value ?? 0) / 10) * 100}%`, background: rgbaBrand(0.75) }}
                                      />
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums w-6 text-right" style={{ color: rgbaBrand(0.9) }}>{value ?? "?"}</span>
                                  </div>
                                </div>
                              ))}
                              <div className="flex items-center justify-between gap-3 pt-1">
                                <span className="text-xs text-neutral-600">Structure preference</span>
                                <SurveyPill>{formatStructurePref(surveyAnswers.behavioral.structurePreference)}</SurveyPill>
                              </div>
                            </SurveySection>
                          )}

                          {/* Identity */}
                          {surveyAnswers.identity && (
                            <SurveySection title="Identity" surfaceSoftStyle={surfaceSoftStyle}>
                              <div className="flex flex-wrap gap-1.5">
                                {(surveyAnswers.identity.adjectives ?? []).map((w: string) => (
                                  <SurveyPill key={w}>{w}</SurveyPill>
                                ))}
                                {(!surveyAnswers.identity.adjectives?.length) && (
                                  <span className="text-xs text-neutral-400">None selected</span>
                                )}
                              </div>
                            </SurveySection>
                          )}

                          {/* Time reality */}
                          {surveyAnswers.timeReality && (
                            <SurveySection title="Time Reality" surfaceSoftStyle={surfaceSoftStyle}>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <div className="text-[11px] text-neutral-500 mb-1">Sleep</div>
                                  <SurveyPill>{surveyAnswers.timeReality.sleepHours ?? "?"} hrs/night</SurveyPill>
                                </div>
                                <div>
                                  <div className="text-[11px] text-neutral-500 mb-1">Occupation</div>
                                  <SurveyPill>{formatOccupation(surveyAnswers.timeReality.occupation)}</SurveyPill>
                                </div>
                                <div>
                                  <div className="text-[11px] text-neutral-500 mb-1">Free time</div>
                                  <SurveyPill>{formatFreeTime(surveyAnswers.timeReality.freeTimeDesire)}</SurveyPill>
                                </div>
                              </div>
                            </SurveySection>
                          )}

                          {/* Taste */}
                          {surveyAnswers.taste && (
                            <SurveySection title="Taste" surfaceSoftStyle={surfaceSoftStyle}>
                              <div className="mb-2">
                                <div className="text-[11px] text-neutral-500 mb-1.5">Activities</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(surveyAnswers.taste.preferredActivities ?? []).map((a: string) => (
                                    <SurveyPill key={a}>{a}</SurveyPill>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <div className="text-[11px] text-neutral-500 mb-1.5">Entertainment</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(surveyAnswers.taste.entertainmentGenres ?? []).map((g: string) => (
                                    <SurveyPill key={g}>{g}</SurveyPill>
                                  ))}
                                  {(!surveyAnswers.taste.entertainmentGenres?.length) && (
                                    <span className="text-xs text-neutral-400">None selected</span>
                                  )}
                                </div>
                              </div>
                            </SurveySection>
                          )}

                          {/* Context */}
                          {surveyAnswers.context && (
                            <SurveySection title="Context" surfaceSoftStyle={surfaceSoftStyle}>
                              <div className="flex items-center gap-3 flex-wrap">
                                <div>
                                  <div className="text-[11px] text-neutral-500 mb-1">Age range</div>
                                  <SurveyPill>{surveyAnswers.context.ageRange ?? "?"}</SurveyPill>
                                </div>
                                {surveyAnswers.context.location && (
                                  <div>
                                    <div className="text-[11px] text-neutral-500 mb-1">Location</div>
                                    <SurveyPill>{surveyAnswers.context.location}</SurveyPill>
                                  </div>
                                )}
                              </div>
                            </SurveySection>
                          )}

                          {/* AI Profile preview */}
                          {surveyAnswers.aiProfile && (
                            <div>
                              <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">AI Context (what Jynx sees)</div>
                              <pre
                                className="text-[11px] leading-relaxed rounded-2xl px-4 py-3 overflow-x-auto whitespace-pre-wrap"
                                style={{ background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)", color: "rgba(0,0,0,0.65)", fontFamily: "ui-monospace, monospace" }}
                              >
                                {surveyAnswers.aiProfile}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}

                      {!surveyLoading && !surveyError && surveyAnswers && !Object.keys(surveyAnswers).length && (
                        <div className="mt-4 text-xs text-neutral-400">No survey responses found.</div>
                      )}
                    </div>
                  </div>
                )}

                {topTab === "preferences" && prefSection !== "medication" && prefSection !== "reminders" && prefSection !== "survey" && (
                  <ShellPanel
                    title={prettyPref(prefSection as PrefSection)}
                    subtitle="Coming soon"
                    surfaceStyle={surfaceStyle}
                    surfaceSoftStyle={surfaceSoftStyle}
                  />
                )}

                {topTab === "settings" && settingsSection === "account" ? (
                  <div className={panelBase} style={surfaceStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">Account</div>
                          <div className="mt-1 text-xs text-neutral-500">Live Clerk session + DB user record</div>
                        </div>

                        <SignOutButton redirectUrl="/login">
                          <button
                            className={cx(buttonBase, "bg-white hover:bg-black/[0.03] text-neutral-700")}
                            style={surfaceSoftStyle}
                          >
                            Sign out
                          </button>
                        </SignOutButton>
                      </div>

                      <div className="mt-4">
                        <AccountPanel />
                      </div>
                    </div>
                  </div>
                ) : topTab === "settings" && settingsSection === "appearance" ? (
                  <AppearancePanel surfaceStyle={surfaceStyle} />
                ) : topTab === "settings" ? (
                  <ShellPanel
                    title={prettySettings(settingsSection as SettingsSection)}
                    subtitle="Coming soon"
                    surfaceStyle={surfaceStyle}
                    surfaceSoftStyle={surfaceSoftStyle}
                  />
                ) : null}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Pill({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-[11px] text-neutral-700"
      style={style ?? { borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      {children}
    </span>
  );
}

function TopButton({
  active,
  label,
  sub,
  onClick,
  activeStyle,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  activeStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border px-4 py-3 transition bg-white hover:bg-black/[0.03]"
      style={active ? activeStyle : { borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className="text-sm font-semibold text-neutral-900">{label}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>
    </button>
  );
}

function SubButton({
  active,
  label,
  sub,
  onClick,
  activeStyle,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  activeStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border px-4 py-3 transition bg-white hover:bg-black/[0.03]"
      style={active ? activeStyle : { borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 0 0 1px rgba(0,0,0,0.04)" }}
    >
      <div className="text-sm font-semibold text-neutral-900">{label}</div>
      <div className="mt-0.5 text-xs text-neutral-500">{sub}</div>
    </button>
  );
}

function AppearancePanel({ surfaceStyle }: { surfaceStyle: CSSProperties }) {
  const { dark, setDark } = useTheme();

  return (
    <div className="rounded-3xl border bg-white" style={surfaceStyle}>
      <div className="p-4">
        <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.92)" : "rgba(17,17,17,0.92)" }}>Appearance</div>
        <div className="mt-1 text-xs" style={{ color: dark ? "rgba(240,240,240,0.48)" : "rgba(17,17,17,0.45)" }}>Choose your display theme</div>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium" style={{ color: dark ? "rgba(240,240,240,0.88)" : "rgba(17,17,17,0.88)" }}>Dark mode</div>
            <div className="mt-0.5 text-xs" style={{ color: dark ? "rgba(240,240,240,0.45)" : "rgba(17,17,17,0.45)" }}>
              {dark ? "Dark theme is on" : "Switch to dark theme"}
            </div>
          </div>

          {/* iOS-style toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="relative w-12 h-7 rounded-full transition-colors duration-300 focus:outline-none"
            style={{ background: dark ? "#1F8A5B" : "rgba(0,0,0,0.18)" }}
            aria-label="Toggle dark mode"
            role="switch"
            aria-checked={dark}
          >
            <span
              className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300"
              style={{ transform: dark ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function ShellPanel({
  title,
  subtitle,
  surfaceStyle,
  surfaceSoftStyle,
}: {
  title: string;
  subtitle: string;
  surfaceStyle: React.CSSProperties;
  surfaceSoftStyle: React.CSSProperties;
}) {
  return (
    <div className="rounded-3xl border bg-white" style={surfaceStyle}>
      <div className="p-4">
        <div className="text-sm font-semibold text-neutral-900">{title}</div>
        <div className="mt-1 text-xs text-neutral-500">{subtitle}</div>

        <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
          <div className="text-sm text-neutral-800">Coming soon.</div>
        </div>
      </div>
    </div>
  );
}

function prettyPref(s: PrefSection) {
  if (s === "medication") return "Medication";
  if (s === "reminders") return "Reminders";
  if (s === "health") return "Health";
  if (s === "study") return "Study";
  if (s === "scheduling") return "Scheduling";
  if (s === "survey") return "Initial Survey";
  return "Preferences";
}

function formatStructurePref(v: string) {
  const map: Record<string, string> = {
    strong_structure: "Strongly prefers structure",
    lean_structure: "Leans toward structure",
    neutral: "Neutral",
    lean_flexibility: "Leans toward flexibility",
    strong_flexibility: "Strongly prefers flexibility",
  };
  return map[v] ?? v;
}

function formatOccupation(v: string) {
  const map: Record<string, string> = {
    student: "Student",
    working_full_time: "Full-time",
    working_part_time: "Part-time",
    between_things: "Between things",
    other: "Other",
  };
  return map[v] ?? v;
}

function formatFreeTime(v: string) {
  const map: Record<string, string> = {
    very_little: "Very little",
    some: "Some",
    balanced: "Balanced",
    a_lot: "A lot",
  };
  return map[v] ?? v;
}

function SurveySection({
  title,
  children,
  surfaceSoftStyle,
}: {
  title: string;
  children: React.ReactNode;
  surfaceSoftStyle: React.CSSProperties;
}) {
  return (
    <div className="rounded-2xl border px-4 py-3" style={surfaceSoftStyle}>
      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2.5">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SurveyPill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700"
      style={{ borderColor: "rgba(0,0,0,0.09)", boxShadow: "0 0 0 1px rgba(0,0,0,0.03)" }}
    >
      {children}
    </span>
  );
}
function prettySettings(s: SettingsSection) {
  if (s === "account") return "Account";
  if (s === "privacy") return "Privacy";
  if (s === "notifications") return "Notifications";
  if (s === "appearance") return "Appearance";
  return "Settings";
}
