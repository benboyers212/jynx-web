"use client";

import { useState, useEffect } from "react";
import { RichNoteEditor } from "./RichNoteEditor";
import { NoteViewer } from "./NoteViewer";
import { FileText, Plus } from "lucide-react";

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

type Note = {
  id: string;
  title?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

type NotesListProps = {
  eventId: string;
  eventTitle: string;
  dark?: boolean;
};

export function NotesList({ eventId, eventTitle, dark = false }: NotesListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    loadNotes();
  }, [eventId]);

  async function loadNotes() {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/notes`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      const notesList = Array.isArray(data) ? data : data?.data ?? [];
      setNotes(notesList);
    } catch (error) {
      console.error("Failed to load notes:", error);
      setNotes([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveNote(title: string, content: string) {
    try {
      if (editingNote) {
        // Update existing note
        const res = await fetch(`/api/events/${eventId}/notes/${editingNote.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!res.ok) throw new Error("Failed to update note");
      } else {
        // Create new note
        const res = await fetch(`/api/events/${eventId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!res.ok) throw new Error("Failed to create note");
      }

      await loadNotes(); // Reload notes list
    } catch (error) {
      console.error("Failed to save note:", error);
      throw error;
    }
  }

  function handleCreateNew() {
    setEditingNote(null);
    setShowEditor(true);
  }

  function handleEditNote(note: Note) {
    setEditingNote(note);
    setShowEditor(true);
  }

  function handleViewNote(note: Note) {
    setViewingNote(note);
  }

  function handleCloseEditor() {
    setShowEditor(false);
    setEditingNote(null);
  }

  function handleCloseViewer() {
    setViewingNote(null);
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/events/${eventId}/notes/${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete note");
      await loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const cardStyle = {
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
    background: dark ? "rgba(255,255,255,0.03)" : "white",
  };

  if (loading) {
    return (
      <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
        Loading notes...
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Create New Note Button */}
        <button
          onClick={handleCreateNew}
          className="w-full rounded-2xl border px-4 py-3 flex items-center gap-3 transition hover:bg-black/[0.02]"
          style={{
            borderColor: rgbaBrand(0.22),
            background: dark ? "rgba(255,255,255,0.04)" : "white",
          }}
        >
          <div
            className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
            style={{
              borderColor: rgbaBrand(0.22),
              background: rgbaBrand(0.10),
              color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.92)",
            }}
          >
            <Plus size={18} />
          </div>
          <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.92)" }}>
            Create New Note
          </div>
        </button>

        {/* Notes List */}
        {notes.length === 0 ? (
          <div
            className="rounded-2xl border px-4 py-4 text-center"
            style={cardStyle}
          >
            <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>
              No notes yet.
            </div>
            <div className="text-xs mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
              Create your first note to get started.
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl border px-4 py-3"
              style={cardStyle}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
                    color: dark ? "rgba(240,240,240,0.70)" : "rgba(17,17,17,0.70)",
                  }}
                >
                  <FileText size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.92)" }}>
                    {note.title || "Untitled Note"}
                  </div>
                  <div className="text-xs mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.50)" }}>
                    {formatDate(note.createdAt)}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-[10px] opacity-30 hover:opacity-70 transition shrink-0"
                  style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)" }}
                  aria-label="Delete note"
                >
                  ✕
                </button>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleViewNote(note)}
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold border transition"
                  style={{
                    borderColor: rgbaBrand(0.22),
                    background: rgbaBrand(0.10),
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.92)",
                  }}
                >
                  Read Document
                </button>
                <button
                  onClick={() => handleViewNote(note)}
                  className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold border transition"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                    background: dark ? "rgba(255,255,255,0.04)" : "white",
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.92)",
                  }}
                >
                  AI Summary
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Rich Note Editor Modal */}
      {showEditor && (
        <RichNoteEditor
          eventId={eventId}
          eventTitle={eventTitle}
          initialContent={editingNote?.content || ""}
          initialTitle={editingNote?.title || ""}
          noteId={editingNote?.id || null}
          onClose={handleCloseEditor}
          onSave={handleSaveNote}
          dark={dark}
        />
      )}

      {/* Note Viewer Modal */}
      {viewingNote && (
        <NoteViewer
          note={viewingNote}
          eventId={eventId}
          onClose={handleCloseViewer}
          onEdit={() => {
            handleCloseViewer();
            handleEditNote(viewingNote);
          }}
          dark={dark}
        />
      )}
    </>
  );
}
