"use client";

import React, { useState } from "react";
import { ClassEventDetail } from "./ClassEventDetail";
import { WorkoutEventDetail } from "./WorkoutEventDetail";
import { WorkEventDetail } from "./WorkEventDetail";
import { CompletionModal } from "../CompletionModal";

type EventType = "class" | "work" | "health" | "meeting" | "prep" | "study" | "life" | "free";

type EventData = {
  id: string;
  type: EventType;
  title: string;
  meta?: string;
  time: string;
  endTime?: string;
  startAt?: Date;
  endAt?: Date;
  location?: string;
  tag?: string;
  // Pre-loaded event bundle (from /api/events/[id])
  assignments?: Array<{
    id: string;
    title: string;
    description?: string | null;
    dueDate?: Date | null;
    points?: number | null;
    completed: boolean;
    priority?: string | null;
  }>;
  workoutLogs?: Array<{
    id: string;
    exercises: Array<{ name: string; sets?: number; reps?: number; weight?: string }>;
    duration?: number | null;
    notes?: string | null;
    createdAt: Date;
  }>;
  files?: Array<{
    id: string;
    name: string;
    type: string;
    url?: string | null;
    size?: number | null;
    createdAt: Date;
  }>;
};

type EventDetailModalProps = {
  event: EventData;
  dark?: boolean;
  onClose: () => void;
  onDrop?: () => void;
};

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

function getEventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    class: "Class",
    work: "Work",
    health: "Workout",
    meeting: "Meeting",
    prep: "Prep",
    study: "Study",
    life: "Life",
    free: "Free Time",
  };
  return labels[type] || type;
}

function getEventTypeColor(type: EventType): string {
  const colors: Record<EventType, string> = {
    class: rgbaBrand(0.12),
    work: "rgba(59, 130, 246, 0.12)",
    health: "rgba(239, 68, 68, 0.12)",
    meeting: "rgba(168, 85, 247, 0.12)",
    prep: "rgba(245, 158, 11, 0.12)",
    study: "rgba(34, 197, 94, 0.12)",
    life: "rgba(236, 72, 153, 0.12)",
    free: "rgba(148, 163, 184, 0.12)",
  };
  return colors[type] || rgbaBrand(0.12);
}

export function EventDetailModal({ event, dark = false, onClose, onDrop }: EventDetailModalProps) {
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const adjustW = "min(840px, calc(100vw - 48px))";
  const adjustH = "min(680px, calc(100vh - 48px))";

  // Calculate scheduled duration in minutes
  const scheduledDuration = event.startAt && event.endAt
    ? Math.round((new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / (1000 * 60))
    : 60; // Default to 60 minutes if not available

  const handleComplete = async (data: {
    variance: "just_right" | "shorter" | "longer";
    actualDuration?: number;
    notes?: string;
  }) => {
    try {
      const res = await fetch(`/api/events/${event.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to mark complete");
      }

      // Success - could show a toast or just close
      setShowCompletionModal(false);
    } catch (error) {
      console.error("Error marking event complete:", error);
      alert("Failed to mark event complete");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <button
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-[60]"
        style={{ animation: "fadeIn 180ms ease-out" }}
        onClick={onClose}
        aria-label="Close event details"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 pointer-events-none">
        <div
          className="relative rounded-3xl border backdrop-blur overflow-hidden pointer-events-auto flex flex-col"
          style={{
            width: adjustW,
            height: adjustH,
            background: dark ? "rgba(26,26,26,0.92)" : "rgba(255,255,255,0.92)",
            borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
            boxShadow: dark ? "0 30px 120px rgba(0,0,0,0.50)" : "0 30px 120px rgba(0,0,0,0.18)",
            animation: "fadeScaleIn 220ms ease-out",
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b shrink-0" style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
            <div className="flex items-start gap-3">
              {/* Event type badge */}
              <div
                className="h-10 w-10 rounded-2xl border flex items-center justify-center text-[10px] font-semibold shrink-0"
                style={{
                  background: getEventTypeColor(event.type),
                  borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                  color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                }}
              >
                {getEventTypeLabel(event.type).slice(0, 3).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                  {event.title}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[11px] font-semibold border"
                    style={{
                      background: getEventTypeColor(event.type),
                      borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                      color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)",
                    }}
                  >
                    {getEventTypeLabel(event.type)}
                  </span>
                  {event.tag && event.tag !== getEventTypeLabel(event.type) && (
                    <span className="text-xs" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                      · {event.tag}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCompletionModal(true)}
                  className="rounded-xl px-3 py-1 text-xs font-semibold border transition"
                  style={{
                    borderColor: "rgba(75,94,60,0.30)",
                    background: "rgba(75,94,60,0.10)",
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.92)",
                    boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
                  }}
                >
                  Complete
                </button>
                {onDrop && (
                  <button
                    onClick={onDrop}
                    className="rounded-xl px-3 py-1 text-xs font-semibold border transition"
                    style={{
                      borderColor: "rgba(220,38,38,0.25)",
                      background: "rgba(220,38,38,0.07)",
                      color: dark ? "rgba(252,165,165,0.90)" : "rgba(185,28,28,0.90)",
                    }}
                  >
                    Drop
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="rounded-xl px-2 py-1 text-xs border transition"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                    background: dark ? "rgba(255,255,255,0.04)" : "white",
                    color: dark ? "rgba(240,240,240,0.85)" : "rgba(0,0,0,0.85)",
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Body — route to type-specific component */}
          <div className="flex-1 overflow-hidden px-5 py-5">
            {event.type === "class" && (
              <ClassEventDetail
                eventId={event.id}
                eventTitle={event.title}
                eventTime={event.time}
                eventEndTime={event.endTime}
                eventLocation={event.location}
                eventMeta={event.meta}
                initialAssignments={event.assignments || []}
                initialFiles={event.files || []}
                dark={dark}
              />
            )}

            {event.type === "health" && (
              <WorkoutEventDetail
                eventId={event.id}
                eventTime={event.time}
                eventEndTime={event.endTime}
                eventLocation={event.location}
                eventMeta={event.meta}
                initialWorkoutLogs={event.workoutLogs || []}
                initialFiles={event.files || []}
                dark={dark}
              />
            )}

            {(event.type === "work" || event.type === "meeting") && (
              <WorkEventDetail
                eventId={event.id}
                eventTime={event.time}
                eventEndTime={event.endTime}
                eventLocation={event.location}
                eventMeta={event.meta}
                initialFiles={event.files || []}
                dark={dark}
              />
            )}

            {/* Fallback for prep / study / life / free */}
            {!["class", "health", "work", "meeting"].includes(event.type) && (
              <WorkEventDetail
                eventId={event.id}
                eventTime={event.time}
                eventEndTime={event.endTime}
                eventLocation={event.location}
                eventMeta={event.meta}
                initialFiles={event.files || []}
                dark={dark}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Completion Modal */}
      {showCompletionModal && (
        <CompletionModal
          eventId={event.id}
          eventTitle={event.title}
          scheduledDuration={scheduledDuration}
          onClose={() => setShowCompletionModal(false)}
          onSubmit={handleComplete}
        />
      )}
    </>
  );
}
