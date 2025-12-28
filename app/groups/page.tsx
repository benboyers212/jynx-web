"use client";

import Link from "next/link";
import { useMemo, useState, useRef, useEffect } from "react";

const OLIVE = "#556B2F";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups", active: true },
  { label: "Schedule", href: "/" },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat" },
  { label: "Files", href: "/files" },
];

type Group = {
  id: string;
  name: string;
  description: string;
  members: number;
  privacy: "Public" | "Private";
  category: "Study" | "Fitness" | "Work" | "Life";
  updated: string;
};

const INITIAL_YOUR_GROUPS: Group[] = [
  {
    id: "g1",
    name: "F305 Study Group",
    description: "Exam reviews, problem sets, weekly cadence",
    members: 6,
    privacy: "Private",
    category: "Study",
    updated: "Today",
  },
  {
    id: "g2",
    name: "Gym Accountability",
    description: "3x/week check-ins + habit streaks",
    members: 4,
    privacy: "Private",
    category: "Fitness",
    updated: "Yesterday",
  },
];

const PUBLIC_GROUPS: Group[] = [
  {
    id: "p1",
    name: "Kelley — Finance Grind",
    description: "Study blocks, recruiting prep, accountability",
    members: 128,
    privacy: "Public",
    category: "Study",
    updated: "2h ago",
  },
  {
    id: "p2",
    name: "Morning Deep Work",
    description: "9–11 AM focus blocks. Minimal distractions.",
    members: 62,
    privacy: "Public",
    category: "Work",
    updated: "1d ago",
  },
  {
    id: "p3",
    name: "Sunday Reset Crew",
    description: "Plan week, batch chores, light cardio",
    members: 41,
    privacy: "Public",
    category: "Life",
    updated: "3d ago",
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pillStyleDark(kind: Group["category"]) {
  const base = {
    borderColor: "rgba(255,255,255,0.14)",
    color: "rgba(255,255,255,0.86)",
    backgroundColor: "rgba(255,255,255,0.06)",
  };

  const map: Record<Group["category"], any> = {
    Study: {
      backgroundColor: "rgba(255,255,255,0.06)",
      color: "rgba(255,255,255,0.88)",
      borderColor: "rgba(255,255,255,0.14)",
    },
    Work: {
      backgroundColor: "rgba(255,255,255,0.07)",
      color: "rgba(255,255,255,0.88)",
      borderColor: "rgba(255,255,255,0.16)",
    },
    Fitness: {
      backgroundColor: "rgba(85,107,47,0.18)",
      color: "rgba(235,245,230,0.95)",
      borderColor: "rgba(85,107,47,0.46)",
    },
    Life: {
      backgroundColor: "rgba(85,107,47,0.12)",
      color: "rgba(235,245,230,0.92)",
      borderColor: "rgba(85,107,47,0.36)",
    },
  };

  return map[kind] ?? base;
}

type ModalTab = "Details" | "People" | "Files";

const oliveCardStyle: React.CSSProperties = {
  borderColor: "rgba(85,107,47,0.60)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.42)",
};

const oliveSoftStyle: React.CSSProperties = {
  borderColor: "rgba(85,107,47,0.42)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function GroupsPage() {
  // Group assistant (chat UI only for now)
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantThread, setAssistantThread] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([
    {
      role: "assistant",
      text: "Tell me what you’re trying to do — create a group, find one to join, or set a cadence.",
    },
  ]);

  const assistantRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = assistantRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [assistantInput]);

  function submitGroupAssistant() {
    const msg = assistantInput.trim();
    if (!msg) return;

    setAssistantThread((t) => [...t, { role: "user", text: msg }]);
    setAssistantInput("");

    setTimeout(() => {
      setAssistantThread((t) => [
        ...t,
        {
          role: "assistant",
          text: "Got it. Once AI is wired, I’ll suggest a clean group structure + cadence + invite list.",
        },
      ]);
    }, 350);
  }

  const [yourGroups, setYourGroups] = useState<Group[]>(INITIAL_YOUR_GROUPS);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | Group["category"]>("All");
  const [showCreate, setShowCreate] = useState(false);

  // Create modal state
  const [createTab, setCreateTab] = useState<ModalTab>("Details");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivacy, setNewPrivacy] = useState<Group["privacy"]>("Private");
  const [newCategory, setNewCategory] = useState<Group["category"]>("Study");

  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState("");

  const [files, setFiles] = useState<string[]>([]);
  const [fileInput, setFileInput] = useState("");

  const filteredPublic = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PUBLIC_GROUPS.filter((g) => {
      const matchQ =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q);
      const matchCat = category === "All" || g.category === category;
      return matchQ && matchCat;
    });
  }, [query, category]);

  function resetCreateModal() {
    setCreateTab("Details");
    setNewName("");
    setNewDesc("");
    setNewPrivacy("Private");
    setNewCategory("Study");
    setPeople([]);
    setPersonInput("");
    setFiles([]);
    setFileInput("");
  }

  function openCreate() {
    resetCreateModal();
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
  }

  function addPerson() {
    const v = personInput.trim();
    if (!v) return;
    if (people.includes(v)) return;
    setPeople((p) => [...p, v]);
    setPersonInput("");
  }

  function removePerson(v: string) {
    setPeople((p) => p.filter((x) => x !== v));
  }

  function addFile() {
    const v = fileInput.trim();
    if (!v) return;
    if (files.includes(v)) return;
    setFiles((f) => [...f, v]);
    setFileInput("");
  }

  function removeFile(v: string) {
    setFiles((f) => f.filter((x) => x !== v));
  }

  function createGroupNow() {
    const name = newName.trim();
    if (!name) {
      alert("Please add a group name.");
      setCreateTab("Details");
      return;
    }

    const newGroup: Group = {
      id: `g_${Date.now()}_${uid()}`,
      name,
      description: newDesc.trim() || "No description yet",
      members: Math.max(1, people.length + 1),
      privacy: newPrivacy,
      category: newCategory,
      updated: "Just now",
    };

    setYourGroups((g) => [newGroup, ...g]);
    closeCreate();
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
        {/* Sidebar (tabs) */}
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

        {/* Main */}
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <header className="border-b border-white/10 bg-neutral-950/45 backdrop-blur shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: OLIVE,
                      boxShadow: "0 0 0 4px rgba(85,107,47,0.18)",
                    }}
                  />
                  <div className="text-sm font-semibold tracking-wide">Groups</div>
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  Shared structure · light accountability · clean by design
                </div>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={openCreate}
                  className="rounded-xl px-3 py-2 text-xs font-semibold border bg-white/6 hover:bg-white/10 transition"
                  style={oliveSoftStyle}
                >
                  Create group
                </button>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                  UI shell
                </div>
              </div>
            </div>
          </header>

          {/* Content scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-12 gap-6">
              {/* Left */}
              <section className="col-span-12 lg:col-span-7 space-y-4">
                {/* Your groups */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <div className="text-sm font-semibold">Your groups</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Private by default. Invite people when you’re ready.
                        </div>
                      </div>
                      <button
                        onClick={openCreate}
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                        style={oliveSoftStyle}
                      >
                        Create group
                      </button>
                    </div>

                    <div className="space-y-3">
                      {yourGroups.map((g) => (
                        <button
                          key={g.id}
                          className="w-full text-left rounded-3xl border border-white/12 bg-neutral-900/35 hover:bg-white/6 transition px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-neutral-100 truncate">
                                {g.name}
                              </div>
                              <div className="text-xs text-neutral-400 mt-1 truncate">
                                {g.description}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
                                <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                  {g.privacy}
                                </span>
                                <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                  {g.members} members
                                </span>
                                <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                  Updated {g.updated}
                                </span>
                              </div>
                            </div>

                            <span
                              className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border shrink-0"
                              style={pillStyleDark(g.category)}
                            >
                              {g.category}
                            </span>
                          </div>
                        </button>
                      ))}

                      {yourGroups.length === 0 && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold">No groups yet</div>
                          <div className="text-sm text-neutral-300 mt-2">
                            Create a private group and invite people by email.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Find a group */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="text-sm font-semibold">Find a group</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Public groups you can join. Keep it simple.
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search groups…"
                        className="flex-1 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                      />

                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value as any)}
                        className="sm:w-44 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                      >
                        <option value="All">All</option>
                        <option value="Study">Study</option>
                        <option value="Work">Work</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Life">Life</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      {filteredPublic.map((g) => (
                        <div
                          key={g.id}
                          className="rounded-3xl border border-white/12 bg-neutral-900/35 px-4 py-4 hover:bg-white/6 transition"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-neutral-100 truncate">
                                {g.name}
                              </div>
                              <div className="text-xs text-neutral-400 mt-1 truncate">
                                {g.description}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
                                <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                  {g.members} members
                                </span>
                                <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                  Updated {g.updated}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span
                                className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                                style={pillStyleDark(g.category)}
                              >
                                {g.category}
                              </span>

                              <button
                                className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                                style={oliveSoftStyle}
                                onClick={() => alert("Join flow later")}
                              >
                                Join
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {filteredPublic.length === 0 && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5 text-sm text-neutral-300">
                          No groups found. Try a different search.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Right */}
              <aside className="col-span-12 lg:col-span-5 space-y-4">
                {/* Insights */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm font-semibold">Jynx insights</div>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          Personal stats & patterns (coming soon)
                        </div>
                      </div>

                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full border bg-white/6"
                        style={{
                          borderColor: "rgba(85,107,47,0.35)",
                          color: "rgba(235,245,230,0.92)",
                        }}
                      >
                        Preview
                      </span>
                    </div>

                    <div className="space-y-3 text-sm">
                      <StatRowDark label="Groups joined" value={`${yourGroups.length}`} />
                      <StatRowDark label="Weekly check-ins" value="4" />
                      <StatRowDark label="Most common category" value="Study" />
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/35 p-4 text-sm text-neutral-300">
                      Once groups have activity, you’ll get a clean weekly summary: consistency,
                      focus windows, and what to tighten up.
                    </div>
                  </div>
                </div>

                {/* Group assistant */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold">Group assistant</div>
                      <div className="text-xs text-neutral-400">Preview</div>
                    </div>

                    <div className="text-sm text-neutral-200 leading-relaxed">
                      Describe what you want — I’ll help you create a group or point you to one
                      that fits your goals.
                    </div>

                    {/* Mini thread */}
                    <div className="mt-4 space-y-2">
                      {assistantThread.slice(-4).map((m, idx) => (
                        <div
                          key={idx}
                          className={cx(
                            "rounded-2xl border px-3 py-2 text-sm",
                            m.role === "assistant"
                              ? "border-white/12 bg-neutral-900/35 text-neutral-200"
                              : "border-white/12 bg-white/6 text-neutral-100"
                          )}
                          style={m.role === "assistant" ? undefined : oliveSoftStyle}
                        >
                          <span className="text-[11px] text-neutral-400 mr-2">
                            {m.role === "assistant" ? "Jynx" : "You"}:
                          </span>
                          {m.text}
                        </div>
                      ))}
                    </div>

                    {/* Input */}
                    <div className="mt-4 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-3">
                      <textarea
                        ref={assistantRef}
                        value={assistantInput}
                        onChange={(e) => setAssistantInput(e.target.value)}
                        placeholder='Example: "Help me create a study group for F305 and schedule weekly check-ins."'
                        rows={1}
                        className="w-full resize-none bg-transparent outline-none text-sm text-neutral-100 placeholder:text-neutral-500 leading-relaxed"
                        style={{ height: 0 }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            submitGroupAssistant();
                          }
                        }}
                      />

                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500">
                          Enter to send • Shift+Enter for new line
                        </span>
                        <button
                          onClick={submitGroupAssistant}
                          disabled={!assistantInput.trim()}
                          className={cx(
                            "ml-auto rounded-xl px-3 py-1.5 text-xs font-semibold border transition",
                            assistantInput.trim()
                              ? "bg-white/10 hover:bg-white/14 border-white/12"
                              : "bg-white/5 border-white/5 text-neutral-500 cursor-not-allowed"
                          )}
                          style={assistantInput.trim() ? oliveSoftStyle : undefined}
                        >
                          Send
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-neutral-500">
                      (Preview) This will submit to the AI once it’s wired.
                    </div>
                  </div>
                </div>

                {/* Create group helper */}
                <div className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                  <div className="p-4">
                    <div className="text-sm font-semibold">Create a group</div>
                    <div className="text-sm text-neutral-200 mt-2 leading-relaxed">
                      Keep it simple: one purpose, a few people, and a cadence. Private by default.
                    </div>

                    <button
                      onClick={openCreate}
                      className="mt-4 w-full rounded-2xl px-4 py-3 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                      style={oliveSoftStyle}
                    >
                      Create group
                    </button>

                    <div className="mt-3 text-[11px] text-neutral-500">
                      You’ll be able to invite members by email.
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreate && (
        <ModalDark onClose={closeCreate}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Create group</div>
              <div className="text-xs text-neutral-400 mt-1">
                Local UI for now — will add to “Your groups”.
              </div>
            </div>

            <button
              onClick={closeCreate}
              className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-2 flex-wrap">
            {(["Details", "People", "Files"] as ModalTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setCreateTab(t)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                  createTab === t
                    ? "bg-white/12 border-white/14"
                    : "bg-white/6 border-white/10 hover:bg-white/10"
                )}
                style={createTab === t ? oliveSoftStyle : undefined}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {createTab === "Details" && (
              <div className="space-y-3">
                <FieldDark label="Group name">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="e.g., F305 Study Group"
                  />
                </FieldDark>

                <FieldDark label="Description (optional)">
                  <input
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="What’s this group for?"
                  />
                </FieldDark>

                <div className="grid grid-cols-2 gap-3">
                  <FieldDark label="Privacy">
                    <select
                      value={newPrivacy}
                      onChange={(e) => setNewPrivacy(e.target.value as any)}
                      className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    >
                      <option value="Private">Private</option>
                      <option value="Public">Public</option>
                    </select>
                  </FieldDark>

                  <FieldDark label="Category">
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    >
                      <option value="Study">Study</option>
                      <option value="Work">Work</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Life">Life</option>
                    </select>
                  </FieldDark>
                </div>
              </div>
            )}

            {createTab === "People" && (
              <div>
                <div className="text-sm text-neutral-200">
                  Add a few people (emails or names). UI-only for now.
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={personInput}
                    onChange={(e) => setPersonInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="e.g., dylan@gmail.com"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addPerson();
                    }}
                  />
                  <button
                    onClick={addPerson}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                    style={oliveSoftStyle}
                  >
                    Add
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {people.length === 0 ? (
                    <div className="text-sm text-neutral-400">No people added yet.</div>
                  ) : (
                    people.map((p) => (
                      <div
                        key={p}
                        className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2"
                      >
                        <div className="text-sm text-neutral-100">{p}</div>
                        <button
                          onClick={() => removePerson(p)}
                          className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {createTab === "Files" && (
              <div>
                <div className="text-sm text-neutral-200">
                  Add files attached to the group (names/links for now).
                </div>

                <div className="mt-3 flex gap-2">
                  <input
                    value={fileInput}
                    onChange={(e) => setFileInput(e.target.value)}
                    className="flex-1 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    placeholder="e.g., Exam 1 Formula Sheet.pdf"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addFile();
                    }}
                  />
                  <button
                    onClick={addFile}
                    className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 hover:bg-white/14 transition"
                    style={oliveSoftStyle}
                  >
                    Add
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {files.length === 0 ? (
                    <div className="text-sm text-neutral-400">No files added yet.</div>
                  ) : (
                    files.map((f) => (
                      <div
                        key={f}
                        className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2"
                      >
                        <div className="text-sm text-neutral-100">{f}</div>
                        <button
                          onClick={() => removeFile(f)}
                          className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-2 justify-end">
            <button
              onClick={closeCreate}
              className="rounded-2xl px-3 py-2 text-xs font-semibold border border-white/12 bg-transparent hover:bg-white/6 transition"
            >
              Cancel
            </button>
            <button
              onClick={createGroupNow}
              className="rounded-2xl px-3 py-2 text-xs font-semibold text-white"
              style={{ backgroundColor: OLIVE }}
            >
              Create
            </button>
          </div>
        </ModalDark>
      )}
    </main>
  );
}

function StatRowDark({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-neutral-300">{label}</div>
      <div className="font-semibold text-neutral-100">{value}</div>
    </div>
  );
}

function FieldDark({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-400 mb-1">{label}</div>
      {children}
    </div>
  );
}

function ModalDark({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-neutral-950/85 backdrop-blur p-6"
        style={{
          boxShadow: "0 0 0 1px rgba(85,107,47,0.25), 0 30px 90px rgba(0,0,0,0.75)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
