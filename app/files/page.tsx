"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/" },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat" },
  { label: "Files", href: "/files", active: true },
];

type FileType = "pdf" | "doc" | "image" | "audio" | "link" | "other";
type FileCategory = "School" | "Work" | "Life" | "Finance" | "Health" | "Fitness" | "Other";
type FileContext = { kind: "personal" } | { kind: "group"; groupId: string; groupName: string };

type FileItem = {
  id: string;
  name: string;
  type: FileType;
  category: FileCategory;
  context: FileContext;
  createdAt: number;
  sizeLabel?: string; // "2.1 MB"
  pinned?: boolean;
  isInbox?: boolean; // unfiled/new
  notes?: string;
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

export default function FilesPage() {
  // === Styling tokens copied from ChatPage ===
  const panelBase = "rounded-3xl border bg-white/6 backdrop-blur";
  const panelInner = "rounded-2xl border bg-neutral-900/40";
  const buttonBase = "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  const oliveCardStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };

  const oliveSoftStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.42)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
  };

  // Mock groups (for context filter)
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
        context: { kind: "group", groupId: "g2", groupName: "Startup Team — Jynx" },
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
        context: { kind: "group", groupId: "g3", groupName: "Roommates — Spring" },
        createdAt: now - 3 * 24 * 60 * 60 * 1000,
        sizeLabel: "2.4 MB",
      },
      {
        id: "f5",
        name: "Unsorted screenshot.png",
        type: "image",
        category: "Other",
        context: { kind: "personal" },
        createdAt: now - 15 * 60 * 1000,
        sizeLabel: "912 KB",
        isInbox: true,
        notes: "Needs category + context",
      },
      {
        id: "f6",
        name: "Meeting audio — Dylan.m4a",
        type: "audio",
        category: "Work",
        context: { kind: "personal" },
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        sizeLabel: "18.6 MB",
      },
      {
        id: "f7",
        name: "Useful article — scheduling psychology",
        type: "link",
        category: "Work",
        context: { kind: "personal" },
        createdAt: now - 5 * 24 * 60 * 60 * 1000,
        sizeLabel: "Link",
      },
    ];
  });

  // UI states
  const [query, setQuery] = useState("");
  const [contextFilter, setContextFilter] = useState<"all" | "personal" | "group">("all");
  const [groupFilterId, setGroupFilterId] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<FileCategory | "all">("all");
  const [typeFilter, setTypeFilter] = useState<FileType | "all">("all");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [showRightPanel, setShowRightPanel] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      list = list.filter((f) => (contextFilter === "personal" ? f.context.kind === "personal" : f.context.kind === "group"));
    }

    if (groupFilterId !== "all") {
      list = list.filter((f) => f.context.kind === "group" && f.context.groupId === groupFilterId);
    }

    if (categoryFilter !== "all") {
      list = list.filter((f) => f.category === categoryFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((f) => f.type === typeFilter);
    }

    if (sort === "recent") list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [files, query, contextFilter, groupFilterId, categoryFilter, typeFilter, sort]);

  const inboxItems = useMemo(() => filtered.filter((f) => f.isInbox), [filtered]);
  const pinnedItems = useMemo(() => filtered.filter((f) => f.pinned && !f.isInbox), [filtered]);
  const recentItems = useMemo(() => filtered.filter((f) => !f.isInbox && !f.pinned), [filtered]);

  // Minimal “upload” stubs (UI only)
  function openPicker() {
    fileInputRef.current?.click();
  }

  function onPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    const now = Date.now();
    const newOnes: FileItem[] = list.map((f) => ({
      id: uid(),
      name: f.name,
      type: inferType(f.name),
      category: "Other",
      context: { kind: "personal" },
      createdAt: now,
      sizeLabel: prettySize(f.size),
      isInbox: true,
      notes: "Added to Inbox — tag when ready",
    }));

    setFiles((prev) => [...newOnes, ...prev]);
    e.target.value = "";
  }

  function inferType(name: string): FileType {
    const n = name.toLowerCase();
    if (n.endsWith(".pdf")) return "pdf";
    if (n.endsWith(".doc") || n.endsWith(".docx") || n.endsWith(".txt") || n.endsWith(".md")) return "doc";
    if (n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".jpeg") || n.endsWith(".webp")) return "image";
    if (n.endsWith(".mp3") || n.endsWith(".m4a") || n.endsWith(".wav")) return "audio";
    if (n.startsWith("http")) return "link";
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

  function togglePin(id: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, pinned: !f.pinned, isInbox: f.isInbox ? false : f.isInbox } : f)));
  }

  function moveOutOfInbox(id: string) {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, isInbox: false, notes: undefined, category: f.category === "Other" ? "Life" : f.category }
          : f
      )
    );
  }

  function deleteFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <main className="h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
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

      <div className="relative flex h-full">
        {/* Tabs Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-neutral-950/60 backdrop-blur hidden md:flex flex-col">
          <div className="px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-white/12 bg-white/6 flex items-center justify-center text-xs font-semibold">
                LOGO
              </div>
              <div>
                <div className="text-sm font-semibold tracking-wide">Jynx</div>
                <div className="text-xs text-neutral-400">Your schedule system</div>
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1">
            {tabs.map((t) => (
              <Link
                key={t.label}
                href={t.href}
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm transition"
                style={
                  t.active
                    ? { backgroundColor: OLIVE, color: "white", fontWeight: 700 }
                    : { color: "#D4D4D4" }
                }
              >
                <span>{t.label}</span>
                {t.active && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/15">
                    Active
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main column */}
        <section className="flex-1 flex flex-col h-full">
          {/* Header */}
          <header className="border-b border-white/10 bg-neutral-950/45 backdrop-blur shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-wide truncate">Files</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Drop-zone + library • filter by context and category
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setShowRightPanel((v) => !v)}
                  className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                >
                  {showRightPanel ? "Hide filters" : "Show filters"}
                </button>
                <button
                  onClick={openPicker}
                  className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                  style={oliveSoftStyle}
                >
                  + Upload
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onPicked} />
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-5">
              <div className={cx("grid gap-4", showRightPanel ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1")}>
                {/* Main list */}
                <div className={showRightPanel ? "lg:col-span-8 space-y-4" : "space-y-4"}>
                  {/* Search + quick chips */}
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
                            onClick={() => setSort((s) => (s === "recent" ? "name" : "recent"))}
                            className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                          >
                            Sort: {sort === "recent" ? "Recent" : "Name"}
                          </button>
                          <button
                            onClick={() => {
                              setQuery("");
                              setContextFilter("all");
                              setGroupFilterId("all");
                              setCategoryFilter("all");
                              setTypeFilter("all");
                              setSort("recent");
                            }}
                            className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {[
                          { k: "Inbox", on: inboxItems.length > 0 },
                          { k: "Pinned", on: pinnedItems.length > 0 },
                          { k: "Recent", on: recentItems.length > 0 },
                        ].map((chip) => (
                          <span
                            key={chip.k}
                            className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[11px] text-neutral-200"
                            style={chip.on ? oliveSoftStyle : undefined}
                          >
                            {chip.k}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-2xl flex items-center justify-center border border-white/12 bg-white/6 text-xs"
                          style={oliveSoftStyle}
                        >
                          ⬇
                        </div>
                        <div className="text-sm font-semibold">Drop to Inbox</div>
                        <div className="ml-auto text-[11px] text-neutral-400">UI shell</div>
                      </div>

                      <div className="mt-3 rounded-3xl border border-dashed border-white/18 bg-neutral-900/35 px-4 py-6 text-center">
                        <div className="text-sm text-neutral-200">
                          Drag files here (later) — for now use Upload
                        </div>
                        <div className="mt-1 text-xs text-neutral-400">
                          Inbox keeps things unfiled until you’re ready to tag them.
                        </div>

                        <div className="mt-3 flex justify-center gap-2">
                          <button
                            onClick={openPicker}
                            className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                            style={oliveSoftStyle}
                          >
                            Upload
                          </button>
                          <button
                            onClick={() => alert("UI shell — add link modal later")}
                            className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                          >
                            Add link
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sections */}
                  <Section
                    title="Inbox"
                    subtitle="New / unfiled items. Tag when ready."
                    empty="Inbox is clear."
                    items={inboxItems}
                    panelInner={panelInner}
                    buttonBase={buttonBase}
                    oliveSoftStyle={oliveSoftStyle}
                    onPin={togglePin}
                    onPrimary={(id) => moveOutOfInbox(id)}
                    primaryLabel="File it"
                    onDelete={deleteFile}
                  />

                  <Section
                    title="Pinned"
                    subtitle="Your quick-access items."
                    empty="Nothing pinned."
                    items={pinnedItems}
                    panelInner={panelInner}
                    buttonBase={buttonBase}
                    oliveSoftStyle={oliveSoftStyle}
                    onPin={togglePin}
                    onPrimary={(id) => alert("UI shell — open")}
                    primaryLabel="Open"
                    onDelete={deleteFile}
                  />

                  <Section
                    title="Recent"
                    subtitle="Recency-first. Use filters when it grows."
                    empty="No files yet."
                    items={recentItems}
                    panelInner={panelInner}
                    buttonBase={buttonBase}
                    oliveSoftStyle={oliveSoftStyle}
                    onPin={togglePin}
                    onPrimary={(id) => alert("UI shell — open")}
                    primaryLabel="Open"
                    onDelete={deleteFile}
                  />

                  <div className="h-6" />
                </div>

                {/* Right panel: Filters */}
                {showRightPanel && (
                  <aside className="lg:col-span-4 space-y-4">
                    <div className={panelBase} style={oliveCardStyle}>
                      <div className="p-4">
                        <div className="text-sm font-semibold">Filters</div>
                        <div className="mt-1 text-xs text-neutral-400">
                          Organize by <span className="font-semibold text-neutral-200">Context</span> first, then Category.
                        </div>

                        <div className="mt-4 space-y-3">
                          {/* Context */}
                          <div className={cx(panelInner, "p-3")} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                            <div className="text-xs font-semibold text-neutral-300">Context</div>
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
                                  style={contextFilter === (o.id as any) ? oliveSoftStyle : undefined}
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
                          <div className={cx(panelInner, "p-3")} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                            <div className="text-xs font-semibold text-neutral-300">Category</div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {(["all", "School", "Work", "Life", "Finance", "Health", "Fitness", "Other"] as const).map(
                                (c) => (
                                  <button
                                    key={c}
                                    onClick={() => setCategoryFilter(c as any)}
                                    className={cx(
                                      "rounded-2xl border px-3 py-2 text-[11px] text-left transition",
                                      categoryFilter === c
                                        ? "bg-white/12 border-white/18 text-neutral-100"
                                        : "bg-white/6 border-white/12 text-neutral-200 hover:bg-white/10"
                                    )}
                                    style={categoryFilter === c ? oliveSoftStyle : undefined}
                                  >
                                    {c === "all" ? "All" : c}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {/* Type */}
                          <div className={cx(panelInner, "p-3")} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
                            <div className="text-xs font-semibold text-neutral-300">Type</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(["all", "pdf", "doc", "image", "audio", "link", "other"] as const).map((t) => (
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
                              MVP: recency-first list + filters. Later: “suggested category” on upload.
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
                          Files are organized by <span className="font-semibold">context</span> (personal vs group) and{" "}
                          <span className="font-semibold">category</span> (school/work/life). You can ignore both and just
                          search.
                        </div>
                        <div className="mt-3 rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-3">
                          <div className="text-xs text-neutral-400">
                            Inbox prevents “forced filing.” Tag later, when you’re not busy.
                          </div>
                        </div>
                      </div>
                    </div>
                  </aside>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Section(props: {
  title: string;
  subtitle: string;
  empty: string;
  items: FileItem[];
  panelInner: string;
  buttonBase: string;
  oliveSoftStyle: React.CSSProperties;
  onPin: (id: string) => void;
  onPrimary: (id: string) => void;
  primaryLabel: string;
  onDelete: (id: string) => void;
}) {
  const { title, subtitle, empty, items, panelInner, buttonBase, oliveSoftStyle, onPin, onPrimary, primaryLabel, onDelete } =
    props;

  return (
    <div className="rounded-3xl border border-white/10 bg-neutral-950/35 backdrop-blur">
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">{title}</div>
          <div className="ml-auto text-[11px] text-neutral-400">{items.length}</div>
        </div>
        <div className="mt-1 text-xs text-neutral-400">{subtitle}</div>
      </div>

      <div className="p-4">
        {items.length === 0 ? (
          <div className={cx(panelInner, "px-3 py-4")} style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <div className="text-sm text-neutral-200">{empty}</div>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((f) => (
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
                        <div className="text-sm font-semibold text-neutral-100 truncate">{f.name}</div>
                        <div className="mt-0.5 text-xs text-neutral-400">
                          {contextLabel(f.context)} • {f.category} • {formatDay(f.createdAt)} {formatTime(f.createdAt)}
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-500 whitespace-nowrap">{f.sizeLabel ?? "—"}</div>
                    </div>

                    {f.notes ? (
                      <div className="mt-2 text-[11px] text-neutral-500">{f.notes}</div>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className={cx(buttonBase, "bg-white/10 hover:bg-white/14 border-white/12")}
                        style={oliveSoftStyle}
                        onClick={() => onPrimary(f.id)}
                      >
                        {primaryLabel}
                      </button>
                      <button
                        className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                        onClick={() => onPin(f.id)}
                      >
                        {f.pinned ? "Unpin" : "Pin"}
                      </button>
                      <button
                        className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
                        onClick={() => onDelete(f.id)}
                      >
                        Delete
                      </button>
                      <button
                        className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12 text-neutral-300")}
                        onClick={() => alert("UI shell — move/tag modal later")}
                      >
                        Move / Tag
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
  );
}
