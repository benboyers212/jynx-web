"use client";

import { useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

type FileType = "pdf" | "doc" | "image" | "audio" | "link" | "other";
type FileCategory =
  | "School"
  | "Work"
  | "Life"
  | "Finance"
  | "Health"
  | "Fitness"
  | "Other";
type FileContext =
  | { kind: "personal" }
  | { kind: "group"; groupId: string; groupName: string };

type FileItem = {
  id: string;
  name: string;
  type: FileType;
  category: FileCategory;
  context: FileContext;
  createdAt: number;
  sizeLabel?: string; // "2.1 MB"
  pinned?: boolean;
  notes?: string;
  url?: string; // for link items
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDay(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function typeIcon(t: FileType) {
  if (t === "pdf") return "PDF";
  if (t === "doc") return "DOC";
  if (t === "image") return "IMG";
  if (t === "audio") return "AUD";
  if (t === "link") return "LNK";
  return "FILE";
}

function typePill(t: FileType) {
  if (t === "pdf") return "PDF";
  if (t === "doc") return "Doc";
  if (t === "image") return "Image";
  if (t === "audio") return "Audio";
  if (t === "link") return "Link";
  return "File";
}

function contextLabel(c: FileContext) {
  return c.kind === "personal" ? "Personal" : c.groupName;
}

function inferType(nameOrUrl: string): FileType {
  const n = nameOrUrl.toLowerCase();
  if (n.startsWith("http://") || n.startsWith("https://")) return "link";
  if (n.endsWith(".pdf")) return "pdf";
  if (
    n.endsWith(".doc") ||
    n.endsWith(".docx") ||
    n.endsWith(".txt") ||
    n.endsWith(".md")
  )
    return "doc";
  if (
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp")
  )
    return "image";
  if (n.endsWith(".mp3") || n.endsWith(".m4a") || n.endsWith(".wav"))
    return "audio";
  return "other";
}

function prettySize(bytes: number) {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export default function FilesPage() {
  // === Styling tokens copied from ChatPage ===
  const panelBase = "rounded-3xl border bg-white/6 backdrop-blur";
  const panelInner = "rounded-2xl border bg-neutral-900/40";
  const buttonBase =
    "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  const oliveCardStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };

  const oliveSoftStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.42)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
  };

  // Mock groups (for context filter + upload modal)
  const groups = useMemo(
    () => [
      { id: "g1", name: "Study Group — F303" },
      { id: "g2", name: "Startup Team — Jynx" },
      { id: "g3", name: "Roommates — Spring" },
    ],
    []
  );

  const [files, setFiles] = useState<FileItem[]>(() => {
    const now = Date.now();
    return [
      {
        id: "f1",
        name: "F303 Practice Exam 2.pdf",
        type: "pdf",
        category: "School",
        context: { kind: "personal" },
        createdAt: now - 35 * 60 * 1000,
        sizeLabel: "1.8 MB",
        pinned: true,
      },
      {
        id: "f2",
        name: "Pitch Deck v4 (internal).pptx",
        type: "other",
        category: "Work",
        context: {
          kind: "group",
          groupId: "g2",
          groupName: "Startup Team — Jynx",
        },
        createdAt: now - 4 * 60 * 60 * 1000,
        sizeLabel: "6.2 MB",
      },
      {
        id: "f3",
        name: "Gym split notes.txt",
        type: "doc",
        category: "Fitness",
        context: { kind: "personal" },
        createdAt: now - 22 * 60 * 60 * 1000,
        sizeLabel: "4 KB",
      },
      {
        id: "f4",
        name: "Apartment chore list.jpg",
        type: "image",
        category: "Life",
        context: {
          kind: "group",
          groupId: "g3",
          groupName: "Roommates — Spring",
        },
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        sizeLabel: "2.4 MB",
      },
      {
        id: "f5",
        name: "Meeting audio — Dylan.m4a",
        type: "audio",
        category: "Work",
        context: { kind: "personal" },
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        sizeLabel: "18.6 MB",
      },
      {
        id: "f6",
        name: "Useful article — scheduling psychology",
        type: "link",
        category: "Work",
        context: { kind: "personal" },
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        sizeLabel: "Link",
        url: "https://example.com",
      },
    ];
  });

  // UI states
  const [query, setQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<
    "all" | "personal" | "group"
  >("all");
  const [groupFilterId, setGroupFilterId] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<FileType | "all">("all");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Upload modal state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [addingLink, setAddingLink] = useState(false);

  const [uContextKind, setUContextKind] = useState<"personal" | "group">(
    "personal"
  );
  const [uGroupId, setUGroupId] = useState<string>(groups[0]?.id ?? "g1");
  const [uCategory, setUCategory] = useState<FileCategory>("Other");
  const [uPinned, setUPinned] = useState(false);
  const [uNotes, setUNotes] = useState("");
  const [uLinkUrl, setULinkUrl] = useState("");
  const [uLinkName, setULinkName] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = files.slice();

    if (q) {
      list = list.filter((f) => {
        const ctx = contextLabel(f.context).toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          ctx.includes(q) ||
          (f.notes ?? "").toLowerCase().includes(q)
        );
      });
    }

    if (contextFilter !== "all") {
      list = list.filter((f) =>
        contextFilter === "personal"
          ? f.context.kind === "personal"
          : f.context.kind === "group"
      );
    }

    if (groupFilterId !== "all") {
      list = list.filter(
        (f) => f.context.kind === "group" && f.context.groupId === groupFilterId
      );
    }

    if (categoryFilter !== "all") {
      list = list.filter((f) => f.category === categoryFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((f) => f.type === typeFilter);
    }

    if (pinnedOnly) {
      list = list.filter((f) => !!f.pinned);
    }

    if (sort === "recent") list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [
    files,
    query,
    contextFilter,
    groupFilterId,
    categoryFilter,
    typeFilter,
    pinnedOnly,
    sort,
  ]);

  function openPicker() {
    setAddingLink(false);
    fileInputRef.current?.click();
  }

  function openLinkModal() {
    setPendingFiles([]);
    setAddingLink(true);
    setUploadOpen(true);
    // defaults
    setUContextKind("personal");
    setUGroupId(groups[0]?.id ?? "g1");
    setUCategory("Other");
    setUPinned(false);
    setUNotes("");
    setULinkUrl("");
    setULinkName("");
  }

  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    setPendingFiles(list);
    setAddingLink(false);

    // reset modal defaults (light context)
    setUContextKind("personal");
    setUGroupId(groups[0]?.id ?? "g1");
    setUCategory("Other");
    setUPinned(false);
    setUNotes("");

    setUploadOpen(true);
    e.target.value = "";
  }

  function buildContext(): FileContext {
    if (uContextKind === "personal") return { kind: "personal" };
    const g = groups.find((x) => x.id === uGroupId) ?? groups[0];
    return {
      kind: "group",
      groupId: g?.id ?? "g1",
      groupName: g?.name ?? "Group",
    };
  }

  function addFilesNow() {
    const now = Date.now();
    const ctx = buildContext();

    const newOnes: FileItem[] = pendingFiles.map((f) => ({
      id: uid(),
      name: f.name,
      type: inferType(f.name),
      category: uCategory,
      context: ctx,
      createdAt: now,
      sizeLabel: prettySize(f.size),
      pinned: uPinned,
      notes: uNotes.trim() ? uNotes.trim() : undefined,
    }));

    setFiles((prev) => [...newOnes, ...prev]);
    setUploadOpen(false);
    setPendingFiles([]);
  }

  function addLinkNow() {
    const url = uLinkUrl.trim();
    if (!url) return;

    const now = Date.now();
    const ctx = buildContext();

    const item: FileItem = {
      id: uid(),
      name: (uLinkName.trim() || url).slice(0, 120),
      type: "link",
      category: uCategory,
      context: ctx,
      createdAt: now,
      sizeLabel: "Link",
      pinned: uPinned,
      notes: uNotes.trim() ? uNotes.trim() : undefined,
      url,
    };

    setFiles((prev) => [item, ...prev]);
    setUploadOpen(false);
    setAddingLink(false);
    setULinkUrl("");
    setULinkName("");
    setUNotes("");
  }

  function togglePin(id: string) {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, pinned: !f.pinned } : f))
    );
  }

  function deleteFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function openFileUI(f: FileItem) {
    if (f.type === "link" && f.url) {
      window.open(f.url, "_blank", "noopener,noreferrer");
      return;
    }
    alert("UI shell — open");
  }

  return (
    <main className="h-screen bg-neutral-950 text-neutral-100 overflow-hidden min-h-0">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(85,107,47,0.90), rgba(17,17,17,0) 60%)",
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-15 bg-white/20" />
      </div>

      {/* Full-width content (no left tabs) */}
      <section className="relative flex flex-col h-full min-h-0">
        {/* Header */}
        <header className="border-b border-white/10 bg-neutral-950/45 backdrop-blur shrink-0">
          <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
            {/* Brand (replaces left sidebar header) */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-xl border border-white/12 bg-white/6 flex items-center justify-center text-xs font-semibold">
                LOGO
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-wide truncate">
                  Files
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 truncate">
                  One list • search + filters • light context on upload
                </div>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setShowRightPanel((v) => !v)}
                className={cx(
                  buttonBase,
                  "bg-transparent hover:bg-white/6 border-white/12"
                )}
              >
                {showRightPanel ? "Hide filters" : "Show filters"}
              </button>

              <button
                onClick={openLinkModal}
                className={cx(
                  buttonBase,
                  "bg-transparent hover:bg-white/6 border-white/12"
                )}
              >
                Add link
              </button>

              <button
                onClick={() => {
                  // open modal even before picking (optional): we’ll still pick first for now
                  openPicker();
                }}
                className={cx(
                  buttonBase,
                  "bg-white/10 hover:bg-white/14 border-white/12"
                )}
                style={oliveSoftStyle}
              >
                + Upload
              </button>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={onPicked}
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="w-full max-w-[1200px] 2xl:max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-5 pb-24">
            <div
              className={cx(
                "grid gap-4",
                showRightPanel ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
              )}
            >
              {/* Main list */}
              <div
                className={showRightPanel ? "lg:col-span-8 space-y-4" : "space-y-4"}
              >
                {/* Search + controls */}
                <div className={panelBase} style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-3 md:items-center">
                      <div className="flex-1">
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by name, group, category…"
                          className="w-full rounded-2xl border border-white/12 bg-white/6 px-4 py-3 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-white/10"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setSort((s) => (s === "recent" ? "name" : "recent"))
                          }
                          className={cx(
                            buttonBase,
                            "bg-transparent hover:bg-white/6 border-white/12"
                          )}
                        >
                          Sort: {sort === "recent" ? "Recent" : "Name"}
                        </button>

                        <button
                          onClick={() => setPinnedOnly((v) => !v)}
                          className={cx(
                            buttonBase,
                            pinnedOnly
                              ? "bg-white/12 border-white/18 text-neutral-100"
                              : "bg-transparent hover:bg-white/6 border-white/12"
                          )}
                          style={pinnedOnly ? oliveSoftStyle : undefined}
                        >
                          Pinned
                        </button>

                        <button
                          onClick={() => {
                            setQuery("");
                            setContextFilter("all");
                            setGroupFilterId("all");
                            setCategoryFilter("all");
                            setTypeFilter("all");
                            setPinnedOnly(false);
                            setSort("recent");
                          }}
                          className={cx(
                            buttonBase,
                            "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                          )}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="text-[11px] text-neutral-500">
                        {filtered.length} file{filtered.length === 1 ? "" : "s"}{" "}
                        shown
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Tip: Upload adds light context (personal/group + category)
                      </div>
                    </div>
                  </div>
                </div>

                {/* One list (no Inbox / Pinned / Recent sections) */}
                <div className="rounded-3xl border border-white/10 bg-neutral-950/35 backdrop-blur">
                  <div className="px-4 py-4 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">All files</div>
                      <div className="ml-auto text-[11px] text-neutral-400">
                        {filtered.length}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-neutral-400">
                      One list. Use filters when it grows.
                    </div>
                  </div>

                  <div className="p-4">
                    {filtered.length === 0 ? (
                      <div
                        className={cx(panelInner, "px-3 py-4")}
                        style={{ borderColor: "rgba(255,255,255,0.12)" }}
                      >
                        <div className="text-sm text-neutral-200">
                          No matches. Try clearing filters.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filtered.map((f) => (
                          <div
                            key={f.id}
                            className={cx(panelInner, "px-3 py-3")}
                            style={{ borderColor: "rgba(255,255,255,0.12)" }}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className="h-10 w-10 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-[10px] font-semibold"
                                style={f.pinned ? oliveSoftStyle : undefined}
                              >
                                {typeIcon(f.type)}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-neutral-100 truncate">
                                      {f.name}
                                    </div>
                                    <div className="mt-0.5 text-xs text-neutral-400">
                                      {contextLabel(f.context)} • {f.category} •{" "}
                                      {formatDay(f.createdAt)}{" "}
                                      {formatTime(f.createdAt)}
                                    </div>
                                  </div>

                                  <div className="text-[11px] text-neutral-500 whitespace-nowrap">
                                    {f.sizeLabel ?? "—"}
                                  </div>
                                </div>

                                {f.notes ? (
                                  <div className="mt-2 text-[11px] text-neutral-500">
                                    {f.notes}
                                  </div>
                                ) : null}

                                <div className="mt-3 flex flex-wrap gap-2">
                                  <button
                                    className={cx(
                                      buttonBase,
                                      "bg-white/10 hover:bg-white/14 border-white/12"
                                    )}
                                    style={oliveSoftStyle}
                                    onClick={() => openFileUI(f)}
                                  >
                                    Open
                                  </button>

                                  <button
                                    className={cx(
                                      buttonBase,
                                      "bg-transparent hover:bg-white/6 border-white/12"
                                    )}
                                    onClick={() => togglePin(f.id)}
                                  >
                                    {f.pinned ? "Unpin" : "Pin"}
                                  </button>

                                  <button
                                    className={cx(
                                      buttonBase,
                                      "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                                    )}
                                    onClick={() =>
                                      alert("UI shell — move/tag modal later")
                                    }
                                  >
                                    Move / Tag
                                  </button>

                                  <button
                                    className={cx(
                                      buttonBase,
                                      "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                                    )}
                                    onClick={() => deleteFile(f.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-6" />
              </div>

              {/* Right panel: Filters */}
              {showRightPanel && (
                <aside className="lg:col-span-4 space-y-4">
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="text-sm font-semibold">Filters</div>
                      <div className="mt-1 text-xs text-neutral-400">
                        Organize by{" "}
                        <span className="font-semibold text-neutral-200">
                          Context
                        </span>{" "}
                        first, then Category.
                      </div>

                      <div className="mt-4 space-y-3">
                        {/* Context */}
                        <div
                          className={cx(panelInner, "p-3")}
                          style={{ borderColor: "rgba(255,255,255,0.12)" }}
                        >
                          <div className="text-xs font-semibold text-neutral-300">
                            Context
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {[
                              { id: "all", label: "All" },
                              { id: "personal", label: "Personal" },
                              { id: "group", label: "Groups" },
                            ].map((o) => (
                              <button
                                key={o.id}
                                onClick={() => {
                                  setContextFilter(o.id as any);
                                  if (o.id !== "group") setGroupFilterId("all");
                                }}
                                className={cx(
                                  "rounded-full border px-3 py-1.5 text-[11px] transition",
                                  contextFilter === (o.id as any)
                                    ? "bg-white/12 border-white/18 text-neutral-100"
                                    : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                                )}
                                style={
                                  contextFilter === (o.id as any)
                                    ? oliveSoftStyle
                                    : undefined
                                }
                              >
                                {o.label}
                              </button>
                            ))}
                          </div>

                          {contextFilter === "group" && (
                            <div className="mt-3">
                              <select
                                value={groupFilterId}
                                onChange={(e) => setGroupFilterId(e.target.value)}
                                className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-sm outline-none"
                              >
                                <option value="all">All groups</option>
                                {groups.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Category */}
                        <div
                          className={cx(panelInner, "p-3")}
                          style={{ borderColor: "rgba(255,255,255,0.12)" }}
                        >
                          <div className="text-xs font-semibold text-neutral-300">
                            Category
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {(
                              [
                                "all",
                                "School",
                                "Work",
                                "Life",
                                "Finance",
                                "Health",
                                "Fitness",
                                "Other",
                              ] as const
                            ).map((c) => (
                              <button
                                key={c}
                                onClick={() => setCategoryFilter(c as any)}
                                className={cx(
                                  "rounded-2xl border px-3 py-2 text-[11px] text-left transition",
                                  categoryFilter === c
                                    ? "bg-white/12 border-white/18 text-neutral-100"
                                    : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                                )}
                                style={
                                  categoryFilter === c ? oliveSoftStyle : undefined
                                }
                              >
                                {c === "all" ? "All" : c}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Type */}
                        <div
                          className={cx(panelInner, "p-3")}
                          style={{ borderColor: "rgba(255,255,255,0.12)" }}
                        >
                          <div className="text-xs font-semibold text-neutral-300">
                            Type
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(
                              [
                                "all",
                                "pdf",
                                "doc",
                                "image",
                                "audio",
                                "link",
                                "other",
                              ] as const
                            ).map((t) => (
                              <button
                                key={t}
                                onClick={() => setTypeFilter(t as any)}
                                className={cx(
                                  "rounded-full border px-3 py-1.5 text-[11px] transition",
                                  typeFilter === t
                                    ? "bg-white/12 border-white/18 text-neutral-100"
                                    : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                                )}
                                style={typeFilter === t ? oliveSoftStyle : undefined}
                              >
                                {t === "all" ? "All" : typePill(t)}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Summary */}
                        <div className="rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                          <div className="text-xs text-neutral-400">Showing</div>
                          <div className="mt-1 text-sm font-semibold text-neutral-100">
                            {filtered.length} file{filtered.length === 1 ? "" : "s"}
                          </div>
                          <div className="mt-2 text-[11px] text-neutral-500">
                            Simple by default. Later: suggested category/context on upload.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Philosophy */}
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="text-sm font-semibold">How this stays simple</div>
                      <div className="mt-2 text-sm text-neutral-200 leading-relaxed">
                        One list. Light context on upload. Search when you don’t feel like organizing.
                      </div>
                      <div className="mt-3 rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-3">
                        <div className="text-xs text-neutral-400">
                          Upload asks for just enough: personal/group + category. Everything else is optional.
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {uploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => {
                setUploadOpen(false);
                setPendingFiles([]);
                setAddingLink(false);
              }}
            />
            <div
              className="relative w-full max-w-[720px] rounded-3xl border border-white/10 bg-neutral-950/85 backdrop-blur p-4"
              style={oliveCardStyle}
            >
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center text-xs font-semibold shrink-0"
                  style={oliveSoftStyle}
                >
                  {addingLink ? "LNK" : "FILE"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {addingLink ? "Add link" : "Add file"}
                  </div>
                  <div className="mt-1 text-xs text-neutral-400">
                    Add a little context so you can find this later.
                  </div>
                </div>
                <button
                  className={cx(
                    buttonBase,
                    "bg-transparent hover:bg-white/6 border-white/12"
                  )}
                  onClick={() => {
                    setUploadOpen(false);
                    setPendingFiles([]);
                    setAddingLink(false);
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Selected items */}
              <div className="mt-4 space-y-2">
                {!addingLink ? (
                  <div className="rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                    <div className="text-xs text-neutral-400">Selected</div>
                    <div className="mt-1 text-sm text-neutral-100">
                      {pendingFiles.length} file{pendingFiles.length === 1 ? "" : "s"}
                    </div>
                    {pendingFiles.slice(0, 4).map((f) => (
                      <div key={f.name} className="mt-2 text-[12px] text-neutral-300 truncate">
                        {f.name}
                      </div>
                    ))}
                    {pendingFiles.length > 4 && (
                      <div className="mt-2 text-[11px] text-neutral-500">
                        + {pendingFiles.length - 4} more…
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                      <div className="text-xs text-neutral-400">URL</div>
                      <input
                        value={uLinkUrl}
                        onChange={(e) => setULinkUrl(e.target.value)}
                        placeholder="https://…"
                        className="mt-2 w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                      />
                    </div>
                    <div className="rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                      <div className="text-xs text-neutral-400">Name (optional)</div>
                      <input
                        value={uLinkName}
                        onChange={(e) => setULinkName(e.target.value)}
                        placeholder="Useful article — scheduling psychology"
                        className="mt-2 w-full rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Context + Category */}
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={cx(panelInner, "p-3")} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <div className="text-xs font-semibold text-neutral-300">Context</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      { id: "personal", label: "Personal" },
                      { id: "group", label: "Group" },
                    ].map((o) => (
                      <button
                        key={o.id}
                        onClick={() => setUContextKind(o.id as any)}
                        className={cx(
                          "rounded-full border px-3 py-1.5 text-[11px] transition",
                          uContextKind === (o.id as any)
                            ? "bg-white/12 border-white/18 text-neutral-100"
                            : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                        )}
                        style={uContextKind === (o.id as any) ? oliveSoftStyle : undefined}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>

                  {uContextKind === "group" && (
                    <div className="mt-3">
                      <select
                        value={uGroupId}
                        onChange={(e) => setUGroupId(e.target.value)}
                        className="w-full rounded-2xl border border-white/12 bg-white/6 px-3 py-2 text-sm outline-none"
                      >
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className={cx(panelInner, "p-3")} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <div className="text-xs font-semibold text-neutral-300">Category</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(
                      ["School", "Work", "Life", "Finance", "Health", "Fitness", "Other"] as const
                    ).map((c) => (
                      <button
                        key={c}
                        onClick={() => setUCategory(c)}
                        className={cx(
                          "rounded-2xl border px-3 py-2 text-[11px] text-left transition",
                          uCategory === c
                            ? "bg-white/12 border-white/18 text-neutral-100"
                            : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                        )}
                        style={uCategory === c ? oliveSoftStyle : undefined}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Optional */}
              <div className="mt-3 rounded-2xl border border-white/12 bg-white/6 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-semibold text-neutral-300">Optional</div>
                    <div className="mt-0.5 text-[11px] text-neutral-500">
                      Pin for quick access, add a short note.
                    </div>
                  </div>
                  <button
                    onClick={() => setUPinned((v) => !v)}
                    className={cx(
                      buttonBase,
                      uPinned
                        ? "bg-white/12 border-white/18 text-neutral-100"
                        : "bg-transparent hover:bg-white/6 border-white/12"
                    )}
                    style={uPinned ? oliveSoftStyle : undefined}
                  >
                    {uPinned ? "Pinned" : "Pin"}
                  </button>
                </div>

                <textarea
                  value={uNotes}
                  onChange={(e) => setUNotes(e.target.value)}
                  placeholder="Note (optional)…"
                  className="mt-3 w-full min-h-[64px] rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:ring-2 focus:ring-white/10"
                />
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  className={cx(
                    buttonBase,
                    "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300"
                  )}
                  onClick={() => {
                    setUploadOpen(false);
                    setPendingFiles([]);
                    setAddingLink(false);
                  }}
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  {!addingLink && (
                    <button
                      className={cx(
                        buttonBase,
                        "bg-transparent hover:bg-white/6 border-white/12"
                      )}
                      onClick={openPicker}
                    >
                      Pick more
                    </button>
                  )}

                  <button
                    className={cx(
                      buttonBase,
                      "bg-white/10 hover:bg-white/14 border-white/12"
                    )}
                    style={oliveSoftStyle}
                    onClick={() => (addingLink ? addLinkNow() : addFilesNow())}
                    disabled={!addingLink && pendingFiles.length === 0}
                  >
                    {addingLink ? "Add link" : "Add file"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
