"use client";

import { FileText, Building2, Dumbbell, Plus } from "lucide-react";

type EventMatch = {
  id: string;
  title: string;
  type: "scheduleBlock" | "classHub" | "workoutHub";
  confidence: "high" | "medium" | "low";
  reason: string;
};

type EventDisambiguationModalProps = {
  title: string;
  context?: string;
  matches: EventMatch[];
  suggestedMatch?: EventMatch;
  onSelect: (matchId: string | null, matchType: string | null) => void;
  onCancel: () => void;
  dark?: boolean;
};

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

export function EventDisambiguationModal({
  title,
  context,
  matches,
  suggestedMatch,
  onSelect,
  onCancel,
  dark = false,
}: EventDisambiguationModalProps) {
  const border = "rgba(0,0,0,0.10)";
  const bg = dark ? "rgba(26,26,26,0.95)" : "rgba(255,255,255,0.95)";
  const fg = dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)";
  const muted = dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.50)";

  const getIcon = (type: string) => {
    switch (type) {
      case "classHub":
        return <Building2 size={16} />;
      case "workoutHub":
        return <Dumbbell size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "classHub":
        return "Class";
      case "workoutHub":
        return "Workout";
      case "scheduleBlock":
        return "Event";
      default:
        return "Event";
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return rgbaBrand(1);
      case "medium":
        return "rgba(234, 179, 8, 0.8)"; // yellow
      case "low":
        return "rgba(239, 68, 68, 0.8)"; // red
      default:
        return muted;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-[90] rounded-3xl border shadow-2xl flex flex-col max-h-[90vh]"
        style={{
          background: bg,
          borderColor: border,
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-6 py-4 border-b"
          style={{ borderColor: border }}
        >
          <h2 className="text-lg font-semibold" style={{ color: fg }}>
            Which event does this belong to?
          </h2>
          <div className="text-sm mt-1" style={{ color: muted }}>
            <span className="font-medium" style={{ color: fg }}>
              "{title}"
            </span>
            {context && <span className="ml-2">• {context}</span>}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {/* Existing matches */}
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => onSelect(match.id, match.type)}
                className="w-full rounded-2xl border px-4 py-3 flex items-start gap-3 transition hover:bg-black/[0.02] text-left"
                style={{
                  borderColor:
                    suggestedMatch?.id === match.id
                      ? rgbaBrand(0.22)
                      : dark
                      ? "rgba(255,255,255,0.10)"
                      : "rgba(0,0,0,0.08)",
                  background:
                    suggestedMatch?.id === match.id
                      ? rgbaBrand(0.08)
                      : dark
                      ? "rgba(255,255,255,0.03)"
                      : "white",
                  boxShadow:
                    suggestedMatch?.id === match.id
                      ? `0 0 0 1px ${rgbaBrand(0.12)}`
                      : undefined,
                }}
              >
                <div
                  className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
                  style={{
                    borderColor:
                      suggestedMatch?.id === match.id
                        ? rgbaBrand(0.22)
                        : dark
                        ? "rgba(255,255,255,0.10)"
                        : "rgba(0,0,0,0.08)",
                    background:
                      suggestedMatch?.id === match.id
                        ? rgbaBrand(0.10)
                        : dark
                        ? "rgba(255,255,255,0.04)"
                        : "rgba(0,0,0,0.02)",
                    color: fg,
                  }}
                >
                  {getIcon(match.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="text-sm font-semibold truncate"
                      style={{ color: fg }}
                    >
                      {match.title}
                    </div>
                    {suggestedMatch?.id === match.id && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0"
                        style={{
                          borderColor: rgbaBrand(0.22),
                          background: rgbaBrand(0.10),
                          color: fg,
                        }}
                      >
                        Suggested
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                      style={{
                        borderColor: dark
                          ? "rgba(255,255,255,0.10)"
                          : "rgba(0,0,0,0.08)",
                        background: dark
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(0,0,0,0.02)",
                        color: muted,
                      }}
                    >
                      {getTypeLabel(match.type)}
                    </span>
                    <span
                      className="text-xs"
                      style={{ color: getConfidenceColor(match.confidence) }}
                    >
                      {match.confidence} confidence
                    </span>
                  </div>
                  <div className="text-xs mt-1" style={{ color: muted }}>
                    {match.reason}
                  </div>
                </div>
              </button>
            ))}

            {/* Create new option */}
            <button
              onClick={() => onSelect(null, null)}
              className="w-full rounded-2xl border px-4 py-3 flex items-center gap-3 transition hover:bg-black/[0.02]"
              style={{
                borderColor: dark
                  ? "rgba(255,255,255,0.10)"
                  : "rgba(0,0,0,0.08)",
                background: dark ? "rgba(255,255,255,0.03)" : "white",
              }}
            >
              <div
                className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
                style={{
                  borderColor: dark
                    ? "rgba(255,255,255,0.10)"
                    : "rgba(0,0,0,0.08)",
                  background: dark
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(0,0,0,0.02)",
                  color: fg,
                }}
              >
                <Plus size={18} />
              </div>
              <div className="text-sm font-semibold" style={{ color: fg }}>
                Create new event/class
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-6 py-4 border-t flex justify-end"
          style={{ borderColor: border }}
        >
          <button
            onClick={onCancel}
            className="rounded-2xl px-4 py-2 text-xs font-semibold border transition"
            style={{
              borderColor: dark
                ? "rgba(255,255,255,0.10)"
                : "rgba(0,0,0,0.08)",
              background: dark ? "rgba(255,255,255,0.04)" : "white",
              color: fg,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
