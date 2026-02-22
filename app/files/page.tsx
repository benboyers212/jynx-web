"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useTheme } from "../ThemeContext";
import { FileText, Folder, Download, Sparkles, Search } from "lucide-react";
import { NoteViewer } from "@/components/notes/NoteViewer";

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
  const [viewMode, setViewMode] = useState<"read" | "summary">("read");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
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

  const surfaceStyle = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 8px 32px rgba(0,0,0,0.30)" : "0 4px 24px rgba(0,0,0,0.04)",
  };

  const surfaceSoftStyle = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.03)",
  };

  return (
    <main className="h-screen overflow-hidden" style={{ background: dark ? "var(--background)" : "#f8f9fa", color: dark ? "var(--foreground)" : "rgba(0,0,0,0.95)" }}>
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
          onEdit={() => {}}
          dark={dark}
          initialMode={viewMode}
        />
      )}
    </main>
  );
}
