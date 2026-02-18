"use client";

import React, { useState, useEffect } from "react";
import { NotesEditor } from "./NotesEditor";
import { FilesPanel } from "./FilesPanel";

type Tab = "Overview" | "Tasks" | "Notes" | "Files";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: Date | null;
  completed: boolean;
  priority?: string | null;
  taskType: string;
};

type EventFile = {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  size?: number | null;
  createdAt: Date;
};

type WorkEventDetailProps = {
  eventId: string;
  eventTime: string;
  eventEndTime?: string;
  eventLocation?: string;
  eventMeta?: string;
  initialFiles?: EventFile[];
  dark?: boolean;
};

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

export function WorkEventDetail({
  eventId,
  eventTime,
  eventEndTime,
  eventLocation,
  eventMeta,
  initialFiles = [],
  dark = false,
}: WorkEventDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<EventFile[]>(initialFiles);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [creating, setCreating] = useState(false);

  const tabs: Tab[] = ["Overview", "Tasks", "Notes", "Files"];

  useEffect(() => {
    if (activeTab !== "Tasks") return;
    setLoadingTasks(true);
    fetch(`/api/tasks?eventId=${eventId}&taskType=task`)
      .then((r) => r.json())
      .then((res) => { setTasks(res?.data ?? res ?? []); })
      .catch(console.error)
      .finally(() => setLoadingTasks(false));
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

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          taskType: "task",
          eventId,
          dueDate: newDueDate || null,
        }),
      });
      const body = await res.json();
      const created = body?.data ?? body;
      if (created?.id) {
        setTasks((prev) => [created, ...prev]);
        setNewTitle("");
        setNewDueDate("");
        setShowNewForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(id: string, current: boolean) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !current } : t)));
    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !current }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: current } : t)));
    }
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(console.error);
  }

  const cardStyle = {
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.30)" : "0 4px 24px rgba(0,0,0,0.04)",
    background: dark ? "var(--surface)" : "white",
  };

  return (
    <div className="flex flex-col h-full">
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
            <div className="text-sm font-semibold mb-3" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Event Details</div>
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

        {/* ── TASKS ── */}
        {activeTab === "Tasks" && (
          <div className="rounded-3xl border p-4" style={cardStyle}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Tasks</div>
              <button
                onClick={() => setShowNewForm((v) => !v)}
                className="rounded-2xl px-3 py-1.5 text-xs font-semibold border transition"
                style={{
                  borderColor: rgbaBrand(0.22),
                  background: dark ? "rgba(255,255,255,0.04)" : "white",
                  color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                }}
              >
                {showNewForm ? "Cancel" : "+ Add"}
              </button>
            </div>

            {showNewForm && (
              <form onSubmit={handleCreate} className="mb-4 space-y-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Task title"
                  autoFocus
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                  }}
                />
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full rounded-xl border px-3 py-2 text-xs outline-none"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.10)",
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    color: dark ? "rgba(240,240,240,0.75)" : "rgba(0,0,0,0.75)",
                  }}
                />
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold border transition"
                  style={{
                    borderColor: rgbaBrand(0.30),
                    background: rgbaBrand(0.10),
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                    opacity: creating ? 0.6 : 1,
                  }}
                >
                  {creating ? "Adding…" : "Add Task"}
                </button>
              </form>
            )}

            {loadingTasks ? (
              <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Loading…</div>
            ) : tasks.length === 0 ? (
              <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>No tasks yet.</div>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border px-3 py-3 flex items-start gap-3"
                    style={{
                      borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                      background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
                      opacity: t.completed ? 0.6 : 1,
                    }}
                  >
                    <button
                      onClick={() => handleToggle(t.id, t.completed)}
                      className="mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition"
                      style={{
                        borderColor: t.completed ? rgbaBrand(0.50) : (dark ? "rgba(255,255,255,0.20)" : "rgba(0,0,0,0.20)"),
                        background: t.completed ? rgbaBrand(0.15) : "transparent",
                      }}
                    >
                      {t.completed && (
                        <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                          <path d="M1 3.5L3.5 6L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ color: dark ? "rgba(240,240,240,0.80)" : "rgba(0,0,0,0.70)" }} />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div
                        className="text-sm font-semibold"
                        style={{
                          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                          textDecoration: t.completed ? "line-through" : "none",
                        }}
                      >
                        {t.title}
                      </div>
                      {t.dueDate && (
                        <div className="mt-0.5 text-xs" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                          Due: {new Date(t.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="text-[10px] opacity-30 hover:opacity-70 transition shrink-0"
                      style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
