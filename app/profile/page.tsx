"use client";

import React, { useEffect, useState, type CSSProperties } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import AccountPanel from "./AccountPanel";
import { useTheme } from "../ThemeContext";
import { COMMON_TIMEZONES, getCurrentTimeInTimezone } from "@/lib/timezones";

const OLIVE = "#556B2F";

// Simplified single-level navigation
type Section = "general" | "appearance" | "preferences" | "survey" | "account";
type PrefSubSection = "medication" | "reminders" | "classes" | null;

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
  timeOfDay: string | null;
  daysOfWeek: string | null;
  date: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

type ClassHub = {
  id: string;
  name: string;
  courseCode: string | null;
  instructor: string | null;
  semester: string | null;
  department: string | null;
  meetingDays: string | null;
  meetingStartTime: string | null;
  meetingEndTime: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
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
  return `${pad2(h)}:${pad2(minute)}`;
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
    background: dark ? "rgba(38,38,38,0.85)" : "white",
  };
}

function getInputStyle(dark: boolean): CSSProperties {
  return {
    background: dark ? "rgba(38,38,38,0.85)" : "white",
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
    color: dark ? "rgba(240,240,240,0.92)" : undefined,
  };
}

const brandSoftStyle: CSSProperties = {
  borderColor: rgbaBrand(0.22),
  boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
};

export default function ProfilePage() {
  const { dark, setDark } = useTheme();
  useUser(); // Keep hook for auth state

  const surfaceStyle = getSurfaceStyle(dark);
  const surfaceSoftStyle = getSurfaceSoftStyle(dark);
  const panelBase = "rounded-3xl border";
  const panelInner = "rounded-2xl border";
  const buttonBase = "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  // Simplified navigation
  const [section, setSection] = useState<Section>("general");
  const [prefExpanded, setPrefExpanded] = useState(false);
  const [prefSubSection, setPrefSubSection] = useState<PrefSubSection>(null);

  function selectSection(s: Section) {
    setSection(s);
    if (s !== "preferences") {
      setPrefExpanded(false);
      setPrefSubSection(null);
    }
  }

  function togglePreferences() {
    if (section === "preferences" && prefExpanded) {
      setPrefExpanded(false);
      setPrefSubSection(null);
    } else {
      setSection("preferences");
      setPrefExpanded(true);
      if (!prefSubSection) setPrefSubSection("medication");
    }
  }

  function selectPrefSub(sub: PrefSubSection) {
    setSection("preferences");
    setPrefExpanded(true);
    setPrefSubSection(sub);
  }

  // Timezone state
  const [timezone, setTimezone] = useState<string>("");
  const [savingTimezone, setSavingTimezone] = useState(false);
  const [timezoneMessage, setTimezoneMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.dbUser?.timezone) {
          setTimezone(data.dbUser.timezone);
        } else {
          try {
            setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
          } catch {
            setTimezone("America/New_York");
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleTimezoneChange = async (newTimezone: string) => {
    setTimezone(newTimezone);
    setSavingTimezone(true);
    setTimezoneMessage(null);
    try {
      const res = await fetch("/api/me/timezone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timezone: newTimezone }),
      });
      if (res.ok) {
        setTimezoneMessage("Saved");
        setTimeout(() => setTimezoneMessage(null), 2000);
      } else {
        setTimezoneMessage("Failed to save");
      }
    } catch {
      setTimezoneMessage("Failed to save");
    } finally {
      setSavingTimezone(false);
    }
  };

  // =========================
  // Medication state
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

  useEffect(() => {
    if (section === "preferences" && prefSubSection === "medication") loadMeds();
  }, [section, prefSubSection]);

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

  // =========================
  // Reminders state
  // =========================
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [remLoading, setRemLoading] = useState(false);
  const [remError, setRemError] = useState<string | null>(null);
  const [remSaving, setRemSaving] = useState(false);

  const [rTitle, setRTitle] = useState("");
  const [rNotes, setRNotes] = useState("");
  const [rSchedule, setRSchedule] = useState<ReminderSchedule>("daily");
  const [rDate, setRDate] = useState("");
  const [rLocation, setRLocation] = useState("");
  const [rHour, setRHour] = useState(8);
  const [rMinute, setRMinute] = useState(0);
  const [rAmPm, setRAmPm] = useState<"AM" | "PM">("AM");
  const [rDays, setRDays] = useState<number[]>([1, 2, 3, 4, 5]);

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
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load");
      setReminders(Array.isArray(data.reminders) ? data.reminders : []);
    } catch (e: any) {
      setRemError(e?.message || "Failed to load");
    } finally {
      setRemLoading(false);
    }
  }

  useEffect(() => {
    if (section === "preferences" && prefSubSection === "reminders") loadReminders();
  }, [section, prefSubSection]);

  async function createReminder() {
    const title = rTitle.trim();
    if (!title) return;
    setRemSaving(true);
    setRemError(null);
    try {
      const payload: any = {
        title,
        notes: rNotes.trim() || null,
        schedule: rSchedule,
        timeOfDay: to24hTime(rHour, rMinute, rAmPm),
        daysOfWeek: rSchedule === "custom" ? JSON.stringify(rDays) : null,
        date: rSchedule === "once" && rDate ? rDate : null,
        location: rLocation.trim() || null,
      };
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to create");
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
      setRemError(e?.message || "Failed to create");
    } finally {
      setRemSaving(false);
    }
  }

  async function toggleReminder(id: string, enabled: boolean) {
    const prev = reminders;
    setReminders((r) => r.map((x) => (x.id === id ? { ...x, enabled } : x)));
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setReminders(prev);
    }
  }

  async function deleteReminder(id: string) {
    const prev = reminders;
    setReminders((r) => r.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setReminders(prev);
    }
  }

  // =========================
  // Classes state
  // =========================
  const [classes, setClasses] = useState<ClassHub[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [classesSaving, setClassesSaving] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const [cName, setCName] = useState("");
  const [cCode, setCCode] = useState("");
  const [cInstructor, setCInstructor] = useState("");
  const [cSemester, setCeSemester] = useState("");
  const [cMeetingDays, setCMeetingDays] = useState<number[]>([]);
  const [cStartTime, setCStartTime] = useState("");
  const [cEndTime, setCEndTime] = useState("");
  const [cLocation, setCLocation] = useState("");

  async function loadClasses() {
    setClassesError(null);
    setClassesLoading(true);
    try {
      const res = await fetch("/api/classes", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load");
      setClasses(Array.isArray(data.classes) ? data.classes : []);
    } catch (e: any) {
      setClassesError(e?.message || "Failed to load");
    } finally {
      setClassesLoading(false);
    }
  }

  useEffect(() => {
    if (section === "preferences" && prefSubSection === "classes") loadClasses();
  }, [section, prefSubSection]);

  function toggleClassDay(d: number) {
    setCMeetingDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function resetClassForm() {
    setCName("");
    setCCode("");
    setCInstructor("");
    setCeSemester("");
    setCMeetingDays([]);
    setCStartTime("");
    setCEndTime("");
    setCLocation("");
    setEditingClassId(null);
  }

  async function addClass() {
    if (!cName.trim()) return;
    setClassesSaving(true);
    setClassesError(null);
    try {
      const payload = {
        name: cName.trim(),
        courseCode: cCode.trim() || null,
        instructor: cInstructor.trim() || null,
        semester: cSemester.trim() || null,
        meetingDays: cMeetingDays.length ? JSON.stringify(cMeetingDays) : null,
        meetingStartTime: cStartTime || null,
        meetingEndTime: cEndTime || null,
        location: cLocation.trim() || null,
      };
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to create");
      await loadClasses();
      resetClassForm();
    } catch (e: any) {
      setClassesError(e?.message || "Failed to create");
    } finally {
      setClassesSaving(false);
    }
  }

  async function updateClass() {
    if (!editingClassId || !cName.trim()) return;
    setClassesSaving(true);
    setClassesError(null);
    try {
      const payload = {
        name: cName.trim(),
        courseCode: cCode.trim() || null,
        instructor: cInstructor.trim() || null,
        semester: cSemester.trim() || null,
        meetingDays: cMeetingDays.length ? JSON.stringify(cMeetingDays) : null,
        meetingStartTime: cStartTime || null,
        meetingEndTime: cEndTime || null,
        location: cLocation.trim() || null,
      };
      const res = await fetch(`/api/classes/${editingClassId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to update");
      await loadClasses();
      resetClassForm();
    } catch (e: any) {
      setClassesError(e?.message || "Failed to update");
    } finally {
      setClassesSaving(false);
    }
  }

  async function deleteClass(id: string) {
    const prev = classes;
    setClasses((c) => c.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/classes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
    } catch {
      setClasses(prev);
    }
  }

  function startEditClass(c: ClassHub) {
    setEditingClassId(c.id);
    setCName(c.name);
    setCCode(c.courseCode || "");
    setCInstructor(c.instructor || "");
    setCeSemester(c.semester || "");
    setCMeetingDays(c.meetingDays ? parseDays(c.meetingDays) : []);
    setCStartTime(c.meetingStartTime || "");
    setCEndTime(c.meetingEndTime || "");
    setCLocation(c.location || "");
  }

  function cancelEditClass() {
    resetClassForm();
  }

  // =========================
  // Survey state
  // =========================
  const [surveyAnswers, setSurveyAnswers] = useState<any>(null);
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyError, setSurveyError] = useState<string | null>(null);

  useEffect(() => {
    if (section === "survey") {
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
  }, [section]);

  const textPrimary = dark ? "rgba(240,240,240,0.92)" : "rgba(23,23,23,1)";
  const textMuted = dark ? "rgba(240,240,240,0.50)" : "rgba(115,115,115,1)";
  const textSecondary = dark ? "rgba(240,240,240,0.65)" : "rgba(82,82,82,1)";

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
      </div>

      <div className="h-full flex">
        {/* Sidebar */}
        <aside
          className="w-[280px] shrink-0 border-r h-full overflow-y-auto"
          style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", background: dark ? "rgba(26,26,26,0.50)" : "rgba(250,250,250,0.80)" }}
        >
          <div className="p-4">
            <div className="text-lg font-semibold mb-1" style={{ color: textPrimary }}>Settings</div>
            <div className="text-xs mb-6" style={{ color: textMuted }}>Manage your preferences</div>

            <div className="space-y-1">
              <NavItem
                active={section === "general"}
                onClick={() => selectSection("general")}
                dark={dark}
              >
                <span className="text-sm">Time & Region</span>
              </NavItem>

              <NavItem
                active={section === "appearance"}
                onClick={() => selectSection("appearance")}
                dark={dark}
              >
                <span className="text-sm">Appearance</span>
              </NavItem>

              {/* Preferences with expandable sub-items */}
              <div>
                <NavItem
                  active={section === "preferences" && !prefSubSection}
                  onClick={togglePreferences}
                  dark={dark}
                  hasChevron
                  expanded={prefExpanded}
                >
                  <span className="text-sm">Preferences</span>
                </NavItem>

                {prefExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    <NavItem
                      active={prefSubSection === "medication"}
                      onClick={() => selectPrefSub("medication")}
                      dark={dark}
                      small
                    >
                      <span className="text-[13px]">Medication</span>
                    </NavItem>
                    <NavItem
                      active={prefSubSection === "reminders"}
                      onClick={() => selectPrefSub("reminders")}
                      dark={dark}
                      small
                    >
                      <span className="text-[13px]">Reminders</span>
                    </NavItem>
                    <NavItem
                      active={prefSubSection === "classes"}
                      onClick={() => selectPrefSub("classes")}
                      dark={dark}
                      small
                    >
                      <span className="text-[13px]">Classes</span>
                    </NavItem>
                  </div>
                )}
              </div>

              <NavItem
                active={section === "survey"}
                onClick={() => selectSection("survey")}
                dark={dark}
              >
                <span className="text-sm">Profile Survey</span>
              </NavItem>

              <NavItem
                active={section === "account"}
                onClick={() => selectSection("account")}
                dark={dark}
              >
                <span className="text-sm">Account</span>
              </NavItem>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 h-full overflow-y-auto">
          <div className="max-w-[720px] mx-auto p-6">
            {/* General / Time & Region */}
            {section === "general" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Time & Region</div>
                  <div className="text-xs mb-5" style={{ color: textMuted }}>Your timezone is used for scheduling and AI responses. This was set during onboarding but can be changed here.</div>

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: textPrimary }}>Timezone</div>
                      <div className="mt-0.5 text-xs" style={{ color: textMuted }}>
                        Used for scheduling and AI responses
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {savingTimezone && <span className="text-[11px]" style={{ color: textMuted }}>Saving...</span>}
                      {timezoneMessage && <span className="text-[11px]" style={{ color: "#1F8A5B" }}>{timezoneMessage}</span>}
                    </div>
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => handleTimezoneChange(e.target.value)}
                    className="mt-3 w-full rounded-xl px-3 py-2.5 text-sm outline-none transition"
                    style={getInputStyle(dark)}
                  >
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label} ({tz.offset})
                      </option>
                    ))}
                  </select>
                  {timezone && (
                    <div className="mt-2 text-xs" style={{ color: textMuted }}>
                      Current time: {getCurrentTimeInTimezone(timezone)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Appearance */}
            {section === "appearance" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Appearance</div>
                  <div className="text-xs mb-5" style={{ color: textMuted }}>Customize how Jynx looks</div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium" style={{ color: textPrimary }}>Dark mode</div>
                      <div className="mt-0.5 text-xs" style={{ color: textMuted }}>
                        {dark ? "Dark theme is on" : "Switch to dark theme"}
                      </div>
                    </div>

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
            )}

            {/* Preferences > Medication */}
            {section === "preferences" && prefSubSection === "medication" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Medication</div>
                  <div className="text-xs mb-4" style={{ color: textMuted }}>Store meds so Jynx can remind you to take them, track refills, and prompt pickups.</div>

                  <div className="flex items-center gap-3 mb-4">
                    {medsLoading ? <span className="text-xs" style={{ color: textMuted }}>Loading…</span> : null}
                    {medsError ? <span className="text-xs text-red-500">{medsError}</span> : null}
                    <button
                      className={buttonBase}
                      style={surfaceSoftStyle}
                      onClick={loadMeds}
                      disabled={medsLoading}
                    >
                      Refresh
                    </button>
                  </div>

                  {/* Meds list */}
                  <div className="space-y-2 mb-4">
                    {meds.length === 0 && !medsLoading && (
                      <div className="text-xs" style={{ color: textMuted }}>No medications yet.</div>
                    )}
                    {meds.map((m) => (
                      <div key={m.id} className={panelInner} style={{ ...surfaceSoftStyle, padding: "12px" }}>
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-2xl border flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ ...brandSoftStyle, background: dark ? "rgba(38,38,38,0.85)" : "white" }}>
                            Rx
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold" style={{ color: textPrimary }}>{m.name}</span>
                              <Pill dark={dark} brand>{m.dosage}</Pill>
                              <Pill dark={dark}>{m.recurrence}</Pill>
                            </div>
                            <div className="mt-1 text-xs" style={{ color: textSecondary }}>
                              {m.times ? `Times: ${m.times}` : "Times: —"} • Pharmacy: {m.pharmacy || "—"} • Qty: {m.qty ?? "—"} • Refills: {m.refills ?? "—"}
                            </div>
                          </div>
                          <button className={buttonBase} style={surfaceSoftStyle} onClick={() => deleteMed(m.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add medication form */}
                  <div className={panelInner} style={surfaceSoftStyle}>
                    <div className="p-4">
                      <div className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>Add medication</div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Name" dark={dark}>
                            <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="e.g., Adderall" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                          <Field label="Dosage" dark={dark}>
                            <input value={mDosage} onChange={(e) => setMDosage(e.target.value)} placeholder="e.g., 20mg" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Recurrence" dark={dark}>
                            <select value={mRecurrence} onChange={(e) => setMRecurrence(e.target.value as MedRecurrence)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)}>
                              <option>Daily</option>
                              <option>Weekdays</option>
                              <option>Custom</option>
                            </select>
                          </Field>
                          <Field label="Times" dark={dark}>
                            <input value={mTimes} onChange={(e) => setMTimes(e.target.value)} placeholder="e.g., 8am, 2pm" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                        </div>
                        <div className="flex justify-end">
                          <button className={buttonBase} style={{ ...brandSoftStyle, background: dark ? "rgba(31,138,91,0.15)" : "rgba(31,138,91,0.08)" }} onClick={addMedication} disabled={saving || !mName.trim()}>
                            {saving ? "Saving..." : "Add Medication"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences > Reminders */}
            {section === "preferences" && prefSubSection === "reminders" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Reminders</div>
                  <div className="text-xs mb-4" style={{ color: textMuted }}>Set up recurring tasks and nudges.</div>

                  <div className="flex items-center gap-3 mb-4">
                    {remLoading ? <span className="text-xs" style={{ color: textMuted }}>Loading…</span> : null}
                    {remError ? <span className="text-xs text-red-500">{remError}</span> : null}
                    <button className={buttonBase} style={surfaceSoftStyle} onClick={loadReminders} disabled={remLoading}>
                      Refresh
                    </button>
                  </div>

                  {/* Reminders list */}
                  <div className="space-y-2 mb-4">
                    {reminders.length === 0 && !remLoading && (
                      <div className="text-xs" style={{ color: textMuted }}>No reminders yet.</div>
                    )}
                    {reminders.map((r) => (
                      <div key={r.id} className={panelInner} style={{ ...surfaceSoftStyle, padding: "12px" }}>
                        <div className="flex items-start gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: textPrimary }}>{r.title}</span>
                              <Pill dark={dark}>{r.schedule}</Pill>
                            </div>
                            <div className="mt-1 text-xs" style={{ color: textSecondary }}>
                              {formatTime12(r.timeOfDay)} • {r.schedule === "custom" ? formatDays(parseDays(r.daysOfWeek)) : r.schedule}
                            </div>
                          </div>
                          <label className="text-[11px] flex items-center gap-2 select-none" style={{ color: textMuted }}>
                            <input type="checkbox" checked={r.enabled} onChange={(e) => toggleReminder(r.id, e.target.checked)} />
                            Enabled
                          </label>
                          <button className={buttonBase} style={surfaceSoftStyle} onClick={() => deleteReminder(r.id)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add reminder form */}
                  <div className={panelInner} style={surfaceSoftStyle}>
                    <div className="p-4">
                      <div className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>Add reminder</div>
                      <div className="space-y-3">
                        <Field label="Title" dark={dark}>
                          <input value={rTitle} onChange={(e) => setRTitle(e.target.value)} placeholder="e.g., Take vitamins" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                        </Field>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Schedule" dark={dark}>
                            <select value={rSchedule} onChange={(e) => setRSchedule(e.target.value as ReminderSchedule)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)}>
                              <option value="daily">Daily</option>
                              <option value="weekdays">Weekdays</option>
                              <option value="custom">Custom days</option>
                              <option value="once">One-time</option>
                            </select>
                          </Field>
                          <Field label="Time" dark={dark}>
                            <div className="flex gap-1">
                              <select value={rHour} onChange={(e) => setRHour(Number(e.target.value))} className="flex-1 rounded-xl border px-2 py-2 text-sm outline-none" style={getInputStyle(dark)}>
                                {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                              </select>
                              <select value={rMinute} onChange={(e) => setRMinute(Number(e.target.value))} className="flex-1 rounded-xl border px-2 py-2 text-sm outline-none" style={getInputStyle(dark)}>
                                {[0, 15, 30, 45].map((m) => <option key={m} value={m}>{pad2(m)}</option>)}
                              </select>
                              <select value={rAmPm} onChange={(e) => setRAmPm(e.target.value as "AM" | "PM")} className="rounded-xl border px-2 py-2 text-sm outline-none" style={getInputStyle(dark)}>
                                <option>AM</option>
                                <option>PM</option>
                              </select>
                            </div>
                          </Field>
                        </div>
                        {rSchedule === "custom" && (
                          <Field label="Days" dark={dark}>
                            <div className="flex flex-wrap gap-2">
                              {DOW.map((d) => (
                                <button
                                  key={d.n}
                                  type="button"
                                  onClick={() => setRDays((prev) => prev.includes(d.n) ? prev.filter((x) => x !== d.n) : [...prev, d.n])}
                                  className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
                                  style={rDays.includes(d.n) ? brandSoftStyle : surfaceSoftStyle}
                                >
                                  {d.label}
                                </button>
                              ))}
                            </div>
                          </Field>
                        )}
                        <div className="flex justify-end">
                          <button className={buttonBase} style={{ ...brandSoftStyle, background: dark ? "rgba(31,138,91,0.15)" : "rgba(31,138,91,0.08)" }} onClick={createReminder} disabled={remSaving || !rTitle.trim()}>
                            {remSaving ? "Saving..." : "Add Reminder"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences > Classes */}
            {section === "preferences" && prefSubSection === "classes" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Classes</div>
                  <div className="text-xs mb-4" style={{ color: textMuted }}>Add and manage your classes so Jynx can link assignments and events.</div>

                  <div className="flex items-center gap-3 mb-4">
                    {classesLoading ? <span className="text-xs" style={{ color: textMuted }}>Loading…</span> : null}
                    {classesError ? <span className="text-xs text-red-500">{classesError}</span> : null}
                    <button className={buttonBase} style={surfaceSoftStyle} onClick={loadClasses} disabled={classesLoading}>
                      Refresh
                    </button>
                  </div>

                  {/* Classes list */}
                  <div className="space-y-2 mb-4">
                    {classes.length === 0 && !classesLoading && (
                      <div className="text-xs" style={{ color: textMuted }}>No classes yet.</div>
                    )}
                    {classes.map((c) => {
                      const days = c.meetingDays ? (() => {
                        try {
                          const parsed = JSON.parse(c.meetingDays);
                          return Array.isArray(parsed) ? parsed.join(", ") : c.meetingDays;
                        } catch { return c.meetingDays; }
                      })() : null;
                      return (
                        <div key={c.id} className={panelInner} style={{ ...surfaceSoftStyle, padding: "12px" }}>
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-2xl border flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ ...brandSoftStyle, background: dark ? "rgba(38,38,38,0.85)" : "white" }}>
                              {c.courseCode?.slice(0, 2).toUpperCase() || "CL"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold" style={{ color: textPrimary }}>{c.name}</span>
                                {c.courseCode && <Pill dark={dark} brand>{c.courseCode}</Pill>}
                                {c.semester && <Pill dark={dark}>{c.semester}</Pill>}
                              </div>
                              <div className="mt-1 text-xs" style={{ color: textSecondary }}>
                                {c.instructor || "—"} {days ? `• ${days}` : ""} {c.meetingStartTime && c.meetingEndTime ? `• ${formatTime12(c.meetingStartTime)}-${formatTime12(c.meetingEndTime)}` : ""} {c.location ? `• ${c.location}` : ""}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className={buttonBase} style={brandSoftStyle} onClick={() => startEditClass(c)}>Edit</button>
                              <button className={buttonBase} style={surfaceSoftStyle} onClick={() => deleteClass(c.id)}>Remove</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add/Edit class form */}
                  <div className={panelInner} style={surfaceSoftStyle}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-semibold" style={{ color: textPrimary }}>{editingClassId ? "Edit class" : "Add a class"}</div>
                        {editingClassId && <button className={buttonBase} style={surfaceSoftStyle} onClick={cancelEditClass}>Cancel</button>}
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Class Name" dark={dark}>
                            <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="e.g., Operating Systems" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                          <Field label="Course Code" dark={dark}>
                            <input value={cCode} onChange={(e) => setCCode(e.target.value)} placeholder="e.g., CS401" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Instructor" dark={dark}>
                            <input value={cInstructor} onChange={(e) => setCInstructor(e.target.value)} placeholder="e.g., Dr. Smith" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                          <Field label="Semester" dark={dark}>
                            <input value={cSemester} onChange={(e) => setCeSemester(e.target.value)} placeholder="e.g., Spring 2026" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                        </div>
                        <Field label="Meeting Days" dark={dark}>
                          <div className="flex flex-wrap gap-2">
                            {DOW.map((d) => (
                              <button
                                key={d.n}
                                type="button"
                                onClick={() => toggleClassDay(d.n)}
                                className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
                                style={cMeetingDays.includes(d.n) ? brandSoftStyle : surfaceSoftStyle}
                              >
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </Field>
                        <div className="grid grid-cols-3 gap-3">
                          <Field label="Start Time" dark={dark}>
                            <input type="time" value={cStartTime} onChange={(e) => setCStartTime(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                          <Field label="End Time" dark={dark}>
                            <input type="time" value={cEndTime} onChange={(e) => setCEndTime(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                          <Field label="Location" dark={dark}>
                            <input value={cLocation} onChange={(e) => setCLocation(e.target.value)} placeholder="e.g., Room 201" className="w-full rounded-xl border px-3 py-2 text-sm outline-none" style={getInputStyle(dark)} />
                          </Field>
                        </div>
                        <div className="flex justify-end">
                          <button className={buttonBase} style={{ ...brandSoftStyle, background: dark ? "rgba(31,138,91,0.15)" : "rgba(31,138,91,0.08)" }} onClick={editingClassId ? updateClass : addClass} disabled={classesSaving || !cName.trim()}>
                            {classesSaving ? "Saving..." : editingClassId ? "Update Class" : "Add Class"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Survey */}
            {section === "survey" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="text-base font-semibold mb-1" style={{ color: textPrimary }}>Profile Survey</div>
                  <div className="text-xs mb-5" style={{ color: textMuted }}>Your onboarding responses — used by Jynx as a starting context.</div>

                  {surveyLoading && <div className="text-xs" style={{ color: textMuted }}>Loading…</div>}
                  {surveyError && <div className="text-xs text-red-500">{surveyError}</div>}

                  {!surveyLoading && !surveyError && surveyAnswers && (
                    <div className="space-y-4">
                      {surveyAnswers.behavioral && (
                        <SurveySection title="Behavioral" dark={dark} surfaceSoftStyle={surfaceSoftStyle}>
                          {[
                            { label: "Consistency", value: surveyAnswers.behavioral.consistency },
                            { label: "Motivation", value: surveyAnswers.behavioral.motivation },
                            { label: "Openness to change", value: surveyAnswers.behavioral.opennessToChange },
                            { label: "Follow-through under friction", value: surveyAnswers.behavioral.followThroughUnderFriction },
                          ].map(({ label, value }) => (
                            <div key={label} className="flex items-center justify-between gap-3">
                              <span className="text-xs" style={{ color: textSecondary }}>{label}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.07)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${((value ?? 0) / 10) * 100}%`, background: rgbaBrand(0.75) }} />
                                </div>
                                <span className="text-xs font-semibold w-4 text-right" style={{ color: rgbaBrand(0.9) }}>{value ?? "?"}</span>
                              </div>
                            </div>
                          ))}
                        </SurveySection>
                      )}

                      {surveyAnswers.identity && (
                        <SurveySection title="Identity" dark={dark} surfaceSoftStyle={surfaceSoftStyle}>
                          <div className="flex flex-wrap gap-1.5">
                            {(surveyAnswers.identity.adjectives ?? []).map((w: string) => (
                              <SurveyPill key={w} dark={dark}>{w}</SurveyPill>
                            ))}
                            {(!surveyAnswers.identity.adjectives?.length) && (
                              <span className="text-xs" style={{ color: textMuted }}>None selected</span>
                            )}
                          </div>
                        </SurveySection>
                      )}

                      {surveyAnswers.timeReality && (
                        <SurveySection title="Time Reality" dark={dark} surfaceSoftStyle={surfaceSoftStyle}>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <div className="text-[11px] mb-1" style={{ color: textMuted }}>Sleep</div>
                              <SurveyPill dark={dark}>{surveyAnswers.timeReality.sleepHours ?? "?"} hrs/night</SurveyPill>
                            </div>
                            <div>
                              <div className="text-[11px] mb-1" style={{ color: textMuted }}>Occupation</div>
                              <SurveyPill dark={dark}>{formatOccupation(surveyAnswers.timeReality.occupation)}</SurveyPill>
                            </div>
                            <div>
                              <div className="text-[11px] mb-1" style={{ color: textMuted }}>Free time</div>
                              <SurveyPill dark={dark}>{formatFreeTime(surveyAnswers.timeReality.freeTimeDesire)}</SurveyPill>
                            </div>
                          </div>
                        </SurveySection>
                      )}

                      {surveyAnswers.context && (
                        <SurveySection title="Context" dark={dark} surfaceSoftStyle={surfaceSoftStyle}>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div>
                              <div className="text-[11px] mb-1" style={{ color: textMuted }}>Age range</div>
                              <SurveyPill dark={dark}>{surveyAnswers.context.ageRange ?? "?"}</SurveyPill>
                            </div>
                            {surveyAnswers.context.location && (
                              <div>
                                <div className="text-[11px] mb-1" style={{ color: textMuted }}>Location</div>
                                <SurveyPill dark={dark}>{surveyAnswers.context.location}</SurveyPill>
                              </div>
                            )}
                          </div>
                        </SurveySection>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Account */}
            {section === "account" && (
              <div className={panelBase} style={{ ...surfaceStyle, background: dark ? "var(--surface)" : "white" }}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-base font-semibold" style={{ color: textPrimary }}>Account</div>
                      <div className="text-xs" style={{ color: textMuted }}>Manage your account settings</div>
                    </div>
                    <SignOutButton redirectUrl="/login">
                      <button className={buttonBase} style={surfaceSoftStyle}>
                        Sign out
                      </button>
                    </SignOutButton>
                  </div>
                  <AccountPanel />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

// Helper components

function NavItem({
  active,
  onClick,
  children,
  dark,
  hasChevron,
  expanded,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dark: boolean;
  hasChevron?: boolean;
  expanded?: boolean;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-xl transition flex items-center justify-between",
        small ? "px-3 py-2" : "px-3 py-2.5"
      )}
      style={{
        background: active
          ? (dark ? "rgba(31,138,91,0.15)" : "rgba(31,138,91,0.08)")
          : "transparent",
        color: active
          ? (dark ? "rgba(240,240,240,0.95)" : "rgba(23,23,23,1)")
          : (dark ? "rgba(240,240,240,0.70)" : "rgba(64,64,64,1)"),
      }}
    >
      {children}
      {hasChevron && (
        <span style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 150ms" }}>
          ›
        </span>
      )}
    </button>
  );
}

function Field({ label, children, dark = false }: { label: string; children: React.ReactNode; dark?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold mb-1.5" style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(64,64,64,1)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Pill({ children, dark = false, brand = false }: { children: React.ReactNode; dark?: boolean; brand?: boolean }) {
  const style: CSSProperties = brand
    ? { borderColor: rgbaBrand(0.22), boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`, background: dark ? "rgba(31,138,91,0.12)" : "rgba(31,138,91,0.06)" }
    : { borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)", boxShadow: dark ? "0 0 0 1px rgba(0,0,0,0.15)" : "0 0 0 1px rgba(0,0,0,0.04)", background: dark ? "rgba(38,38,38,0.85)" : "white" };

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
      style={{ ...style, color: dark ? "rgba(240,240,240,0.80)" : "rgba(64,64,64,1)" }}
    >
      {children}
    </span>
  );
}

function SurveySection({ title, children, dark, surfaceSoftStyle }: { title: string; children: React.ReactNode; dark: boolean; surfaceSoftStyle: CSSProperties }) {
  return (
    <div className="rounded-2xl border px-4 py-3" style={surfaceSoftStyle}>
      <div className="text-[11px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(115,115,115,1)" }}>{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SurveyPill({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
      style={{
        background: dark ? "rgba(255,255,255,0.06)" : "white",
        borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)",
        boxShadow: dark ? "none" : "0 0 0 1px rgba(0,0,0,0.03)",
        color: dark ? "rgba(240,240,240,0.80)" : "rgba(64,64,64,1)",
      }}
    >
      {children}
    </span>
  );
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
