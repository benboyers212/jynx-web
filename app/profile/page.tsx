"use client";

import { useMemo, useState } from "react";

const OLIVE = "#556B2F";

type TopTab = "preferences" | "settings";
type PrefSection = "medication" | "reminders" | "health" | "study" | "scheduling";
type SettingsSection = "account" | "privacy" | "notifications" | "appearance";

type MedRecurrence = "Daily" | "Weekdays" | "Custom";

type Medication = {
  id: string;
  name: string;
  dosage: string; // "60mg"
  recurrence: MedRecurrence;
  times?: string; // "8:00 AM, 10:00 PM"
  pharmacy?: string; // "CVS"
  qty?: number; // 30
  refills?: number; // 2
  notes?: string;
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

export default function ProfilePage() {
  // === style tokens aligned to your shell ===
  const panelBase = "rounded-3xl border bg-white/6 backdrop-blur";
  const panelInner = "rounded-2xl border bg-neutral-900/40";
  const buttonBase =
    "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  const oliveCardStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };

  const oliveSoftStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.42)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
  };

  // ✅ Progressive disclosure state:
  // stage 1: only top tabs
  // stage 2: top + second column
  // stage 3: + details panel
  const [topTab, setTopTab] = useState<TopTab | null>(null);
  const [prefSection, setPrefSection] = useState<PrefSection | null>(null);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | null>(
    null
  );

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
    // entering stage 2: clear deeper selection
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

  // Medication UI state
  const [meds, setMeds] = useState<Medication[]>(() => [
    {
      id: "m1",
      name: "Armour Thyroid",
      dosage: "60mg",
      recurrence: "Daily",
      times: "8:00 AM",
      pharmacy: "CVS",
      qty: 30,
      refills: 2,
      notes: "Take on empty stomach.",
    },
  ]);

  const [mName, setMName] = useState("");
  const [mDosage, setMDosage] = useState("");
  const [mRecurrence, setMRecurrence] = useState<MedRecurrence>("Daily");
  const [mTimes, setMTimes] = useState("");
  const [mPharmacy, setMPharmacy] = useState("");
  const [mQty, setMQty] = useState<string>("");
  const [mRefills, setMRefills] = useState<string>("");
  const [mNotes, setMNotes] = useState("");

  function addMedication() {
    const name = mName.trim();
    if (!name) return;

    const item: Medication = {
      id: uid(),
      name,
      dosage: mDosage.trim() || "—",
      recurrence: mRecurrence,
      times: mTimes.trim() || undefined,
      pharmacy: mPharmacy.trim() || undefined,
      qty: toNum(mQty),
      refills: toNum(mRefills),
      notes: mNotes.trim() || undefined,
    };

    setMeds((prev) => [item, ...prev]);

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
    setMeds((prev) => prev.filter((m) => m.id !== id));
  }

  const crumbs = useMemo(() => {
    const out: Array<{ label: string; onClick: () => void }> = [
      { label: "Profile", onClick: goStage1 },
    ];

    if (!topTab) return out;

    out.push({
      label: topTab === "preferences" ? "Preferences" : "Settings",
      onClick: () => {
        // go back to stage 2
        if (topTab === "preferences") setPrefSection(null);
        else setSettingsSection(null);
      },
    });

    if (topTab === "preferences" && prefSection) {
      out.push({
        label: prettyPref(prefSection),
        onClick: () => {},
      });
    }

    if (topTab === "settings" && settingsSection) {
      out.push({
        label: prettySettings(settingsSection),
        onClick: () => {},
      });
    }

    return out;
  }, [topTab, prefSection, settingsSection]);

  // Layout widths per stage
  const gridCols =
    stage === 1
      ? "grid-cols-1"
      : stage === 2
      ? "grid-cols-1 lg:grid-cols-12"
      : "grid-cols-1 lg:grid-cols-12";

  const col1Span =
    stage === 1
      ? "lg:col-span-12"
      : stage === 2
      ? "lg:col-span-4"
      : "lg:col-span-3";

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
            <div className="mt-0.5 text-xs text-neutral-400">
              Preferences, settings, reminders & privacy.
            </div>

            {/* Breadcrumbs (clickable) */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-neutral-400">
              {crumbs.map((c, idx) => (
                <span key={c.label} className="flex items-center gap-2">
                  <button
                    onClick={c.onClick}
                    className={cx(
                      "font-semibold",
                      idx === crumbs.length - 1
                        ? "text-neutral-200 cursor-default"
                        : "text-neutral-300 hover:text-white"
                    )}
                    disabled={idx === crumbs.length - 1}
                    title={idx === crumbs.length - 1 ? undefined : "Back"}
                  >
                    {c.label}
                  </button>
                  {idx !== crumbs.length - 1 ? (
                    <span className="text-neutral-600">›</span>
                  ) : null}
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
          {/* Column 1: Tabs (always present) */}
          <aside className={cx(col1Span, "space-y-4")}>
            <div className={panelBase} style={oliveCardStyle}>
              <div className="p-4">
                <div className="text-xs font-semibold text-neutral-300">
                  Tabs
                </div>

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
                  <div className="text-[11px] text-neutral-400">
                    Click a tab to open the next menu.
                  </div>
                </div>
              </div>
            </div>

          </aside>

          {/* Column 2: Sub-tabs (only after choosing Preferences/Settings) */}
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
                      className={cx(
                        buttonBase,
                        "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                      )}
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
                      <div className="text-[11px] text-neutral-400">
                        Now pick a section to open details.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Column 3: Details (only after selecting a sub-tab) */}
          {stage === 3 && (
            <section className={cx(col3Span, "space-y-4")}>
              {topTab === "preferences" && prefSection === "medication" && (
                <div className={panelBase} style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">Medication</div>
                      <div className="ml-auto text-[11px] text-neutral-500">
                        reminders + refill/pickup logic
                      </div>
                    </div>

                    <div className="mt-1 text-xs text-neutral-400">
                      Store meds so Jynx can remind you to take them, track
                      refills, and prompt pickups.
                    </div>

                    {/* Current meds */}
                    <div className="mt-4 space-y-2">
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
                                <div className="text-sm font-semibold text-neutral-100">
                                  {m.name}
                                </div>
                                <Pill>{m.dosage}</Pill>
                                <Pill>{m.recurrence}</Pill>
                              </div>

                              <div className="mt-1 text-xs text-neutral-400">
                                {m.times ? `Times: ${m.times}` : "Times: —"} •{" "}
                                {m.pharmacy
                                  ? `Pharmacy: ${m.pharmacy}`
                                  : "Pharmacy: —"}{" "}
                                • Qty: {m.qty ?? "—"} • Refills:{" "}
                                {m.refills ?? "—"}
                              </div>

                              {m.notes ? (
                                <div className="mt-1 text-xs text-neutral-300">
                                  {m.notes}
                                </div>
                              ) : null}
                            </div>

                            <div className="flex flex-col gap-2">
                              <button
                                className={cx(
                                  buttonBase,
                                  "bg-white/10 hover:bg-white/14 border-white/12"
                                )}
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
                        <div className="text-sm font-semibold">
                          Add medication
                        </div>

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
                                onChange={(e) =>
                                  setMRecurrence(
                                    e.target.value as MedRecurrence
                                  )
                                }
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
                              className={cx(
                                buttonBase,
                                "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                              )}
                              onClick={() => alert("UI shell — reminders")}
                            >
                              Reminders
                            </button>

                            <button
                              className={cx(
                                buttonBase,
                                "bg-white/10 hover:bg-white/14 border-white/12"
                              )}
                              style={oliveSoftStyle}
                              onClick={addMedication}
                            >
                              Save
                            </button>
                          </div>
                        </div>

                        <div className="mt-4 text-[11px] text-neutral-500 flex items-center justify-between">
                          <span>Later: connect to DB + reminders engine.</span>
                          <span style={{ color: "rgba(85,107,47,0.9)" }}>
                            Jynx learns quietly
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other details shells */}
              {topTab === "preferences" && prefSection !== "medication" && (
                <ShellPanel
                  title={prettyPref(prefSection as PrefSection)}
                  subtitle="UI shell — add fields later"
                  oliveCardStyle={oliveCardStyle}
                />
              )}

              {topTab === "settings" && (
                <ShellPanel
                  title={prettySettings(settingsSection as SettingsSection)}
                  subtitle="UI shell — add options later"
                  oliveCardStyle={oliveCardStyle}
                />
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
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
        active
          ? "bg-white/12 border-white/18 text-neutral-100"
          : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
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
        active
          ? "bg-white/12 border-white/18 text-neutral-100"
          : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
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
    <div
      className="rounded-3xl border bg-white/6 backdrop-blur"
      style={oliveCardStyle}
    >
      <div className="p-4">
        <div className="text-sm font-semibold">{title}</div>
        <div className="mt-1 text-xs text-neutral-400">{subtitle}</div>

        <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-3">
          <div className="text-sm text-neutral-200">Coming soon.</div>
          <div className="mt-1 text-[11px] text-neutral-500">
            Keep this PS-style: list → subsection → details.
          </div>
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
