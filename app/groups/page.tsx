"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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

const YOUR_GROUPS: Group[] = [
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

function pillStyle(kind: Group["category"]) {
  const base = {
    borderColor: "rgba(17,17,17,0.10)",
    color: "#111111",
    backgroundColor: "rgba(17,17,17,0.04)",
  };

  const map: Record<Group["category"], any> = {
    Study: {
      backgroundColor: "rgba(17,17,17,0.04)",
      color: "#111111",
      borderColor: "rgba(17,17,17,0.10)",
    },
    Work: {
      backgroundColor: "rgba(17,17,17,0.06)",
      color: "#111111",
      borderColor: "rgba(17,17,17,0.12)",
    },
    Fitness: {
      backgroundColor: "rgba(85,107,47,0.14)",
      color: "#243016",
      borderColor: "rgba(85,107,47,0.28)",
    },
    Life: {
      backgroundColor: "rgba(85,107,47,0.09)",
      color: "#2F3A1F",
      borderColor: "rgba(85,107,47,0.20)",
    },
  };

  return map[kind] ?? base;
}

export default function GroupsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | Group["category"]>("All");
  const [showCreate, setShowCreate] = useState(false);

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

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <style>{`
        @keyframes jynxRing {
          0%   { transform: scale(1);   opacity: 0.22; }
          70%  { transform: scale(2.8); opacity: 0.00; }
          100% { transform: scale(2.8); opacity: 0.00; }
        }
      `}</style>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-neutral-200 bg-white hidden md:flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl border border-neutral-200 bg-neutral-100 flex items-center justify-center text-xs font-semibold">
                LOGO
              </div>
              <div>
                <div className="text-sm font-semibold">Jynx</div>
                <div className="text-xs text-neutral-500">Your schedule system</div>
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
                    ? { backgroundColor: OLIVE, color: "white", fontWeight: 600 }
                    : { color: "#404040" }
                }
              >
                <span>{t.label}</span>
                {t.active && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.18)" }}
                  >
                    Active
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Header */}
          <header className="border-b border-neutral-200 bg-white">
            <div className="max-w-6xl mx-auto px-6 py-6 flex justify-center">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="flex items-center gap-2">
                  <span className="relative inline-flex h-2.5 w-2.5">
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        backgroundColor: OLIVE,
                        animation: "jynxRing 2.8s ease-out infinite",
                      }}
                    />
                    <span
                      className="relative rounded-full h-2.5 w-2.5"
                      style={{ backgroundColor: OLIVE }}
                    />
                  </span>

                  <div className="text-lg font-semibold leading-tight">Groups</div>
                </div>

                <div className="text-xs text-neutral-500">
                  Shared structure · light accountability · clean by design
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="max-w-6xl mx-auto px-6 py-7 grid grid-cols-12 gap-8">
            {/* Left: Your Groups */}
            <section className="col-span-12 lg:col-span-7 space-y-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold">Your groups</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Private by default. Invite people when you’re ready.
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCreate(true)}
                    className="text-sm px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50"
                  >
                    Create group
                  </button>
                </div>

                <div className="space-y-3">
                  {YOUR_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      className="w-full text-left rounded-2xl border border-neutral-200 hover:bg-neutral-50 transition px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {g.name}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {g.description}
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                            <span className="px-2 py-0.5 rounded-full border border-neutral-200">
                              {g.privacy}
                            </span>
                            <span className="px-2 py-0.5 rounded-full border border-neutral-200">
                              {g.members} members
                            </span>
                            <span className="px-2 py-0.5 rounded-full border border-neutral-200">
                              Updated {g.updated}
                            </span>
                          </div>
                        </div>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                          style={pillStyle(g.category)}
                        >
                          {g.category}
                        </span>
                      </div>
                    </button>
                  ))}

                  {YOUR_GROUPS.length === 0 && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
                      <div className="text-sm font-semibold">No groups yet</div>
                      <div className="text-sm text-neutral-600 mt-2">
                        Create a private group and invite people by email.
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Find a Group */}
              <Card>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="text-sm font-semibold">Find a group</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Public groups you can join. Keep it simple.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search groups…"
                    className="flex-1 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                  />

                  <select
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as any)
                    }
                    className="sm:w-44 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
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
                      className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 hover:bg-neutral-50 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold text-neutral-900">
                            {g.name}
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">
                            {g.description}
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-[11px] text-neutral-500">
                            <span className="px-2 py-0.5 rounded-full border border-neutral-200">
                              {g.members} members
                            </span>
                            <span className="px-2 py-0.5 rounded-full border border-neutral-200">
                              Updated {g.updated}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <span
                            className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border"
                            style={pillStyle(g.category)}
                          >
                            {g.category}
                          </span>

                          <button
                            className="text-sm px-4 py-2 rounded-xl border border-neutral-200 hover:bg-white"
                            style={{ background: "rgba(85,107,47,0.06)" }}
                            onClick={() => alert("Join flow later")}
                          >
                            Join
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredPublic.length === 0 && (
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                      No groups found. Try a different search.
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Right: Insights + create CTA */}
            <aside className="col-span-12 lg:col-span-5 space-y-6">
              {/* AI-ish stats card (static) */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold">Jynx insights</div>
                    <div className="text-xs text-neutral-500 mt-0.5">
                      Personal stats & patterns (coming soon)
                    </div>
                  </div>

                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: "rgba(85,107,47,0.25)",
                      background: "rgba(85,107,47,0.08)",
                      color: "#2F3A1F",
                      fontWeight: 600,
                    }}
                  >
                    Preview
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <StatRow label="Groups joined" value="2" />
                  <StatRow label="Weekly check-ins" value="4" />
                  <StatRow label="Most common category" value="Study" />
                </div>

                <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  Once groups have activity, you’ll get a clean weekly summary: consistency,
                  focus windows, and what to tighten up.
                </div>
              </Card>

              {/* Create group helper */}
              <Card>
                <div className="text-sm font-semibold">Create a group</div>
                <div className="text-sm text-neutral-600 mt-2 leading-relaxed">
                  Keep it simple: one purpose, a few people, and a cadence. Private by default.
                </div>

                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 w-full text-sm px-4 py-3 rounded-xl border border-neutral-200 hover:bg-neutral-50"
                  style={{ background: "rgba(85,107,47,0.06)" }}
                >
                  Create group
                </button>

                <div className="mt-3 text-[11px] text-neutral-500">
                  You’ll be able to invite members by email.
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </div>

      {/* Create Group Modal (UI only) */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <div className="text-sm font-semibold">Create group</div>
          <div className="text-xs text-neutral-500 mt-1">
            UI only for now. Wiring later.
          </div>

          <div className="mt-4 space-y-3">
            <Field label="Group name">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                placeholder="e.g., F305 Study Group"
              />
            </Field>

            <Field label="Description (optional)">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                placeholder="What’s this group for?"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Privacy">
                <select className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200">
                  <option>Private</option>
                  <option>Public</option>
                </select>
              </Field>

              <Field label="Category">
                <select className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200">
                  <option>Study</option>
                  <option>Work</option>
                  <option>Fitness</option>
                  <option>Life</option>
                </select>
              </Field>
            </div>

            <Field label="Invite by email (optional)">
              <input
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
                placeholder="ben@iu.edu, friend@gmail.com"
              />
            </Field>
          </div>

          <div className="mt-5 flex gap-2 justify-end">
            <button
              onClick={() => setShowCreate(false)}
              className="text-sm px-4 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("Create flow later");
                setShowCreate(false);
              }}
              className="text-sm px-4 py-2 rounded-xl text-white"
              style={{ backgroundColor: OLIVE }}
            >
              Create
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6">
      {children}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-neutral-600">{label}</div>
      <div className="font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-neutral-600 mb-1">{label}</div>
      {children}
    </div>
  );
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.25)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
