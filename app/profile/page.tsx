"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { SignOutButton } from "@clerk/nextjs";
import AccountPanel from "./AccountPanel";

const OLIVE = "#556B2F";

type TopTab = "preferences" | "settings";
type PrefSection = "medication" | "reminders" | "health" | "study" | "scheduling";
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
    return Array.isArray(v) ? v.filter((x) => Number.isFinite(Number(x))).map((x) => Number(x)) : [];
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

export default function ProfilePage() {
  // === style tokens aligned to your shell ===
  const panelBase = "rounded-3xl border bg-white/6 backdrop-blur";
  const panelInner = "rounded-2xl border bg-neutral-900/40";
  const buttonBase = "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  const oliveCardStyle: CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };

  const oliveSoftStyle: CSSProperties = {
    borderColor: "rgba(85,107,47,0.42)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
  };

  // ✅ Progressive disclosure state:
  const [topTab, setTopTab] = useState<TopTab | null>(null);
  const [prefSection, setPrefSection] = useState<PrefSection | null>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(null);

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

  // Header mock
  const userInitial = "B";

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
      // safest: refresh list so UI matches DB
      await loadMeds();
    } catch (e: any) {
      setMedsError(e?.message || "Failed to create med");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMed(id: string) {
    // optimistic remove
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
      setMeds(prev); // revert
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

    // clear inputs after successful-ish create attempt
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
    // sensible defaults when schedule changes
    if (rSchedule === "weekdays") setRDays([1, 2, 3, 4, 5]);
    if (rSchedule === "daily") setRDays([]);
    if (rSchedule === "once") setRDays([]);
    // custom keeps user selection
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

    // Once requires a date
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

      // reset
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

    // optimistic
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

    // optimistic
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

  const crumbs = useMemo(() => {
    const out: Array<{ label: string; onClick: () => void }> = [{ label: "Profile", onClick: goStage1 }];

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

  // Layout widths per stage
  const gridCols =
    stage === 1 ? "grid-cols-1" : stage === 2 ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1 lg:grid-cols-12";

  const col1Span = stage === 1 ? "lg:col-span-12" : stage === 2 ? "lg:col-span-4" : "lg:col-span-3";

  const col2Span = stage === 2 ? "lg:col-span-8" : "lg:col-span-3";
  const col3Span = "lg:col-span-6";

  return (
    <main className="bg-neutral-950 text-neutral-100">
      {/* Header */}
      <div className="border-b border-white/10 bg-neutral-950/55 backdrop-blur">
        <div className="px-5 py-4 flex items-start gap-3">
          <div
            className="h-11 w-11 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.18)" }}
          >
            {userInitial}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Profile</div>
            <div className="mt-0.5 text-xs text-neutral-400">Preferences, settings, reminders & privacy.</div>

            {/* Breadcrumbs */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
              {crumbs.map((c, idx) => (
                <span key={c.label} className="flex items-center gap-2">
                  <button
                    onClick={c.onClick}
                    className={cx(
                      "font-semibold",
                      idx === crumbs.length - 1 ? "text-neutral-200 cursor-default" : "text-neutral-300 hover:text-white"
                    )}
                    disabled={idx === crumbs.length - 1}
                    title={idx === crumbs.length - 1 ? undefined : "Back"}
                  >
                    {c.label}
                  </button>
                  {idx !== crumbs.length - 1 ? <span className="text-neutral-600">›</span> : null}
                </span>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 pt-1">UI shell</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className={cx("grid gap-4", gridCols)}>
          {/* Column 1 */}
          <aside className={cx(col1Span, "space-y-4")}>
            <div className={panelBase} style={oliveCardStyle}>
              <div className="p-4">
                <div className="text-xs font-semibold text-neutral-300">Tabs</div>

                <div className="mt-3 space-y-2">
                  <TopButton
                    active={topTab === "preferences"}
                    label="Preferences"
                    sub="Things Jynx learns + uses"
                    onClick={() => chooseTop("preferences")}
                    oliveSoftStyle={oliveSoftStyle}
                  />

                  <TopButton
                    active={topTab === "settings"}
                    label="Settings"
                    sub="Account, privacy, app"
                    onClick={() => chooseTop("settings")}
                    oliveSoftStyle={oliveSoftStyle}
                  />
                </div>

                <div className="mt-4 rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                  <div className="text-[11px] text-neutral-400">Click a tab to open the next menu.</div>
                </div>
              </div>
            </div>
          </aside>

          {/* Column 2 */}
          {stage >= 2 && (
            <aside className={cx(col2Span, "space-y-4")}>
              <div className={panelBase} style={oliveCardStyle}>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-neutral-300">
                      {topTab === "preferences" ? "Preferences" : "Settings"}
                    </div>

                    <button
                      onClick={goStage1}
                      className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
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
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={prefSection === "reminders"}
                          label="Reminders"
                          sub="Recurring tasks & nudges"
                          onClick={() => choosePref("reminders")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={prefSection === "health"}
                          label="Health"
                          sub="Injuries, allergies, basics"
                          onClick={() => choosePref("health")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={prefSection === "study"}
                          label="Study"
                          sub="Class load, exam windows"
                          onClick={() => choosePref("study")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={prefSection === "scheduling"}
                          label="Scheduling"
                          sub="Deep work rules, focus style"
                          onClick={() => choosePref("scheduling")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                      </>
                    ) : (
                      <>
                        <SubButton
                          active={settingsSection === "account"}
                          label="Account"
                          sub="Profile + sign-in"
                          onClick={() => chooseSettings("account")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={settingsSection === "privacy"}
                          label="Privacy"
                          sub="Data controls + sharing"
                          onClick={() => chooseSettings("privacy")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={settingsSection === "notifications"}
                          label="Notifications"
                          sub="Push, email, SMS"
                          onClick={() => chooseSettings("notifications")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                        <SubButton
                          active={settingsSection === "appearance"}
                          label="Appearance"
                          sub="Theme + density"
                          onClick={() => chooseSettings("appearance")}
                          oliveSoftStyle={oliveSoftStyle}
                        />
                      </>
                    )}
                  </div>

                  {stage === 2 && (
                    <div className="mt-4 rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                      <div className="text-[11px] text-neutral-400">Now pick a section to open details.</div>
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
                <div className={panelBase} style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">Medication</div>
                      <div className="ml-auto text-[11px] text-neutral-500">reminders + refill/pickup logic</div>
                    </div>

                    <div className="mt-1 text-xs text-neutral-400">
                      Store meds so Jynx can remind you to take them, track refills, and prompt pickups.
                    </div>

                    {/* status line */}
                    <div className="mt-3 text-[11px] text-neutral-500 flex items-center gap-3">
                      {medsLoading ? <span>Loading…</span> : <span>Loaded</span>}
                      {medsError ? <span className="text-red-300">{medsError}</span> : null}
                      <button
                        className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
                        onClick={loadMeds}
                        disabled={medsLoading}
                        title="Refresh"
                      >
                        Refresh
                      </button>
                    </div>

                    {/* Current meds */}
                    <div className="mt-4 space-y-2">
                      {meds.length === 0 && !medsLoading ? (
                        <div className="text-xs text-neutral-400">No medications yet.</div>
                      ) : null}

                      {meds.map((m) => (
                        <div
                          key={m.id}
                          className={cx(panelInner, "px-3 py-3")}
                          style={{ borderColor: "rgba(255,255,255,0.12)" }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="h-10 w-10 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-[11px] font-semibold shrink-0"
                              style={oliveSoftStyle}
                            >
                              Rx
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="text-sm font-semibold text-neutral-100">{m.name}</div>
                                <Pill>{m.dosage}</Pill>
                                <Pill>{m.recurrence}</Pill>
                              </div>

                              <div className="mt-1 text-xs text-neutral-400">
                                {m.times ? `Times: ${m.times}` : "Times: —"} •{" "}
                                {m.pharmacy ? `Pharmacy: ${m.pharmacy}` : "Pharmacy: —"} • Qty: {m.qty ?? "—"} •
                                Refills: {m.refills ?? "—"}
                              </div>

                              {m.notes ? <div className="mt-1 text-xs text-neutral-300">{m.notes}</div> : null}
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                                style={oliveSoftStyle}
                                onClick={() => alert("UI shell — remind")}
                              >
                                Remind
                              </button>

                              <button
                                className={cx(
                                  buttonBase,
                                  "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                                )}
                                onClick={() => removeMedication(m.id)}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add medication */}
                    <div className="mt-4 rounded-3xl border border-white/10 bg-white/6">
                      <div className="p-4">
                        <div className="text-sm font-semibold">Add medication</div>

                        <div className="mt-3 space-y-3">
                          <Field label="Name">
                            <input
                              value={mName}
                              onChange={(e) => setMName(e.target.value)}
                              placeholder="e.g., Lamotrigine"
                              className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                            />
                          </Field>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Dosage">
                              <input
                                value={mDosage}
                                onChange={(e) => setMDosage(e.target.value)}
                                placeholder="e.g., 150mg"
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                              />
                            </Field>

                            <Field label="Recurrence">
                              <select
                                value={mRecurrence}
                                onChange={(e) => setMRecurrence(e.target.value as MedRecurrence)}
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none"
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
                              className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                            />
                          </Field>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field label="Pharmacy (optional)">
                              <input
                                value={mPharmacy}
                                onChange={(e) => setMPharmacy(e.target.value)}
                                placeholder="e.g., CVS"
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                              />
                            </Field>

                            <Field label="Qty">
                              <input
                                value={mQty}
                                onChange={(e) => setMQty(e.target.value)}
                                placeholder="0"
                                inputMode="numeric"
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                              />
                            </Field>

                            <Field label="Refills">
                              <input
                                value={mRefills}
                                onChange={(e) => setMRefills(e.target.value)}
                                placeholder="0"
                                inputMode="numeric"
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                              />
                            </Field>
                          </div>

                          <Field label="Notes (optional)">
                            <input
                              value={mNotes}
                              onChange={(e) => setMNotes(e.target.value)}
                              placeholder="e.g., take with food"
                              className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                            />
                          </Field>

                          <div className="flex items-center justify-between">
                            <button
                              className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
                              onClick={() => alert("UI shell — reminders")}
                            >
                              Reminders
                            </button>

                            <button
                              className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                              style={oliveSoftStyle}
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
                          <span style={{ color: "rgba(85,107,47,0.9)" }}>Jynx learns quietly</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ✅ Reminders (full UI) */}
              {topTab === "preferences" && prefSection === "reminders" && (
                <div className={panelBase} style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">Reminders</div>
                      <div className="ml-auto text-[11px] text-neutral-500">recurring tasks & nudges</div>
                    </div>

                    <div className="mt-1 text-xs text-neutral-400">
                      Date, time (AM/PM), recurrence, location — plus Custom day picking.
                    </div>

                    {/* status line */}
                    <div className="mt-3 text-[11px] text-neutral-500 flex items-center gap-3">
                      {remLoading ? <span>Loading…</span> : <span>Loaded</span>}
                      {remError ? <span className="text-red-300">{remError}</span> : null}
                      <button
                        className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
                        onClick={loadReminders}
                        disabled={remLoading}
                        title="Refresh"
                      >
                        Refresh
                      </button>
                    </div>

                    {/* Add reminder */}
                    <div className="mt-4 rounded-3xl border border-white/10 bg-white/6">
                      <div className="p-4">
                        <div className="text-sm font-semibold">New reminder</div>

                        <div className="mt-3 space-y-3">
                          <Field label="Title">
                            <input
                              value={rTitle}
                              onChange={(e) => setRTitle(e.target.value)}
                              placeholder="e.g., Pay rent, Stretch, Call mom"
                              className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                            />
                          </Field>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Field label="Recurrence">
                              <select
                                value={rSchedule}
                                onChange={(e) => setRSchedule(e.target.value as ReminderSchedule)}
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none"
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
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                              />
                            </Field>
                          </div>

                          {rSchedule === "once" ? (
                            <Field label="Date">
                              <input
                                type="date"
                                value={rDate}
                                onChange={(e) => setRDate(e.target.value)}
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none"
                              />
                            </Field>
                          ) : null}

                          {/* Time + AM/PM */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Field label="Hour">
                              <select
                                value={rHour}
                                onChange={(e) => setRHour(Number(e.target.value))}
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none"
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
                                className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none"
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
                                  className={cx(
                                    "flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                                    rAmPm === "AM"
                                      ? "bg-white/12 border-white/18 text-neutral-100"
                                      : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                                  )}
                                  style={rAmPm === "AM" ? oliveSoftStyle : undefined}
                                >
                                  AM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRAmPm("PM")}
                                  className={cx(
                                    "flex-1 rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                                    rAmPm === "PM"
                                      ? "bg-white/12 border-white/18 text-neutral-100"
                                      : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                                  )}
                                  style={rAmPm === "PM" ? oliveSoftStyle : undefined}
                                >
                                  PM
                                </button>
                              </div>
                            </Field>
                          </div>

                          {/* Custom day picker */}
                          {rSchedule === "custom" ? (
                            <div>
                              <div className="text-[11px] text-neutral-400">Days of week</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {DOW.map((d) => {
                                  const on = rDays.includes(d.n);
                                  return (
                                    <button
                                      key={d.n}
                                      type="button"
                                      onClick={() => {
                                        setRDays((prev) =>
                                          prev.includes(d.n) ? prev.filter((x) => x !== d.n) : [...prev, d.n]
                                        );
                                      }}
                                      className={cx(
                                        "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                                        on
                                          ? "bg-white/12 border-white/18 text-neutral-100"
                                          : "bg-white/6 border-white/12 text-neutral-300 hover:bg-white/10"
                                      )}
                                      style={on ? oliveSoftStyle : undefined}
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
                              className="w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                            />
                          </Field>

                          <div className="flex items-center justify-end">
                            <button
                              className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                              style={oliveSoftStyle}
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
                          <span style={{ color: "rgba(85,107,47,0.9)" }}>Jynx nudges quietly</span>
                        </div>
                      </div>
                    </div>

                    {/* List */}
                    <div className="mt-4 space-y-2">
                      {reminders.length === 0 && !remLoading ? (
                        <div className="text-xs text-neutral-400">No reminders yet.</div>
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
                          <div
                            key={r.id}
                            className={cx(panelInner, "px-3 py-3")}
                            style={{ borderColor: "rgba(255,255,255,0.12)" }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="h-10 w-10 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-[11px] font-semibold shrink-0"
                                style={oliveSoftStyle}
                              >
                                ⏰
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div
                                    className={cx(
                                      "text-sm font-semibold",
                                      r.enabled ? "text-neutral-100" : "text-neutral-400 line-through"
                                    )}
                                  >
                                    {r.title}
                                  </div>
                                  <Pill>{r.schedule}</Pill>
                                  <Pill>{formatTime12(r.timeOfDay)}</Pill>
                                  {r.location ? <Pill>{r.location}</Pill> : null}
                                  <Pill>{dayLabel}</Pill>
                                  <Pill>{r.enabled ? "On" : "Off"}</Pill>
                                </div>

                                <div className="mt-1 text-xs text-neutral-400">{r.notes ? r.notes : "Notes: —"}</div>
                              </div>

                              <div className="flex flex-col gap-2 items-end">
                                <label className="text-[11px] text-neutral-300 flex items-center gap-2 select-none">
                                  <input
                                    type="checkbox"
                                    checked={r.enabled}
                                    onChange={(e) => toggleReminder(r.id, e.target.checked)}
                                  />
                                  Enabled
                                </label>

                                <button
                                  className={cx(
                                    buttonBase,
                                    "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                                  )}
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

              {/* Other details shells */}
              {topTab === "preferences" && prefSection !== "medication" && prefSection !== "reminders" && (
                <ShellPanel
                  title={prettyPref(prefSection as PrefSection)}
                  subtitle="UI shell — add fields later"
                  oliveCardStyle={oliveCardStyle}
                />
              )}

              {topTab === "settings" && settingsSection === "account" ? (
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">Account</div>
                        <div className="mt-1 text-xs text-neutral-400">Live Clerk session + DB user record</div>
                      </div>

                      <SignOutButton redirectUrl="/login">
                        <button
                          className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
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
              ) : topTab === "settings" ? (
                <ShellPanel
                  title={prettySettings(settingsSection as SettingsSection)}
                  subtitle="UI shell — add options later"
                  oliveCardStyle={oliveCardStyle}
                />
              ) : null}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-neutral-400">{label}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full border border-white/12 bg-white/6 px-2.5 py-1 text-[11px] text-neutral-200"
      style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.18)" }}
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
  oliveSoftStyle,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  oliveSoftStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-2xl border px-4 py-3 transition",
        active ? "bg-white/12 border-white/18 text-neutral-100" : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
      )}
      style={active ? oliveSoftStyle : undefined}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-0.5 text-xs text-neutral-400">{sub}</div>
    </button>
  );
}

function SubButton({
  active,
  label,
  sub,
  onClick,
  oliveSoftStyle,
}: {
  active: boolean;
  label: string;
  sub: string;
  onClick: () => void;
  oliveSoftStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-2xl border px-4 py-3 transition",
        active ? "bg-white/12 border-white/18 text-neutral-100" : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
      )}
      style={active ? oliveSoftStyle : undefined}
    >
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-0.5 text-xs text-neutral-400">{sub}</div>
    </button>
  );
}

function ShellPanel({
  title,
  subtitle,
  oliveCardStyle,
}: {
  title: string;
  subtitle: string;
  oliveCardStyle: React.CSSProperties;
}) {
  return (
    <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
      <div className="p-4">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-neutral-400">{subtitle}</div>

        <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-3">
          <div className="text-sm text-neutral-200">Coming soon.</div>
          <div className="mt-1 text-[11px] text-neutral-500">Keep this PS-style: list → subsection → details.</div>
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
  return "Preferences";
}
function prettySettings(s: SettingsSection) {
  if (s === "account") return "Account";
  if (s === "privacy") return "Privacy";
  if (s === "notifications") return "Notifications";
  if (s === "appearance") return "Appearance";
  return "Settings";
}
