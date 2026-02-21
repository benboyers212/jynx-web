"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3 } from "lucide-react";

const OLIVE = "#4b5e3c";

type RichNoteEditorProps = {
  eventId: string;
  eventTitle: string;
  initialContent?: string;
  initialTitle?: string;
  noteId?: string | null;
  onClose: () => void;
  onSave: (title: string, content: string) => Promise<void>;
  dark?: boolean;
};

export function RichNoteEditor({
  eventId,
  eventTitle,
  initialContent = "",
  initialTitle = "",
  noteId,
  onClose,
  onSave,
  dark = false,
}: RichNoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const lastSavedContentRef = useRef(initialContent);
  const lastSavedTitleRef = useRef(initialTitle);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4",
        style: `color: ${dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)"}`,
      },
    },
  });

  // Auto-save every 3 seconds if there are changes
  useEffect(() => {
    const interval = setInterval(() => {
      handleSave();
    }, 3000);

    return () => clearInterval(interval);
  }, [handleSave]);

  const handleSave = useCallback(async () => {
    if (!editor || !title.trim()) return;

    const content = editor.getHTML();

    // Only save if content or title has changed
    if (content === lastSavedContentRef.current && title === lastSavedTitleRef.current) {
      return;
    }

    setSaving(true);
    try {
      await onSave(title, content);
      lastSavedContentRef.current = content;
      lastSavedTitleRef.current = title;
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  }, [editor, title, onSave]);

  const handleDone = async () => {
    await handleSave();
    onClose();
  };

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

      {/* Editor Modal */}
      <div
        className="fixed inset-4 md:inset-8 z-[90] rounded-3xl border shadow-2xl flex flex-col"
        style={{
          background: bg,
          borderColor: border,
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: border }}
        >
          <div className="flex-1 mr-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full text-lg font-semibold bg-transparent outline-none"
              style={{ color: fg }}
              autoFocus
            />
            <div className="text-xs mt-1" style={{ color: muted }}>
              {eventTitle}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Save status */}
            <div className="text-xs" style={{ color: muted }}>
              {saving
                ? "Saving..."
                : lastSaved
                ? `Saved ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Not saved"}
            </div>

            <button
              onClick={handleDone}
              className="rounded-2xl px-4 py-2 text-xs font-semibold border transition"
              style={{
                borderColor: "rgba(75,94,60,0.30)",
                background: "rgba(75,94,60,0.10)",
                color: fg,
                boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
              }}
            >
              Done
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

        {/* Toolbar */}
        {editor && (
          <div
            className="shrink-0 px-6 py-3 border-b flex items-center gap-2 flex-wrap"
            style={{ borderColor: border }}
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                editor.isActive("bold") ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Bold"
            >
              <Bold size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                editor.isActive("italic") ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Italic"
            >
              <Italic size={16} />
            </button>

            <div
              className="w-[1px] h-6 mx-1"
              style={{ background: border }}
            />

            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`h-8 px-2 rounded-lg flex items-center justify-center transition text-sm font-semibold ${
                editor.isActive("heading", { level: 1 }) ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`h-8 px-2 rounded-lg flex items-center justify-center transition text-sm font-semibold ${
                editor.isActive("heading", { level: 2 }) ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`h-8 px-2 rounded-lg flex items-center justify-center transition text-sm font-semibold ${
                editor.isActive("heading", { level: 3 }) ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Heading 3"
            >
              H3
            </button>

            <div
              className="w-[1px] h-6 mx-1"
              style={{ background: border }}
            />

            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                editor.isActive("bulletList") ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Bullet List"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition ${
                editor.isActive("orderedList") ? "bg-black/[0.08]" : "hover:bg-black/[0.04]"
              }`}
              style={{ color: fg }}
              aria-label="Numbered List"
            >
              <ListOrdered size={16} />
            </button>
          </div>
        )}

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: ${muted};
          pointer-events: none;
          height: 0;
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror strong {
          font-weight: 700;
        }
        .ProseMirror em {
          font-style: italic;
        }
      `}</style>
    </>
  );
}
