"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, List, ListOrdered, Maximize2, Minimize2 } from "lucide-react";

const OLIVE = "#4b5e3c";

type RichNoteEditorProps = {
  eventId: string;
  eventTitle: string;
  initialContent?: string;
  initialTitle?: string;
  noteId?: string | null;
  onClose: () => void;
  onSave: (title: string, content: string, classHubId?: string | null) => Promise<void>;
  dark?: boolean;
  noBackdrop?: boolean; // For when used inside another modal
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
  noBackdrop = false,
}: RichNoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs to track what's been saved and prevent duplicate saves
  const lastSavedContentRef = useRef(initialContent);
  const lastSavedTitleRef = useRef(initialTitle);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your note...",
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] px-6 py-4",
        style: `color: ${dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)"}`,
      },
    },
    onUpdate: () => {
      // Trigger debounced save when editor updates
      triggerAutoSave();
    },
  });

  // Trigger auto-save with debounce
  const triggerAutoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);
  };

  // Also trigger save when title changes
  useEffect(() => {
    triggerAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);

  // Perform the actual save
  const performAutoSave = async () => {
    if (isSavingRef.current || !editor) return;

    const currentTitle = title;
    const currentContent = editor.getHTML();

    // Don't save if nothing changed or title is empty
    if (!currentTitle.trim()) return;
    if (currentContent === lastSavedContentRef.current && currentTitle === lastSavedTitleRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaving(true);

    try {
      await onSave(currentTitle, currentContent);
      lastSavedContentRef.current = currentContent;
      lastSavedTitleRef.current = currentTitle;
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
      isSavingRef.current = false;
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleDone = async () => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Save current state before closing
    if (title.trim() && editor) {
      const content = editor.getHTML();
      if (content !== lastSavedContentRef.current || title !== lastSavedTitleRef.current) {
        setSaving(true);
        try {
          await onSave(title, content);
        } catch (error) {
          console.error("Failed to save note:", error);
        } finally {
          setSaving(false);
        }
      }
    }
    onClose();
  };

  const border = "rgba(0,0,0,0.10)";
  const bg = dark ? "rgba(26,26,26,0.95)" : "rgba(255,255,255,0.95)";
  const fg = dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)";
  const muted = dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.50)";

  // Use portal to render outside any parent transforms (fixes fullscreen in nested modals)
  const modalContent = (
    <>
      {/* Backdrop - only render if not inside another modal */}
      {!noBackdrop && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
          onClick={onClose}
        />
      )}

      {/* Editor Modal */}
      <div
        className={`fixed ${noBackdrop ? 'z-[100]' : 'z-[90]'} border shadow-2xl flex flex-col transition-all ${
          isFullscreen ? "inset-0 rounded-none" : "inset-4 md:inset-8 rounded-3xl"
        }`}
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
            {eventTitle && (
              <div className="text-xs mt-1" style={{ color: muted }}>
                {eventTitle}
              </div>
            )}
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
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition hover:bg-black/[0.06]"
              style={{ color: muted }}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

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
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin: 0.75rem 0;
        }
        .ProseMirror li {
          margin: 0.25rem 0;
          display: list-item;
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

  // Render via portal to escape any parent transforms
  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
