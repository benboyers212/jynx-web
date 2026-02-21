"use client";

import { useState } from "react";

const OLIVE = "#4b5e3c";

type CompletionModalProps = {
  eventId: string;
  eventTitle: string;
  scheduledDuration: number; // minutes
  onClose: () => void;
  onSubmit: (data: {
    variance: "just_right" | "shorter" | "longer";
    actualDuration?: number;
    notes?: string;
  }) => Promise<void>;
};

export function CompletionModal({
  eventId,
  eventTitle,
  scheduledDuration,
  onClose,
  onSubmit,
}: CompletionModalProps) {
  const [mode, setMode] = useState<"choose" | "custom">("choose");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [variance, setVariance] = useState<"shorter" | "longer">("shorter");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scheduledHours = Math.floor(scheduledDuration / 60);
  const scheduledMinutes = scheduledDuration % 60;

  const handleJustRight = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        variance: "just_right",
        actualDuration: scheduledDuration,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to submit completion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async () => {
    const actualDuration = hours * 60 + minutes;
    if (actualDuration === 0) {
      alert("Please enter a duration");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        variance,
        actualDuration,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to submit completion:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const border = "rgba(0,0,0,0.10)";
  const borderStrong = "rgba(0,0,0,0.14)";
  const surface = "var(--surface)";
  const bg = "var(--background)";
  const fg = "var(--foreground)";
  const muted = "var(--muted-foreground)";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity z-[60]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[70] rounded-3xl border shadow-2xl"
        style={{ background: bg, borderColor: borderStrong }}
      >
        <div className="px-6 py-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: fg }}>
                Mark Complete
              </h2>
              <p className="text-sm mt-1" style={{ color: muted }}>
                {eventTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition hover:bg-black/[0.06]"
              style={{ color: muted }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Scheduled Duration */}
          <div
            className="rounded-2xl border px-4 py-3 mb-5"
            style={{
              borderColor: border,
              background: "rgba(255,255,255,0.70)",
            }}
          >
            <div className="text-xs font-medium mb-1" style={{ color: muted }}>
              Scheduled Duration
            </div>
            <div className="text-sm font-semibold" style={{ color: fg }}>
              {scheduledHours > 0 && `${scheduledHours}h `}
              {scheduledMinutes}min
            </div>
          </div>

          {/* Question */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: fg }}>
              How long did this take?
            </h3>

            {mode === "choose" ? (
              <div className="space-y-2">
                <button
                  onClick={handleJustRight}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition text-left"
                  style={{
                    borderColor: "rgba(75,94,60,0.30)",
                    background: "rgba(75,94,60,0.10)",
                    color: "rgba(17,17,17,0.92)",
                    boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
                  }}
                >
                  {isSubmitting ? "Submitting..." : "Just right"}
                </button>
                <button
                  onClick={() => setMode("custom")}
                  className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition text-left"
                  style={{
                    borderColor: border,
                    background: "rgba(0,0,0,0.02)",
                    color: "rgba(17,17,17,0.92)",
                  }}
                >
                  Custom duration
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Duration Picker */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: muted }}>
                      Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={hours}
                      onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: border,
                        background: "rgba(255,255,255,0.80)",
                        color: fg,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs mb-1 block" style={{ color: muted }}>
                      Minutes
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes}
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style={{
                        borderColor: border,
                        background: "rgba(255,255,255,0.80)",
                        color: fg,
                      }}
                    />
                  </div>
                </div>

                {/* Variance Toggle */}
                <div>
                  <label className="text-xs mb-2 block" style={{ color: muted }}>
                    Compared to scheduled time
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVariance("shorter")}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition"
                      style={
                        variance === "shorter"
                          ? {
                              borderColor: "rgba(75,94,60,0.30)",
                              background: "rgba(75,94,60,0.10)",
                              color: "rgba(17,17,17,0.92)",
                              boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
                            }
                          : {
                              borderColor: border,
                              background: "rgba(0,0,0,0.02)",
                              color: "rgba(17,17,17,0.70)",
                            }
                      }
                    >
                      Shorter
                    </button>
                    <button
                      onClick={() => setVariance("longer")}
                      className="flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition"
                      style={
                        variance === "longer"
                          ? {
                              borderColor: "rgba(75,94,60,0.30)",
                              background: "rgba(75,94,60,0.10)",
                              color: "rgba(17,17,17,0.92)",
                              boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
                            }
                          : {
                              borderColor: border,
                              background: "rgba(0,0,0,0.02)",
                              color: "rgba(17,17,17,0.70)",
                            }
                      }
                    >
                      Longer
                    </button>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => setMode("choose")}
                  className="text-xs"
                  style={{ color: muted }}
                >
                  ← Back to options
                </button>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div className="mb-5">
            <label className="text-xs font-medium mb-2 block" style={{ color: muted }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any feedback for AI optimization..."
              rows={3}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none resize-none"
              style={{
                borderColor: border,
                background: "rgba(255,255,255,0.80)",
                color: fg,
              }}
            />
          </div>

          {/* Submit Button (for custom mode) */}
          {mode === "custom" && (
            <button
              onClick={handleCustomSubmit}
              disabled={isSubmitting}
              className="w-full rounded-2xl border px-4 py-3 text-sm font-semibold transition"
              style={{
                borderColor: "rgba(75,94,60,0.30)",
                background: "rgba(75,94,60,0.10)",
                color: "rgba(17,17,17,0.92)",
                boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
