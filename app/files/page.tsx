"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../ThemeContext";
import { FileText, Folder, Download, Sparkles, Search, Plus, ChevronDown } from "lucide-react";
import { NoteViewer } from "@/components/notes/NoteViewer";
import { RichNoteEditor } from "@/components/notes/RichNoteEditor";

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

type FileItem = {
  id: string;
  name: string;
  type: string;
  category: string;
  createdAt: string;
  classHub?: {
    id: string;
    name: string;
    courseCode?: string;
  };
  note?: {
    id: string;
    title: string;
    content: string;
    createdAt: Date;
  };
};

type ClassGroup = {
  id: string | null;
  name: string;
  courseCode?: string;
  files: FileItem[];
};

export default function FilesPage() {
  const { dark } = useTheme();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingNote, setViewingNote] = useState<{ id: string; title: string; content: string; createdAt: Date } | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; title: string; content: string } | null>(null);
  const [viewMode, setViewMode] = useState<"read" | "summary">("read");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFolderSelectModal, setShowFolderSelectModal] = useState(false);
  const [selectedFolderForNewDoc, setSelectedFolderForNewDoc] = useState<string | null>(null);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newButtonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; right: number } | null>(null);
  const [availableFolders, setAvailableFolders] = useState<Array<{ id: string; name: string; courseCode?: string }>>([]);

  useEffect(() => {
    if (showNewMenu && newButtonRef.current) {
      const rect = newButtonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [showNewMenu]);

  useEffect(() => {
    // Load files
    fetch("/api/files")
      .then((r) => r.json())
      .then((res) => {
        const raw: any[] = res?.data ?? res ?? [];
        setFiles(raw.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type || "other",
          category: f.category || "Other",
          createdAt: f.createdAt,
          classHub: f.classHub ? {
            id: f.classHub.id,
            name: f.classHub.name,
            courseCode: f.classHub.courseCode,
          } : undefined,
          note: f.noteContent ? {
            id: f.noteContent.id,
            title: f.noteContent.title || f.name,
            content: f.noteContent.content,
            createdAt: new Date(f.createdAt),
          } : undefined,
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    // Load available folders/classHubs
    fetch("/api/class-hubs")
      .then((r) => r.json())
      .then((res) => {
        const hubs: any[] = res?.data ?? res ?? [];
        setAvailableFolders(hubs.map((h: any) => ({
          id: h.id,
          name: h.name,
          courseCode: h.courseCode,
        })));
      })
      .catch(console.error);
  }, []);

  // Filter files based on search and filters
  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = file.name.toLowerCase().includes(query);
        const matchesClass = file.classHub?.name.toLowerCase().includes(query);
        const matchesCategory = file.category.toLowerCase().includes(query);
        if (!matchesName && !matchesClass && !matchesCategory) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && file.category !== categoryFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== "all" && file.type !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [files, searchQuery, categoryFilter, typeFilter]);

  // Group files by class
  const classGroups: ClassGroup[] = [];
  const ungrouped: FileItem[] = [];

  filteredFiles.forEach((file) => {
    if (file.classHub) {
      let group = classGroups.find((g) => g.id === file.classHub!.id);
      if (!group) {
        group = {
          id: file.classHub.id,
          name: file.classHub.name,
          courseCode: file.classHub.courseCode,
          files: [],
        };
        classGroups.push(group);
      }
      group.files.push(file);
    } else {
      ungrouped.push(file);
    }
  });

  // Sort groups alphabetically
  classGroups.sort((a, b) => a.name.localeCompare(b.name));

  const handleViewNote = (note: { id: string; title: string; content: string; createdAt: Date }, mode: "read" | "summary") => {
    setViewingNote(note);
    setViewMode(mode);
  };

  const handleCreateNote = async (title: string, content: string) => {
    setCreating(true);
    try {
      // Create note with optional classHubId
      const noteRes = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          classHubId: selectedFolderForNewDoc,
        }),
      });

      if (!noteRes.ok) throw new Error("Failed to create note");

      // Refresh files list
      const refreshRes = await fetch("/api/files");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const raw: any[] = refreshData?.data ?? refreshData ?? [];
        setFiles(raw.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type || "other",
          category: f.category || "Other",
          createdAt: f.createdAt,
          classHub: f.classHub ? {
            id: f.classHub.id,
            name: f.classHub.name,
            courseCode: f.classHub.courseCode,
          } : undefined,
          note: f.noteContent ? {
            id: f.noteContent.id,
            title: f.noteContent.title || f.name,
            content: f.noteContent.content,
            createdAt: new Date(f.createdAt),
          } : undefined,
        })));
      }

      setShowCreateModal(false);
      setSelectedFolderForNewDoc(null);
    } catch (error) {
      console.error("Error creating note:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateFolder = async (name: string, category?: string) => {
    setCreating(true);
    try {
      const folderRes = await fetch("/api/class-hubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category }),
      });

      if (!folderRes.ok) throw new Error("Failed to create folder");

      // Refresh files list to show new folder
      const refreshRes = await fetch("/api/files");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const raw: any[] = refreshData?.data ?? refreshData ?? [];
        setFiles(raw.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type || "other",
          category: f.category || "Other",
          createdAt: f.createdAt,
          classHub: f.classHub ? {
            id: f.classHub.id,
            name: f.classHub.name,
            courseCode: f.classHub.courseCode,
          } : undefined,
          note: f.noteContent ? {
            id: f.noteContent.id,
            title: f.noteContent.title || f.name,
            content: f.noteContent.content,
            createdAt: new Date(f.createdAt),
          } : undefined,
        })));
      }

      setShowCreateFolderModal(false);
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleEditNote = (note: { id: string; title: string; content: string; createdAt: Date }) => {
    setViewingNote(null); // Close viewer
    setEditingNote({
      id: note.id,
      title: note.title,
      content: note.content,
    });
  };

  const handleUpdateNote = async (title: string, content: string) => {
    if (!editingNote) return;

    try {
      const res = await fetch(`/api/notes/${editingNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!res.ok) throw new Error("Failed to update note");

      // Refresh files list
      const refreshRes = await fetch("/api/files");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const raw: any[] = refreshData?.data ?? refreshData ?? [];
        setFiles(raw.map((f: any) => ({
          id: f.id,
          name: f.name,
          type: f.type || "other",
          category: f.category || "Other",
          createdAt: f.createdAt,
          classHub: f.classHub ? {
            id: f.classHub.id,
            name: f.classHub.name,
            courseCode: f.classHub.courseCode,
          } : undefined,
          note: f.noteContent ? {
            id: f.noteContent.id,
            title: f.noteContent.title || f.name,
            content: f.noteContent.content,
            createdAt: new Date(f.createdAt),
          } : undefined,
        })));
      }
    } catch (error) {
      console.error("Error updating note:", error);
      throw error;
    }
  };

  const surfaceStyle = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.30)" : "0 4px 24px rgba(0,0,0,0.04)",
  };

  const surfaceSoftStyle = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.03)",
  };

  return (
    <main className="h-full overflow-visible" style={{ background: dark ? "var(--background)" : "#f8f9fa", color: dark ? "var(--foreground)" : "rgba(0,0,0,0.95)" }}>
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${rgbaBrand(0.22)}, ${dark ? "rgba(0,0,0,0)" : "rgba(255,255,255,0)"} 60%)`,
            opacity: dark ? 0.15 : 0.25,
          }}
        />
      </div>

      <div className="relative flex flex-col h-full">
        {/* Header */}
        <header
          className="border-b backdrop-blur shrink-0"
          style={{
            borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            background: dark ? "rgba(15,15,15,0.88)" : "rgba(255,255,255,0.88)",
          }}
        >
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-2xl border flex items-center justify-center"
                  style={{
                    ...surfaceSoftStyle,
                    background: dark ? "rgba(255,255,255,0.03)" : "white",
                  }}
                >
                  <FileText size={18} style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }} />
                </div>
                <div>
                  <div className="text-base font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                    Files
                  </div>
                  <div className="text-xs" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                    {files.length} file{files.length !== 1 ? "s" : ""} organized by class
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  ref={newButtonRef}
                  onClick={() => setShowNewMenu(!showNewMenu)}
                  className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold border transition hover:scale-105"
                  style={{
                    borderColor: rgbaBrand(0.22),
                    background: rgbaBrand(0.10),
                    color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                  }}
                >
                  <Plus size={16} />
                  New
                  <ChevronDown size={14} />
                </button>

                {showNewMenu && dropdownPos && typeof document !== 'undefined' && createPortal(
                  <>
                    <div
                      className="fixed inset-0 z-[100]"
                      onClick={() => setShowNewMenu(false)}
                    />
                    <div
                      className="fixed z-[200] rounded-2xl border shadow-lg py-2 min-w-[180px]"
                      style={{
                        background: dark ? "rgba(26,26,26,0.98)" : "rgba(255,255,255,0.98)",
                        borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)",
                        backdropFilter: "blur(12px)",
                        boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.40)" : "0 4px 24px rgba(0,0,0,0.12)",
                        top: `${dropdownPos.top}px`,
                        right: `${dropdownPos.right}px`,
                      }}
                    >
                      <button
                        onClick={() => {
                          setShowNewMenu(false);
                          setShowFolderSelectModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center gap-3"
                        style={{
                          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <FileText size={16} />
                        New Document
                      </button>
                      <button
                        onClick={() => {
                          setShowNewMenu(false);
                          setShowCreateFolderModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-medium transition flex items-center gap-3"
                        style={{
                          color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <Folder size={16} />
                        New Folder
                      </button>
                    </div>
                  </>,
                  document.body
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div
          className="border-b backdrop-blur shrink-0"
          style={{
            borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
            background: dark ? "rgba(15,15,15,0.88)" : "rgba(255,255,255,0.88)",
          }}
        >
          <div className="max-w-[1600px] mx-auto px-6 py-4 space-y-3">
            {/* Search Bar */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}
              />
              <input
                type="text"
                placeholder="Search files by name, class, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border pl-11 pr-4 py-3 text-sm outline-none transition"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  background: dark ? "rgba(255,255,255,0.03)" : "white",
                  color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                }}
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-xl border px-3 py-2 text-xs font-medium outline-none"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  background: dark ? "rgba(255,255,255,0.03)" : "white",
                  color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                }}
              >
                <option value="all">All Categories</option>
                <option value="School">School</option>
                <option value="Work">Work</option>
                <option value="Life">Life</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border px-3 py-2 text-xs font-medium outline-none"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  background: dark ? "rgba(255,255,255,0.03)" : "white",
                  color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                }}
              >
                <option value="all">All Types</option>
                <option value="note">Notes</option>
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="image">Image</option>
                <option value="link">Link</option>
                <option value="other">Other</option>
              </select>

              {(searchQuery || categoryFilter !== "all" || typeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("all");
                    setTypeFilter("all");
                  }}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold transition"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    background: dark ? "rgba(255,255,255,0.03)" : "white",
                    color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
            {loading ? (
              <div
                className="rounded-3xl border p-6 text-center"
                style={{
                  ...surfaceStyle,
                  background: dark ? "var(--surface)" : "white",
                }}
              >
                <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>
                  Loading files...
                </div>
              </div>
            ) : files.length === 0 ? (
              <div
                className="rounded-3xl border p-6 text-center"
                style={{
                  ...surfaceStyle,
                  background: dark ? "var(--surface)" : "white",
                }}
              >
                <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.60)" : "rgba(0,0,0,0.60)" }}>
                  No files yet
                </div>
                <div className="text-xs mt-1" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>
                  Files you create will appear here
                </div>
              </div>
            ) : (
              <>
                {/* Class Groups */}
                {classGroups.map((group) => (
                  <div
                    key={group.id}
                    className="rounded-3xl border p-6"
                    style={{
                      ...surfaceStyle,
                      background: dark ? "var(--surface)" : "white",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-10 w-10 rounded-2xl border flex items-center justify-center"
                        style={{
                          ...surfaceSoftStyle,
                          background: rgbaBrand(0.10),
                          borderColor: rgbaBrand(0.22),
                        }}
                      >
                        <Folder size={18} style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                          {group.name}
                          {group.courseCode && (
                            <span className="ml-2 text-sm font-normal" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                              ({group.courseCode})
                            </span>
                          )}
                        </div>
                        <div className="text-xs" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                          {group.files.length} file{group.files.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {group.files.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-2xl border p-4"
                          style={{
                            ...surfaceSoftStyle,
                            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
                              style={{
                                ...surfaceSoftStyle,
                                background: dark ? "rgba(255,255,255,0.04)" : "white",
                              }}
                            >
                              <FileText size={16} style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                                {file.name}
                              </div>
                              <div className="text-xs mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                                {new Date(file.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                              </div>

                              {file.type === "note" && file.note && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleViewNote(file.note!, "read")}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold border transition"
                                    style={{
                                      borderColor: rgbaBrand(0.22),
                                      background: rgbaBrand(0.10),
                                      color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                                    }}
                                  >
                                    Read Note
                                  </button>
                                  <button
                                    onClick={() => handleViewNote(file.note!, "summary")}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold border transition flex items-center gap-1.5"
                                    style={{
                                      borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                                      background: dark ? "rgba(255,255,255,0.04)" : "white",
                                      color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                                    }}
                                  >
                                    <Sparkles size={12} />
                                    AI Summary
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Ungrouped Files */}
                {ungrouped.length > 0 && (
                  <div
                    className="rounded-3xl border p-6"
                    style={{
                      ...surfaceStyle,
                      background: dark ? "var(--surface)" : "white",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="h-10 w-10 rounded-2xl border flex items-center justify-center"
                        style={{
                          ...surfaceSoftStyle,
                          background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                        }}
                      >
                        <FileText size={18} style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-base font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                          Other Files
                        </div>
                        <div className="text-xs" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                          {ungrouped.length} file{ungrouped.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {ungrouped.map((file) => (
                        <div
                          key={file.id}
                          className="rounded-2xl border p-4"
                          style={{
                            ...surfaceSoftStyle,
                            background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
                              style={{
                                ...surfaceSoftStyle,
                                background: dark ? "rgba(255,255,255,0.04)" : "white",
                              }}
                            >
                              <FileText size={16} style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                                {file.name}
                              </div>
                              <div className="text-xs mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                                {new Date(file.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })} • {file.category}
                              </div>

                              {file.type === "note" && file.note && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleViewNote(file.note!, "read")}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold border transition"
                                    style={{
                                      borderColor: rgbaBrand(0.22),
                                      background: rgbaBrand(0.10),
                                      color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                                    }}
                                  >
                                    Read Note
                                  </button>
                                  <button
                                    onClick={() => handleViewNote(file.note!, "summary")}
                                    className="rounded-xl px-3 py-2 text-xs font-semibold border transition flex items-center gap-1.5"
                                    style={{
                                      borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                                      background: dark ? "rgba(255,255,255,0.04)" : "white",
                                      color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                                    }}
                                  >
                                    <Sparkles size={12} />
                                    AI Summary
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Note Viewer Modal */}
      {viewingNote && (
        <NoteViewer
          note={viewingNote}
          eventId=""
          onClose={() => setViewingNote(null)}
          onEdit={() => handleEditNote(viewingNote)}
          dark={dark}
          initialMode={viewMode}
        />
      )}

      {/* Edit Note Modal */}
      {editingNote && (
        <RichNoteEditor
          eventId=""
          eventTitle=""
          initialContent={editingNote.content}
          initialTitle={editingNote.title}
          noteId={editingNote.id}
          onClose={() => setEditingNote(null)}
          onSave={handleUpdateNote}
          dark={dark}
        />
      )}

      {/* Folder Selection Modal */}
      {showFolderSelectModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            onClick={() => setShowFolderSelectModal(false)}
          />
          <div
            className="fixed inset-4 md:inset-[20%] lg:inset-[25%] z-[90] border rounded-3xl shadow-2xl flex flex-col"
            style={{
              background: dark ? "rgba(26,26,26,0.95)" : "rgba(255,255,255,0.95)",
              borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)",
              maxHeight: "500px",
            }}
          >
            <div
              className="shrink-0 px-6 py-4 border-b"
              style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)" }}>
                Select Folder
              </h2>
              <div className="text-xs mt-1" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.50)" }}>
                Choose which folder to save your document in
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
              {/* No folder option */}
              <button
                onClick={() => {
                  setSelectedFolderForNewDoc(null);
                  setShowFolderSelectModal(false);
                  setShowCreateModal(true);
                }}
                className="w-full text-left rounded-2xl border px-4 py-3 transition hover:bg-black/[0.02]"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  background: dark ? "rgba(255,255,255,0.03)" : "white",
                }}
              >
                <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                  No Folder
                </div>
                <div className="text-xs mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                  Save to "Other Files"
                </div>
              </button>

              {/* Folder options */}
              {availableFolders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setSelectedFolderForNewDoc(folder.id);
                    setShowFolderSelectModal(false);
                    setShowCreateModal(true);
                  }}
                  className="w-full text-left rounded-2xl border px-4 py-3 transition hover:bg-black/[0.02] flex items-center gap-3"
                  style={{
                    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    background: dark ? "rgba(255,255,255,0.03)" : "white",
                  }}
                >
                  <div
                    className="h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0"
                    style={{
                      borderColor: rgbaBrand(0.22),
                      background: rgbaBrand(0.10),
                    }}
                  >
                    <Folder size={18} style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>
                      {folder.name}
                      {folder.courseCode && (
                        <span className="ml-2 text-xs font-normal" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>
                          ({folder.courseCode})
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}

              {availableFolders.length === 0 && (
                <div
                  className="text-center py-8"
                  style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}
                >
                  <div className="text-sm">No folders yet</div>
                  <div className="text-xs mt-1">Create a folder first or select "No Folder"</div>
                </div>
              )}
            </div>

            <div
              className="shrink-0 px-6 py-4 border-t flex items-center justify-end"
              style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)" }}
            >
              <button
                onClick={() => setShowFolderSelectModal(false)}
                className="rounded-xl px-4 py-2 text-sm font-semibold border transition"
                style={{
                  borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                  background: dark ? "rgba(255,255,255,0.03)" : "white",
                  color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create Note Modal */}
      {showCreateModal && (
        <RichNoteEditor
          eventId=""
          eventTitle={selectedFolderForNewDoc ? availableFolders.find(f => f.id === selectedFolderForNewDoc)?.name || "" : ""}
          onSave={handleCreateNote}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedFolderForNewDoc(null);
          }}
          dark={dark}
        />
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80]"
            onClick={() => setShowCreateFolderModal(false)}
          />
          <div
            className="fixed inset-4 md:inset-8 lg:inset-[20%] z-[90] border rounded-3xl shadow-2xl flex flex-col"
            style={{
              background: dark ? "rgba(26,26,26,0.95)" : "rgba(255,255,255,0.95)",
              borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)",
              maxHeight: "400px",
            }}
          >
            <div
              className="shrink-0 px-6 py-4 border-b flex items-center justify-between"
              style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)" }}
            >
              <h2 className="text-lg font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(17,17,17,0.90)" }}>
                New Folder
              </h2>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="h-8 w-8 rounded-lg flex items-center justify-center transition hover:bg-black/[0.06]"
                style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(17,17,17,0.50)" }}
              >
                ×
              </button>
            </div>

            <CreateFolderForm
              onSubmit={handleCreateFolder}
              onCancel={() => setShowCreateFolderModal(false)}
              dark={dark}
              creating={creating}
            />
          </div>
        </>
      )}
    </main>
  );
}

function CreateFolderForm({
  onSubmit,
  onCancel,
  dark,
  creating,
}: {
  onSubmit: (name: string, category?: string) => void;
  onCancel: () => void;
  dark: boolean;
  creating: boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), category || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
      <div className="flex-1 px-6 py-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>
            Folder Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Operating Systems"
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition"
            style={{
              borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              background: dark ? "rgba(255,255,255,0.03)" : "white",
              color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
            }}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)" }}>
            Category (Optional)
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition"
            style={{
              borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              background: dark ? "rgba(255,255,255,0.03)" : "white",
              color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
            }}
          >
            <option value="">Select a category</option>
            <option value="School">School</option>
            <option value="Work">Work</option>
            <option value="Life">Life</option>
            <option value="Health">Health</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div
        className="shrink-0 px-6 py-4 border-t flex items-center justify-end gap-3"
        style={{ borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.10)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl px-4 py-2 text-sm font-semibold border transition"
          style={{
            borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
            background: dark ? "rgba(255,255,255,0.03)" : "white",
            color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || creating}
          className="rounded-xl px-4 py-2 text-sm font-semibold border transition disabled:opacity-50"
          style={{
            borderColor: "rgba(31,138,91,0.22)",
            background: "rgba(31,138,91,0.10)",
            color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)",
          }}
        >
          {creating ? "Creating..." : "Create Folder"}
        </button>
      </div>
    </form>
  );
}
