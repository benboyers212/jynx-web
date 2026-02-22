"use client";

import { useState, useEffect } from "react";
import { FileText, Sparkles, Maximize2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

type Note = {
  id: string;
  title?: string | null;
  content: string;
  createdAt: Date;
};

type NoteViewerProps = {
  note: Note;
  eventId: string;
  onClose: () => void;
  onEdit: () => void;
  dark?: boolean;
  initialMode?: "read" | "summary";
};

export function NoteViewer({ note, eventId, onClose, onEdit, dark = false, initialMode = "read" }: NoteViewerProps) {
  const [mode, setMode] = useState<"read" | "summary">(initialMode);
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-generate summary if initialMode is "summary"
  useEffect(() => {
    if (initialMode === "summary" && !summary && !loadingSummary) {
      setLoadingSummary(true);
      setSummaryError(null);

      fetch(`/api/notes/${note.id}/summary`, {
        method: "POST",
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to generate summary");
          }
          return data;
        })
        .then((data) => {
          setSummary(data.summary || "No summary available");
        })
        .catch((error) => {
          console.error("Failed to generate summary:", error);
          setSummaryError(error.message || "Failed to generate summary. Please try again.");
        })
        .finally(() => {
          setLoadingSummary(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGetSummary() {
    setMode("summary");
    if (summary) return; // Already loaded

    setLoadingSummary(true);
    setSummaryError(null);

    try {
      const res = await fetch(`/api/notes/${note.id}/summary`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate summary");
      }

      setSummary(data.summary || "No summary available");
    } catch (error) {
      console.error("Failed to generate summary:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to generate summary. Please try again.";
      setSummaryError(errorMsg);
    } finally {
      setLoadingSummary(false);
    }
  }

  const border = "rgba(0,0,0,0.10)";
  const bg = dark ? "rgba(26,26,26,0.95)" : "rgba(255,255,255,0.95)";
  const fg = dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)";
  const muted = dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.50)";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
        onClick={onClose}
      />

      {/* Viewer Modal */}
      <div
        className={`fixed z-[90] border shadow-2xl flex flex-col transition-all ${
          isExpanded ? "inset-0 rounded-none" : "inset-4 md:inset-8 rounded-3xl"
        }`}
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
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-lg font-semibold" style={{ color: fg }}>
                {note.title || "Untitled Note"}
              </h2>
              <div className="text-xs mt-1" style={{ color: muted }}>
                {new Date(note.createdAt).toLocaleDateString([], {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onEdit}
                className="rounded-2xl px-4 py-2 text-xs font-semibold border transition"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                  background: dark ? "rgba(255,255,255,0.04)" : "white",
                  color: fg,
                }}
              >
                Edit
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition hover:bg-black/[0.06]"
                style={{ color: muted }}
                aria-label={isExpanded ? "Exit fullscreen" : "Fullscreen"}
                title={isExpanded ? "Exit fullscreen" : "Fullscreen"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>

              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition hover:bg-black/[0.06]"
                style={{ color: muted }}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setMode("read")}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition"
              style={{
                borderColor: mode === "read" ? rgbaBrand(0.22) : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                background: mode === "read" ? rgbaBrand(0.10) : (dark ? "rgba(255,255,255,0.02)" : "white"),
                color: mode === "read" ? fg : muted,
                boxShadow: mode === "read" ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
              }}
            >
              <FileText size={14} />
              Read Document
            </button>
            <button
              onClick={handleGetSummary}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border transition"
              style={{
                borderColor: mode === "summary" ? rgbaBrand(0.22) : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                background: mode === "summary" ? rgbaBrand(0.10) : (dark ? "rgba(255,255,255,0.02)" : "white"),
                color: mode === "summary" ? fg : muted,
                boxShadow: mode === "summary" ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
              }}
            >
              <Sparkles size={14} />
              AI Summary
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {mode === "read" ? (
            <div
              className="prose prose-sm max-w-none"
              style={{ color: fg }}
              dangerouslySetInnerHTML={{ __html: note.content }}
            />
          ) : (
            <div>
              {loadingSummary ? (
                <div className="flex items-center gap-3 py-8">
                  <div
                    className="h-10 w-10 rounded-full border flex items-center justify-center animate-pulse"
                    style={{
                      borderColor: rgbaBrand(0.22),
                      background: rgbaBrand(0.10),
                      color: fg,
                    }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: fg }}>
                      Generating summary...
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: muted }}>
                      AI is analyzing your note
                    </div>
                  </div>
                </div>
              ) : summaryError ? (
                <div
                  className="rounded-2xl border px-4 py-4"
                  style={{
                    borderColor: "rgba(239,68,68,0.25)",
                    background: "rgba(239,68,68,0.08)",
                  }}
                >
                  <div className="text-sm" style={{ color: "rgba(127,29,29,0.95)" }}>
                    {summaryError}
                  </div>
                </div>
              ) : summary ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="h-8 w-8 rounded-full border flex items-center justify-center"
                      style={{
                        borderColor: rgbaBrand(0.22),
                        background: rgbaBrand(0.10),
                        color: fg,
                      }}
                    >
                      <Sparkles size={16} />
                    </div>
                    <div className="text-sm font-semibold" style={{ color: fg }}>
                      AI Summary
                    </div>
                  </div>
                  <div
                    className="prose prose-sm max-w-none markdown-summary"
                    style={{ color: fg }}
                  >
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Prose Styles */}
      <style jsx global>{`
        .prose h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .prose h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .prose ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .prose ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .prose li {
          margin: 0.25rem 0;
          display: list-item;
        }
        .prose p {
          margin: 0.5rem 0;
        }
        .prose strong {
          font-weight: 700;
        }
        .prose em {
          font-style: italic;
        }

        /* AI Summary Markdown Styles */
        .markdown-summary h2 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 1.75rem;
          margin-bottom: 1rem;
          letter-spacing: -0.01em;
          line-height: 1.4;
        }
        .markdown-summary h2:first-child {
          margin-top: 0;
        }
        .markdown-summary ul {
          list-style-type: none;
          padding-left: 0;
          margin: 0.5rem 0 1.5rem 0;
        }
        .markdown-summary li {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
          position: relative;
          line-height: 1.6;
          display: block;
        }
        .markdown-summary li:before {
          content: "•";
          position: absolute;
          left: 0;
          opacity: 0.5;
        }
        .markdown-summary p {
          margin: 0.5rem 0;
          line-height: 1.6;
        }
      `}</style>
    </>
  );
}
