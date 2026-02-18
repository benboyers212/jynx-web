"use client";

import React, { useState, useEffect } from "react";
import { NotesEditor } from "./NotesEditor";
import { FilesPanel } from "./FilesPanel";

type Tab = "Overview" | "Log" | "Notes" | "Files";

type Exercise = { name: string; sets?: number; reps?: number; weight?: string };

type WorkoutLog = {
  id: string;
  exercises: Exercise[];
  duration?: number | null;
  notes?: string | null;
  createdAt: Date;
};

type EventFile = {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  size?: number | null;
  createdAt: Date;
};

type WorkoutEventDetailProps = {
  eventId: string;
  eventTime: string;
  eventEndTime?: string;
  eventLocation?: string;
  eventMeta?: string;
  initialWorkoutLogs?: WorkoutLog[];
  initialFiles?: EventFile[];
  dark?: boolean;
};

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

const emptyExercise = (): Exercise => ({ name: "", sets: undefined, reps: undefined, weight: "" });

export function WorkoutEventDetail({
  eventId,
  eventTime,
  eventEndTime,
  eventLocation,
  eventMeta,
  initialWorkoutLogs = [],
  initialFiles = [],
  dark = false,
}: WorkoutEventDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [logs, setLogs] = useState<WorkoutLog[]>(initialWorkoutLogs);
  const [files, setFiles] = useState<EventFile[]>(initialFiles);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // New log form
  const [showForm, setShowForm] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([emptyExercise()]);
  const [duration, setDuration] = useState("");
  const [logNotes, setLogNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const tabs: Tab[] = ["Overview", "Log", "Notes", "Files"];

  useEffect(() => {
    if (activeTab !== "Log") return;
    setLoadingLogs(true);
    fetch(`/api/events/${eventId}/workout-logs`)
      .then((r) => r.json())
      .then((res) => {
        const data = Array.isArray(res) ? res : res?.data ?? [];
        setLogs(data);
      })
      .catch(console.error)
      .finally(() => setLoadingLogs(false));
  }, [eventId, activeTab]);

  useEffect(() => {
    if (activeTab !== "Files") return;
    setLoadingFiles(true);
    fetch(`/api/files?eventId=${eventId}`)
      .then((r) => r.json())
      .then((res) => { setFiles(res?.data ?? res ?? []); })
      .catch(console.error)
      .finally(() => setLoadingFiles(false));
  }, [eventId, activeTab]);

  function updateExercise(idx: number, field: keyof Exercise, value: string) {
    setExercises((prev) =>
      prev.map((ex, i) => {
        if (i !== idx) return ex;
        if (field === "sets" || field === "reps") {
          const num = parseInt(value);
          return { ...ex, [field]: isNaN(num) ? undefined : num };
        }
        return { ...ex, [field]: value };
      })
    );
  }

  async function handleCreateLog(e: React.FormEvent) {
    e.preventDefault();
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/workout-logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exercises: validExercises,
          duration: duration ? parseInt(duration) : null,
          notes: logNotes.trim() || null,
        }),
      });
      const body = await res.json();
      const created = body?.data ?? body;
      if (created?.id) {
        setLogs((prev) => [created, ...prev]);
        setExercises([emptyExercise()]);
        setDuration("");
        setLogNotes("");
        setShowForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  const cardStyle = {
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.30)" : "0 4px 24px rgba(0,0,0,0.04)",
    background: dark ? "var(--surface)" : "white",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Nav */}
      <div className="flex gap-2 flex-wrap pb-4 border-b" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="rounded-full px-3 py-1.5 text-[11px] font-semibold border transition"
            style={{
              borderColor: activeTab === tab ? rgbaBrand(0.22) : dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              boxShadow: activeTab === tab ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
              background: activeTab === tab ? (dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)") : (dark ? "rgba(255,255,255,0.02)" : "white"),
              color: activeTab === tab ? (dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)") : (dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)"),
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pt-5">
        {/* ── OVERVIEW ── */}
        {activeTab === "Overview" && (
          <div className="rounded-3xl border p-4" style={cardStyle}>
            <div className="text-sm font-semibold mb-3" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
              Workout Details
            </div>
            {eventMeta && (
              <div className="text-sm mb-4" style={{ color: dark ? "rgba(240,240,240,0.80)" : "rgba(0,0,0,0.80)" }}>{eventMeta}</div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(0,0,0,0.55)" }}>Time</span>
                <span style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                  {eventTime}{eventEndTime ? ` - ${eventEndTime}` : ""}
                </span>
              </div>
              {eventLocation && (
                <div className="flex justify-between">
                  <span style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(0,0,0,0.55)" }}>Location</span>
                  <span style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{eventLocation}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LOG ── */}
        {activeTab === "Log" && (
          <div className="space-y-3">
            <div className="rounded-3xl border p-4" style={cardStyle}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                  Workout Log
                </div>
                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="rounded-2xl px-3 py-1.5 text-xs font-semibold border transition"
                  style={{
                    borderColor: rgbaBrand(0.22),
                    background: dark ? "rgba(255,255,255,0.04)" : "white",
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                  }}
                >
                  {showForm ? "Cancel" : "+ Log"}
                </button>
              </div>

              {showForm && (
                <form onSubmit={handleCreateLog} className="mb-4 space-y-3">
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={ex.name}
                        onChange={(e) => updateExercise(idx, "name", e.target.value)}
                        placeholder="Exercise name"
                        className="flex-1 rounded-xl border px-2 py-1.5 text-xs outline-none"
                        style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                      />
                      <input
                        type="number"
                        value={ex.sets ?? ""}
                        onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                        placeholder="Sets"
                        min={1}
                        className="w-14 rounded-xl border px-2 py-1.5 text-xs outline-none"
                        style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                      />
                      <input
                        type="number"
                        value={ex.reps ?? ""}
                        onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                        placeholder="Reps"
                        min={1}
                        className="w-14 rounded-xl border px-2 py-1.5 text-xs outline-none"
                        style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                      />
                      <input
                        type="text"
                        value={ex.weight ?? ""}
                        onChange={(e) => updateExercise(idx, "weight", e.target.value)}
                        placeholder="Wt"
                        className="w-16 rounded-xl border px-2 py-1.5 text-xs outline-none"
                        style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                      />
                    </div>
                  ))}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
                      className="text-xs font-medium"
                      style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}
                    >
                      + Add exercise
                    </button>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Duration (min)"
                      min={1}
                      className="w-36 rounded-xl border px-2 py-1.5 text-xs outline-none"
                      style={{ borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)", background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)", color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creating || exercises.every((ex) => !ex.name.trim())}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold border transition"
                    style={{
                      borderColor: rgbaBrand(0.30),
                      background: rgbaBrand(0.10),
                      color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                      opacity: creating ? 0.6 : 1,
                    }}
                  >
                    {creating ? "Saving…" : "Save Log"}
                  </button>
                </form>
              )}

              {loadingLogs ? (
                <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Loading…</div>
              ) : logs.length === 0 ? (
                <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>
                  No workout logs yet. Track your sets, reps, and weight here.
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border px-3 py-3"
                      style={{ borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)", background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)" }}
                    >
                      <div className="text-xs mb-2" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                        {new Date(log.createdAt).toLocaleDateString()} {log.duration ? `· ${log.duration} min` : ""}
                      </div>
                      <div className="space-y-1">
                        {(log.exercises as Exercise[]).map((ex, idx) => (
                          <div key={idx} className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                            <span className="font-semibold">{ex.name}</span>
                            {ex.sets && ex.reps && (
                              <span style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>
                                {" "}· {ex.sets}×{ex.reps}{ex.weight ? ` @ ${ex.weight}` : ""}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      {log.notes && (
                        <div className="mt-2 text-xs" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>
                          {log.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NOTES ── */}
        {activeTab === "Notes" && (
          <div className="rounded-3xl border p-4" style={cardStyle}>
            <div className="text-sm font-semibold mb-4" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Notes</div>
            <NotesEditor eventId={eventId} dark={dark} />
          </div>
        )}

        {/* ── FILES ── */}
        {activeTab === "Files" && (
          <div className="rounded-3xl border p-4" style={cardStyle}>
            <div className="text-sm font-semibold mb-4" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Files & Attachments</div>
            {loadingFiles ? (
              <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Loading…</div>
            ) : (
              <FilesPanel files={files} dark={dark} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
