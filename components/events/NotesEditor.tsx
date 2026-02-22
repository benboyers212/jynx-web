"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";

type NotesEditorProps = {
  eventId: string;
  dark?: boolean;
};

export function NotesEditor({ eventId, dark = false }: NotesEditorProps) {
  const [content, setContent] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const debouncedContent = useDebounce(content, 600);

  // Track the last value that was actually persisted so we don't save identical content
  const persistedContentRef = useRef<string>("");
  // Use ref for noteId to avoid any re-renders when noteId changes
  const noteIdRef = useRef<string | null>(null);

  // Load the most recent note for this event on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingInitial(true);

    fetch(`/api/events/${eventId}/notes`)
      .then((r) => r.json())
      .then((res) => {
        if (cancelled) return;
        // Expect array from the GET endpoint (most recent first)
        const notes: any[] = Array.isArray(res) ? res : res?.data ?? [];
        if (notes.length > 0) {
          const latest = notes[0];
          setContent(latest.content ?? "");
          noteIdRef.current = latest.id;
          persistedContentRef.current = latest.content ?? "";
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load notes.");
      })
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });

    return () => { cancelled = true; };
  }, [eventId]);

  // Auto-save on debounced content change
  const saveNote = useCallback(async (text: string) => {
    if (text === persistedContentRef.current) return; // no change
    if (!text.trim() && !noteIdRef.current) return; // don't create empty notes

    setSaving(true);
    setError(null);

    try {
      if (noteIdRef.current) {
        // PATCH existing note
        const res = await fetch(`/api/events/${eventId}/notes/${noteIdRef.current}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        if (!res.ok) throw new Error("Failed to save");
      } else {
        // POST new note (skip matching to avoid disambiguation loop)
        const res = await fetch(`/api/events/${eventId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, skipMatching: true }),
        });
        if (!res.ok) throw new Error("Failed to save");
        const body = await res.json();

        // Check if disambiguation is needed (shouldn't happen with skipMatching, but handle it)
        if (body.needsDisambiguation) {
          // This shouldn't happen with skipMatching: true, but handle gracefully
          throw new Error("Unexpected disambiguation response");
        } else {
          // Normal response
          const created = body?.data ?? body;
          if (created?.id) {
            noteIdRef.current = created.id;
          }
        }
      }

      persistedContentRef.current = text;
      setSavedAt(new Date());
    } catch {
      setError("Failed to save — retrying on next change.");
    } finally {
      setSaving(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!loadingInitial) {
      saveNote(debouncedContent);
    }
  }, [debouncedContent, loadingInitial, saveNote]);

  const statusText = () => {
    if (loadingInitial) return "Loading...";
    if (saving) return "Saving...";
    if (error) return error;
    if (savedAt) return `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    return "Auto-saves as you type";
  };

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={loadingInitial ? "Loading notes…" : "Add notes for this event…"}
        disabled={loadingInitial}
        className="w-full rounded-2xl border px-3 py-3 text-sm outline-none placeholder:text-neutral-400 resize-none focus:ring-2 focus:ring-black/[0.06] transition"
        style={{
          borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
          background: dark ? "rgba(255,255,255,0.03)" : "white",
          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
          minHeight: "120px",
          opacity: loadingInitial ? 0.5 : 1,
        }}
      />
      <div className="flex items-center justify-between">
        <div
          className="text-[11px]"
          style={{
            color: error
              ? "rgba(239,68,68,0.80)"
              : dark
              ? "rgba(240,240,240,0.50)"
              : "rgba(0,0,0,0.50)",
          }}
        >
          {statusText()}
        </div>
        <div
          className="text-[11px]"
          style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}
        >
          {content.length} characters
        </div>
      </div>
    </div>
  );
}
