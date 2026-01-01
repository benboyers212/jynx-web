"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";

const OLIVE = "#556B2F";

/** visibility (solves “class isn’t public/private”) */
type GroupVisibility = "Public" | "Private" | "Verified";

/** add Class mode */
type GroupMode = "Class" | "Study" | "Accountability" | "Project" | "Light";
type GroupCategory = "Study" | "Fitness" | "Work" | "Life";

/** class-specific data shell */
type ClassStats = {
  avgTimePerWeek: string; // "4.2 hrs"
  exam1Avg: string; // "7.1 hrs"
  exam2Avg: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Very hard";
  mostDifficultConcepts: string[];
};

type UpcomingAssignment = {
  title: string;
  due: string; // "Thu 11:59 PM"
  estTime: string; // "~45 min"
};

type ClassInfo = {
  schoolLabel: string; // "Indiana University"
  courseCode: string; // "F305"
  courseTitle: string; // "Financial Management"
  instructor: string; // "Prof. Kim"
  term: string; // "Spring 2026"
  verifiedRuleLabel: string; // "IU email required" / "Request to join"
  upcomingAssignments: UpcomingAssignment[];
  stats: ClassStats;
};

type Group = {
  id: string;
  name: string;
  description: string;
  members: number;

  visibility: GroupVisibility;
  category: GroupCategory;

  // Purpose / “what is this for?”
  mode: GroupMode;

  // Expectations preview (light)
  cadence: string;
  timeCommit: string;
  structure: "Loose" | "Moderate" | "Structured";
  scheduleRelevant?: boolean;
  activityLabel: string;

  /** chat rules (UI shell only) */
  chatEnabled?: boolean; // only true for Private groups (for now)
  memberLimit?: number; // 20 for Private unless org (later)

  /** class shell */
  classInfo?: ClassInfo;
};

const INITIAL_YOUR_GROUPS: Group[] = [
  {
    id: "g1",
    name: "F305 — Financial Management",
    description: "Course hub: assignments + pacing insights (verified)",
    members: 186,
    visibility: "Verified",
    category: "Study",
    mode: "Class",
    cadence: "Weekly rhythm",
    timeCommit: "~3–6 hrs/week",
    structure: "Structured",
    scheduleRelevant: true,
    activityLabel: "Active",
    chatEnabled: false,
    classInfo: {
      schoolLabel: "Indiana University",
      courseCode: "F305",
      courseTitle: "Financial Management",
      instructor: "Prof. Kim",
      term: "Spring 2026",
      verifiedRuleLabel: "IU email required (MVP)",
      upcomingAssignments: [
        { title: "HW 3 — Time Value of Money", due: "Thu 11:59 PM", estTime: "~45–60 min" },
        { title: "Quiz — WACC Concepts", due: "Mon 9:00 AM", estTime: "~15 min" },
      ],
      stats: {
        avgTimePerWeek: "4.2 hrs",
        exam1Avg: "7.1 hrs",
        exam2Avg: "8.0 hrs",
        difficulty: "Hard",
        mostDifficultConcepts: ["WACC sensitivities", "Capital structure intuition", "Real vs nominal rates"],
      },
    },
  },
  {
    id: "g2",
    name: "F305 Study Group",
    description: "Exam reviews, problem sets, weekly cadence",
    members: 6,
    visibility: "Private",
    category: "Study",
    mode: "Study",
    cadence: "2–3x/week check-ins",
    timeCommit: "~30–60 min/session",
    structure: "Moderate",
    scheduleRelevant: true,
    activityLabel: "Active",
    chatEnabled: true,
    memberLimit: 20,
  },
  {
    id: "g3",
    name: "Gym Accountability",
    description: "3x/week check-ins (no streak pressure)",
    members: 4,
    visibility: "Private",
    category: "Fitness",
    mode: "Accountability",
    cadence: "3x/week check-ins",
    timeCommit: "~5 min/check-in",
    structure: "Loose",
    scheduleRelevant: false,
    activityLabel: "Active",
    chatEnabled: true,
    memberLimit: 20,
  },
];

const PUBLIC_GROUPS: Group[] = [
  {
    id: "p1",
    name: "Kelley — Finance Grind",
    description: "Study blocks, recruiting prep, accountability",
    members: 128,
    visibility: "Public",
    category: "Study",
    mode: "Study",
    cadence: "Daily focus block (optional)",
    timeCommit: "~45–90 min",
    structure: "Moderate",
    scheduleRelevant: true,
    activityLabel: "Active",
    chatEnabled: false,
  },
  {
    id: "p2",
    name: "Morning Deep Work",
    description: "9–11 AM focus blocks. Minimal distractions.",
    members: 62,
    visibility: "Public",
    category: "Work",
    mode: "Accountability",
    cadence: "Weekdays",
    timeCommit: "~60–120 min",
    structure: "Structured",
    scheduleRelevant: true,
    activityLabel: "Active",
    chatEnabled: false,
  },
  {
    id: "p3",
    name: "Sunday Reset Crew",
    description: "Plan week, batch chores, light cardio",
    members: 41,
    visibility: "Public",
    category: "Life",
    mode: "Light",
    cadence: "Weekly",
    timeCommit: "~30–60 min",
    structure: "Loose",
    scheduleRelevant: false,
    activityLabel: "Active",
    chatEnabled: false,
  },
];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function pillStyleDark(kind: GroupCategory) {
  const map: Record<GroupCategory, any> = {
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
  return map[kind];
}

function modePillStyle(mode: GroupMode) {
  const map: Record<GroupMode, CSSProperties> = {
    Class: {
      backgroundColor: "rgba(85,107,47,0.16)",
      borderColor: "rgba(85,107,47,0.44)",
      color: "rgba(235,245,230,0.95)",
    },
    Study: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.88)",
    },
    Accountability: {
      backgroundColor: "rgba(85,107,47,0.14)",
      borderColor: "rgba(85,107,47,0.40)",
      color: "rgba(235,245,230,0.95)",
    },
    Project: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.88)",
    },
    Light: {
      backgroundColor: "rgba(255,255,255,0.045)",
      borderColor: "rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.82)",
    },
  };
  return map[mode];
}

function visibilityPillStyle(v: GroupVisibility) {
  const map: Record<GroupVisibility, CSSProperties> = {
    Public: {
      backgroundColor: "rgba(255,255,255,0.05)",
      borderColor: "rgba(255,255,255,0.12)",
      color: "rgba(255,255,255,0.85)",
    },
    Private: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderColor: "rgba(255,255,255,0.14)",
      color: "rgba(255,255,255,0.88)",
    },
    Verified: {
      backgroundColor: "rgba(85,107,47,0.12)",
      borderColor: "rgba(85,107,47,0.40)",
      color: "rgba(235,245,230,0.95)",
    },
  };
  return map[v];
}

type CreateTab = "Details" | "People" | "Files";
type GroupModalTab =
  | "Overview"
  | "Expectations"
  | "People"
  | "Files"
  | "Schedule"
  | "Chat"
  | "Class"
  | "Assignments"
  | "Insights";

const oliveCardStyle: CSSProperties = {
  borderColor: "rgba(85,107,47,0.60)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.42)",
};

const oliveSoftStyle: CSSProperties = {
  borderColor: "rgba(85,107,47,0.42)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
};

const primaryPanelStyle: CSSProperties = {
  borderColor: "rgba(85,107,47,0.65)",
  boxShadow: "0 0 0 1px rgba(85,107,47,0.45), 0 26px 90px rgba(0,0,0,0.62)",
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function GroupsPage() {
  const [yourGroups, setYourGroups] = useState<Group[]>(INITIAL_YOUR_GROUPS);

  // Your groups search
  const [yourQuery, setYourQuery] = useState("");
  const [yourCategory, setYourCategory] = useState<"All" | GroupCategory>("All");

  // Find group modal (this replaces the on-page discovery blocks)
  const [showFind, setShowFind] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [findCategory, setFindCategory] = useState<"All" | GroupCategory>("All");
  const [intent, setIntent] = useState<"all" | "class" | "study" | "consistent" | "project" | "people">("all");

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createTab, setCreateTab] = useState<CreateTab>("Details");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVisibility, setNewVisibility] = useState<GroupVisibility>("Private");
  const [newCategory, setNewCategory] = useState<GroupCategory>("Study");
  const [newMode, setNewMode] = useState<GroupMode>("Study");

  const [people, setPeople] = useState<string[]>([]);
  const [personInput, setPersonInput] = useState("");

  const [files, setFiles] = useState<string[]>([]);
  const [fileInput, setFileInput] = useState("");

  // Group assistant (UI shell)
  const [assistantInput, setAssistantInput] = useState("");

  // Group modal
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [groupModalTab, setGroupModalTab] = useState<GroupModalTab>("Overview");
  const [groupExpanded, setGroupExpanded] = useState(false);

  // Assistant collapse inside modal (reduces competition)
  const [assistantCollapsed, setAssistantCollapsed] = useState(true);

  // Chat UI shell (private groups only)
  const [chatDraft, setChatDraft] = useState("");
  const [chatMsgs, setChatMsgs] = useState<Array<{ id: string; who: string; text: string; ts: string }>>([
    { id: "m1", who: "You", text: "Quick check-in: when are we meeting?", ts: "Today 2:14 PM" },
    { id: "m2", who: "Dylan", text: "I can do 6:30 after class.", ts: "Today 2:16 PM" },
  ]);

  const filteredYourGroups = useMemo(() => {
    const q = yourQuery.trim().toLowerCase();
    return yourGroups.filter((g) => {
      const matchQ = !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
      const matchCat = yourCategory === "All" || g.category === yourCategory;
      return matchQ && matchCat;
    });
  }, [yourGroups, yourQuery, yourCategory]);

  const filteredPublic = useMemo(() => {
    const q = findQuery.trim().toLowerCase();

    function matchIntent(g: Group) {
      if (intent === "all") return true;
      if (intent === "class") return g.mode === "Class" || g.visibility === "Verified";
      if (intent === "study") return g.mode === "Study" || g.category === "Study";
      if (intent === "consistent") return g.mode === "Accountability";
      if (intent === "project") return g.mode === "Project" || g.category === "Work";
      if (intent === "people") return g.mode === "Light" || g.category === "Life";
      return true;
    }

    return PUBLIC_GROUPS.filter((g) => {
      const matchQ = !q || g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
      const matchCat = findCategory === "All" || g.category === findCategory;
      return matchQ && matchCat && matchIntent(g);
    });
  }, [findQuery, findCategory, intent]);

  function resetCreateModal() {
    setCreateTab("Details");
    setNewName("");
    setNewDesc("");
    setNewVisibility("Private");
    setNewCategory("Study");
    setNewMode("Study");
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

  function openFind() {
    setShowFind(true);
  }

  function closeFind() {
    setShowFind(false);
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

    // Rules
    const visibility: GroupVisibility = newMode === "Class" ? "Verified" : newVisibility;
    const chatEnabled = visibility === "Private"; // MVP: only private has chat
    const memberLimit = visibility === "Private" ? 20 : undefined;

    // Member limit enforcement for private groups
    const proposedMembers = Math.max(1, people.length + 1);
    if (visibility === "Private" && proposedMembers > 20) {
      alert("Private groups are limited to 20 people for now. (Org limits can be added later.)");
      setCreateTab("People");
      return;
    }

    const newGroup: Group = {
      id: `g_${Date.now()}_${uid()}`,
      name,
      description: newDesc.trim() || "No description yet",
      members: proposedMembers,
      visibility,
      category: newCategory,
      mode: newMode,

      cadence:
        newMode === "Class"
          ? "Weekly rhythm"
          : newMode === "Study"
          ? "2–3x/week check-ins"
          : newMode === "Accountability"
          ? "3x/week check-ins"
          : newMode === "Project"
          ? "Weekly touchpoint"
          : "Optional",
      timeCommit:
        newMode === "Class"
          ? "~3–6 hrs/week"
          : newMode === "Study"
          ? "~30–60 min/session"
          : newMode === "Accountability"
          ? "~5 min/check-in"
          : "~30–60 min",
      structure:
        newMode === "Accountability" || newMode === "Light"
          ? "Loose"
          : newMode === "Class"
          ? "Structured"
          : "Moderate",
      scheduleRelevant: newMode === "Study" || newMode === "Accountability" || newMode === "Class",
      activityLabel: "Active",

      chatEnabled,
      memberLimit,

      classInfo:
        newMode === "Class"
          ? {
              schoolLabel: "Your University",
              courseCode: "COURSE",
              courseTitle: "Course Title",
              instructor: "Instructor",
              term: "Term",
              verifiedRuleLabel: "Verified community (MVP)",
              upcomingAssignments: [],
              stats: {
                avgTimePerWeek: "—",
                exam1Avg: "—",
                exam2Avg: "—",
                difficulty: "Medium",
                mostDifficultConcepts: [],
              },
            }
          : undefined,
    };

    setYourGroups((g) => [newGroup, ...g]);
    closeCreate();
  }

  function openGroupModal(g: Group) {
    setOpenGroup(g);
    setGroupExpanded(false);
    setAssistantCollapsed(true);
    setChatDraft("");

    if (g.mode === "Class") setGroupModalTab("Assignments");
    else setGroupModalTab(g.visibility === "Private" ? "Chat" : "Overview");
  }

  function closeGroupModal() {
    setOpenGroup(null);
    setGroupExpanded(false);
    setChatDraft("");
  }

  function sendChat() {
    if (!openGroup?.chatEnabled) return;
    const txt = chatDraft.trim();
    if (!txt) return;
    setChatMsgs((m) => [...m, { id: uid(), who: "You", text: txt, ts: "Just now" }]);
    setChatDraft("");
  }

  const canShowChat = !!openGroup?.chatEnabled && openGroup.visibility === "Private";

  const modalTabs: GroupModalTab[] = useMemo(() => {
    if (!openGroup) return ["Overview"];
    if (openGroup.mode === "Class") {
      return ["Assignments", "Insights", "Schedule", "Files", "Class"];
    }
    const base: GroupModalTab[] = ["Overview", "Expectations", "Schedule", "Files", "People"];
    if (canShowChat) base.unshift("Chat");
    return base;
  }, [openGroup, canShowChat]);

  const classInfo = openGroup?.classInfo;
  const classStats = classInfo?.stats;

  return (
    <main className="h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background: "radial-gradient(circle at 30% 30%, rgba(85,107,47,0.90), rgba(17,17,17,0) 60%)",
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-15 bg-white/20" />
      </div>

      {/* Content */}
      <div className="relative h-full overflow-y-auto">
        {/* WIDER container fixes side “blank space” */}
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Top row */}
          <div className="flex items-start justify-between gap-4">
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
                Structure + expectations — not feeds. (Class hubs focus on pacing + assignments.)
              </div>
            </div>

            {/* BUTTON PAIR: Create (primary) + Find (secondary) */}
            <div className="flex items-center gap-2">
              <button
                onClick={openCreate}
                className="rounded-xl px-3 py-2 text-xs font-semibold text-white transition"
                style={{
                  backgroundColor: OLIVE,
                  boxShadow: "0 0 0 1px rgba(85,107,47,0.45), 0 18px 45px rgba(0,0,0,0.25)",
                }}
              >
                Create group
              </button>

              <button
                onClick={openFind}
                className="rounded-xl px-3 py-2 text-xs font-semibold border bg-white/6 hover:bg-white/10 transition"
                style={oliveSoftStyle}
              >
                Find group
              </button>

              <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                UI shell
              </div>
            </div>
          </div>

          {/* Layout: more balanced columns + bigger gutter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              {/* Your groups */}
              <section className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="text-sm font-semibold">Your groups</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Private groups have chat (max 20). Verified class hubs show aggregated stats + assignments.
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                      value={yourQuery}
                      onChange={(e) => setYourQuery(e.target.value)}
                      placeholder="Search groups…"
                      className="flex-1 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    />
                    <select
                      value={yourCategory}
                      onChange={(e) => setYourCategory(e.target.value as any)}
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
                    {filteredYourGroups.map((g) => {
                      const isClass = g.mode === "Class" && g.visibility === "Verified";
                      return (
                        <button
                          key={g.id}
                          onClick={() => openGroupModal(g)}
                          className={cx(
                            "w-full text-left rounded-3xl border border-white/12 bg-neutral-900/35 hover:bg-white/6 transition px-4 py-4",
                            isClass && "bg-[rgba(255,255,255,0.06)]"
                          )}
                          style={isClass ? primaryPanelStyle : undefined}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                              style={{
                                backgroundColor: g.scheduleRelevant ? OLIVE : "rgba(255,255,255,0.16)",
                                boxShadow: g.scheduleRelevant ? "0 0 0 4px rgba(85,107,47,0.16)" : "none",
                              }}
                              title={g.scheduleRelevant ? "Touches your schedule" : "Passive group"}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-neutral-100 truncate">{g.name}</div>
                                  <div className="text-xs text-neutral-400 mt-1 truncate">{g.description}</div>

                                  {isClass && (
                                    <div className="mt-2 text-[11px] text-neutral-300">
                                      See how students pace this class — before you fall behind.
                                    </div>
                                  )}

                                  <div className="mt-2 text-[11px] text-neutral-400">
                                    <span className="text-neutral-300 font-semibold">Expectations:</span>{" "}
                                    {g.cadence} · {g.timeCommit} · {g.structure}
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
                                    <span className="px-2 py-0.5 rounded-full border" style={visibilityPillStyle(g.visibility)}>
                                      {g.visibility}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                      {g.members} members
                                    </span>
                                    {g.visibility === "Private" && (
                                      <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                        Chat • max {g.memberLimit ?? 20}
                                      </span>
                                    )}
                                    <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                                      {g.activityLabel}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-full border" style={modePillStyle(g.mode)}>
                                      {g.mode}
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
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {filteredYourGroups.length === 0 && (
                      <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                        <div className="text-sm font-semibold">No groups found</div>
                        <div className="text-sm text-neutral-300 mt-2">Try a different search or category.</div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* IMPORTANT CHANGE:
                  - Removed the on-page “What are you trying to do?” + “Explore groups”
                  - Discovery now lives entirely inside Find group modal
                  This reduces clutter and fixes the “long left column” issue.
              */}
            </div>

            {/* Right panel: sticky to balance visual weight */}
            <aside className="lg:col-span-5 space-y-6 lg:sticky lg:top-6 self-start">
              <section className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Group assistant</div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Find groups, understand expectations, keep it quiet.
                      </div>
                    </div>
                    <div className="text-[11px] text-neutral-500">UI shell</div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900/30 p-3">
                    <div className="text-[11px] text-neutral-500">
                      Example: “Is there a class hub for F305?” or “What does this group expect?”
                    </div>

                    <div className="mt-3 flex gap-2">
                      <input
                        value={assistantInput}
                        onChange={(e) => setAssistantInput(e.target.value)}
                        placeholder="Ask about groups…"
                        className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-white/10"
                      />
                      <button
                        onClick={() => {
                          if (!assistantInput.trim()) return;
                          alert("UI shell — assistant response later");
                          setAssistantInput("");
                        }}
                        className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/8 hover:bg-white/12 transition border-white/10"
                        style={oliveSoftStyle}
                      >
                        Send
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900/30 px-3 py-3">
                    <div className="text-xs font-semibold text-neutral-200">Design rule</div>
                    <div className="mt-1 text-sm text-neutral-300 leading-relaxed">
                      Groups are structure + expectations. No feed. No noise.
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border bg-white/6 backdrop-blur" style={oliveCardStyle}>
                <div className="p-4">
                  <div className="text-sm font-semibold">Cheating risk (MVP)</div>
                  <div className="mt-2 text-sm text-neutral-300 leading-relaxed">
                    Public groups have no chat. Private groups can chat (max 20) for real coordination.
                    Verified class hubs emphasize pacing + assignments over messaging.
                  </div>
                  <div className="mt-3 rounded-2xl border border-white/10 bg-neutral-900/30 px-3 py-3">
                    <div className="text-xs text-neutral-400">
                      Later: add “study-safe” guardrails + moderation tools if needed.
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>

      {/* Find Group Modal (now the only discovery surface) */}
      {showFind && (
        <ModalDark onClose={closeFind} maxWidthClass="max-w-4xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Find a group</div>
              <div className="text-xs text-neutral-400 mt-1">
                Public groups don’t have chat (MVP). Verified class hubs are gated.
              </div>
            </div>

            <button
              onClick={closeFind}
              className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>

          {/* Intent chips (moved here; removed from main page) */}
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: "all", label: "All" },
              { id: "class", label: "Join a class hub" },
              { id: "study", label: "Study for a class" },
              { id: "consistent", label: "Stay consistent" },
              { id: "project", label: "Work on a project" },
              { id: "people", label: "Meet people" },
            ].map((x) => (
              <button
                key={x.id}
                onClick={() => setIntent(x.id as any)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                  intent === (x.id as any) ? "bg-white/12 border-white/14" : "bg-white/6 border-white/10 hover:bg-white/10"
                )}
                style={intent === (x.id as any) ? oliveSoftStyle : undefined}
              >
                {x.label}
              </button>
            ))}
          </div>

          {/* Search + filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <input
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Search groups…"
              className="flex-1 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
            />
            <select
              value={findCategory}
              onChange={(e) => setFindCategory(e.target.value as any)}
              className="sm:w-44 rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
            >
              <option value="All">All</option>
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Fitness">Fitness</option>
              <option value="Life">Life</option>
            </select>
          </div>

          {/* Results */}
          <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {filteredPublic.map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  closeFind();
                  openGroupModal(g);
                }}
                className="w-full text-left rounded-3xl border border-white/12 bg-neutral-900/35 px-4 py-4 hover:bg-white/6 transition"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: g.scheduleRelevant ? OLIVE : "rgba(255,255,255,0.16)",
                      boxShadow: g.scheduleRelevant ? "0 0 0 4px rgba(85,107,47,0.16)" : "none",
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-100 truncate">{g.name}</div>
                        <div className="text-xs text-neutral-400 mt-1 truncate">{g.description}</div>

                        <div className="mt-2 text-[11px] text-neutral-400">
                          <span className="text-neutral-300 font-semibold">Expectations:</span>{" "}
                          {g.cadence} · {g.timeCommit} · {g.structure}
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-neutral-300">
                          <span className="px-2 py-0.5 rounded-full border" style={visibilityPillStyle(g.visibility)}>
                            {g.visibility}
                          </span>
                          <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                            {g.members} members
                          </span>
                          <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                            {g.activityLabel}
                          </span>
                          <span className="px-2 py-0.5 rounded-full border" style={modePillStyle(g.mode)}>
                            {g.mode}
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

                        <span className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/10 border-white/12 text-neutral-200">
                          View
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {filteredPublic.length === 0 && (
              <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5 text-sm text-neutral-300">
                No groups found. Try a different search.
              </div>
            )}
          </div>
        </ModalDark>
      )}

      {/* Create Group Modal */}
      {showCreate && (
        <ModalDark onClose={closeCreate}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">Create group</div>
              <div className="text-xs text-neutral-400 mt-1">Private = chat (max 20). Class mode forces Verified.</div>
            </div>

            <button
              onClick={closeCreate}
              className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 flex gap-2 flex-wrap">
            {(["Details", "People", "Files"] as CreateTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setCreateTab(t)}
                className={cx(
                  "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                  createTab === t ? "bg-white/12 border-white/14" : "bg-white/6 border-white/10 hover:bg-white/10"
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

                  <FieldDark label="Mode (purpose)">
                    <select
                      value={newMode}
                      onChange={(e) => {
                        const next = e.target.value as GroupMode;
                        setNewMode(next);
                        if (next === "Class") setNewVisibility("Verified");
                      }}
                      className="w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10"
                    >
                      <option value="Class">Class (Verified)</option>
                      <option value="Study">Study</option>
                      <option value="Accountability">Accountability</option>
                      <option value="Project">Project</option>
                      <option value="Light">Light</option>
                    </select>
                  </FieldDark>
                </div>

                <FieldDark label="Visibility">
                  <select
                    value={newMode === "Class" ? "Verified" : newVisibility}
                    onChange={(e) => setNewVisibility(e.target.value as any)}
                    disabled={newMode === "Class"}
                    className={cx(
                      "w-full rounded-2xl border border-white/12 bg-neutral-900/35 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/10",
                      newMode === "Class" && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    <option value="Private">Private (chat, max 20)</option>
                    <option value="Public">Public (no chat)</option>
                    <option value="Verified">Verified (class/org)</option>
                  </select>

                  {newMode === "Class" && (
                    <div className="mt-2 text-[11px] text-neutral-500">
                      Class hubs aren’t public/private — they’re verified communities (e.g., school email gate).
                    </div>
                  )}
                </FieldDark>
              </div>
            )}

            {createTab === "People" && (
              <div>
                <div className="text-sm text-neutral-200">Add people (emails or names). Private groups are max 20.</div>

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
                <div className="text-sm text-neutral-200">Attach files (names/links for now).</div>

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

      {/* Group Modal */}
      {openGroup && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70" onClick={closeGroupModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div
              className={cx(
                "relative bg-neutral-950 border border-white/15 shadow-2xl transition-all duration-200 ease-out overflow-hidden flex flex-col",
                groupExpanded ? "w-full h-full rounded-none" : "w-[92vw] max-w-[1200px] h-[85vh] rounded-3xl"
              )}
              style={{ boxShadow: "0 0 0 1px rgba(85,107,47,0.30), 0 28px 90px rgba(0,0,0,0.70)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="h-12 px-4 flex items-center border-b border-white/10 shrink-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{openGroup.name}</div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => setGroupExpanded((v) => !v)}
                    className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                    title={groupExpanded ? "Exit full screen" : "Full screen"}
                  >
                    ⛶
                  </button>
                  <button
                    onClick={closeGroupModal}
                    className="h-8 w-8 rounded-lg border border-white/20 text-white hover:bg-white/10 transition"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal body */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                  {/* Left */}
                  <div className="lg:col-span-8 p-5 overflow-y-auto">
                    {/* Primary summary */}
                    <div className="rounded-3xl border bg-white/6 p-4" style={primaryPanelStyle}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{openGroup.description}</div>
                          <div className="mt-1 text-xs text-neutral-400">
                            {openGroup.mode === "Class"
                              ? "See pacing + assignments — without member lists."
                              : "Clear expectations before you commit."}
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full text-[11px] font-semibold tracking-wide border shrink-0"
                          style={pillStyleDark(openGroup.category)}
                        >
                          {openGroup.category}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-neutral-300">
                        <span className="px-2 py-0.5 rounded-full border" style={visibilityPillStyle(openGroup.visibility)}>
                          {openGroup.visibility}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                          {openGroup.members} members{openGroup.mode === "Class" ? " (not shown individually)" : ""}
                        </span>
                        {openGroup.visibility === "Private" && (
                          <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                            Chat • max {openGroup.memberLimit ?? 20}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full border border-white/12 bg-white/6">
                          {openGroup.activityLabel}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border" style={modePillStyle(openGroup.mode)}>
                          {openGroup.mode}
                        </span>
                      </div>

                      {openGroup.mode === "Class" && classStats && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <MiniStat label="Avg / week" value={classStats.avgTimePerWeek} />
                          <MiniStat label="Difficulty" value={classStats.difficulty} />
                          <MiniStat label="Exam 1 avg" value={classStats.exam1Avg} />
                          <MiniStat label="Exam 2 avg" value={classStats.exam2Avg} />
                        </div>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {modalTabs.map((t) => (
                        <button
                          key={t}
                          onClick={() => setGroupModalTab(t)}
                          className={cx(
                            "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                            groupModalTab === t ? "bg-white/12 border-white/14" : "bg-white/6 border-white/10 hover:bg-white/10"
                          )}
                          style={groupModalTab === t ? oliveSoftStyle : undefined}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="mt-4 space-y-4">
                      {/* CLASS: Assignments */}
                      {openGroup.mode === "Class" && groupModalTab === "Assignments" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">Upcoming assignments</div>
                              <div className="mt-1 text-xs text-neutral-400">
                                UI shell — later sync from syllabus/LMS or community submissions.
                              </div>
                            </div>
                            <span className="text-[11px] text-neutral-500">Focus</span>
                          </div>

                          <div className="mt-4 space-y-2">
                            {(classInfo?.upcomingAssignments ?? []).length === 0 ? (
                              <div className="text-sm text-neutral-400">No assignments added yet.</div>
                            ) : (
                              (classInfo?.upcomingAssignments ?? []).map((a) => (
                                <div
                                  key={a.title + a.due}
                                  className="rounded-2xl border border-white/10 bg-neutral-950/35 px-3 py-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-neutral-100 truncate">{a.title}</div>
                                      <div className="mt-1 text-xs text-neutral-400">Due {a.due}</div>
                                    </div>
                                    <div className="text-[11px] text-neutral-400 whitespace-nowrap">{a.estTime}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* CLASS: Insights */}
                      {openGroup.mode === "Class" && groupModalTab === "Insights" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Insights</div>
                          <div className="mt-2 text-sm text-neutral-300 leading-relaxed">
                            UI shell — this becomes *collective pacing intelligence*:
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InsightCard title="Study ramp" body="Most people ramp study time ~6 days before Exam 1." meta="Example" />
                            <InsightCard
                              title="Confusion cluster"
                              body="Top confusion topics this week: WACC sensitivities, real vs nominal."
                              meta="Example"
                            />
                            <InsightCard
                              title="Recommended pacing"
                              body="3 × 60-min blocks beats 1 big cram (opt-in schedule suggestion)."
                              meta="Example"
                            />
                            <InsightCard
                              title="Difficulty pulse"
                              body="Perceived difficulty trend can change week-to-week (aggregated)."
                              meta="Example"
                            />
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/35 px-3 py-3">
                            <div className="text-xs text-neutral-400">Privacy by design: no member lists, only aggregated stats.</div>
                          </div>
                        </div>
                      )}

                      {/* CLASS: Schedule */}
                      {groupModalTab === "Schedule" && openGroup.mode === "Class" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Schedule</div>
                          <div className="mt-2 text-sm text-neutral-300">UI shell — opt-in suggestions only. Nothing forced.</div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/35 px-3 py-3">
                            <div className="text-xs text-neutral-400">
                              Example: “Suggest a 60-min block Sunday afternoon” based on class pacing.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {groupModalTab === "Files" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Files</div>
                          <div className="mt-2 text-sm text-neutral-300">
                            UI shell — connects to your Files tab and adds “group context.”
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/35 px-3 py-3">
                            <div className="text-xs text-neutral-400">No files yet.</div>
                          </div>
                        </div>
                      )}

                      {/* CLASS: metadata */}
                      {openGroup.mode === "Class" && groupModalTab === "Class" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Course info</div>

                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoRowSoft label="School" value={classInfo?.schoolLabel ?? "—"} />
                            <InfoRowSoft
                              label="Course"
                              value={`${classInfo?.courseCode ?? "—"} • ${classInfo?.courseTitle ?? ""}`}
                            />
                            <InfoRowSoft label="Instructor" value={classInfo?.instructor ?? "—"} />
                            <InfoRowSoft label="Term" value={classInfo?.term ?? "—"} />
                            <InfoRowSoft label="Verification" value={classInfo?.verifiedRuleLabel ?? "—"} />
                            <InfoRowSoft label="Members" value={`${openGroup.members} (not shown individually)`} />
                          </div>

                          <div className="mt-4">
                            <div className="text-xs font-semibold text-neutral-300">Most difficult concepts</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(classStats?.mostDifficultConcepts ?? []).length === 0 ? (
                                <span className="text-sm text-neutral-400">No data yet.</span>
                              ) : (
                                (classStats?.mostDifficultConcepts ?? []).map((x) => (
                                  <span
                                    key={x}
                                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-neutral-200"
                                    style={oliveSoftStyle}
                                  >
                                    {x}
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NON-CLASS: Chat */}
                      {canShowChat && groupModalTab === "Chat" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-white">Group chat</div>
                              <div className="text-xs text-neutral-400 mt-1">
                                Private groups only (max {openGroup.memberLimit ?? 20}). UI shell.
                              </div>
                            </div>
                            <div className="text-[11px] text-neutral-500">MVP</div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/35 p-3 h-[320px] overflow-y-auto">
                            <div className="space-y-3">
                              {chatMsgs.map((m) => (
                                <div key={m.id} className="flex items-start gap-3">
                                  <div
                                    className="h-8 w-8 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-semibold"
                                    style={m.who === "You" ? oliveSoftStyle : undefined}
                                  >
                                    {m.who === "You" ? "YOU" : "MEM"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs font-semibold text-neutral-200">{m.who}</div>
                                      <div className="text-[11px] text-neutral-500">{m.ts}</div>
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-100 leading-relaxed">{m.text}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 flex gap-2">
                            <input
                              value={chatDraft}
                              onChange={(e) => setChatDraft(e.target.value)}
                              placeholder="Message…"
                              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-white/10"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") sendChat();
                              }}
                            />
                            <button
                              onClick={sendChat}
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/8 hover:bg-white/12 transition border-white/10"
                              style={oliveSoftStyle}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}

                      {/* NON-CLASS: Overview */}
                      {groupModalTab === "Overview" && openGroup.mode !== "Class" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Overview</div>
                          <div className="mt-2 text-sm text-neutral-300 leading-relaxed">
                            UI shell — this becomes “one-screen clarity”:
                            <ul className="mt-2 space-y-1">
                              <li>• What it is</li>
                              <li>• What it expects</li>
                              <li>• What you get from it</li>
                              <li>• Where it touches your schedule (optional)</li>
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* NON-CLASS: Expectations */}
                      {groupModalTab === "Expectations" && openGroup.mode !== "Class" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Expectations</div>
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <StatCardSoft title="Cadence" value={openGroup.cadence} />
                            <StatCardSoft title="Time" value={openGroup.timeCommit} />
                            <StatCardSoft title="Structure" value={openGroup.structure} />
                          </div>
                        </div>
                      )}

                      {/* NON-CLASS: People */}
                      {groupModalTab === "People" && openGroup.mode !== "Class" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">People</div>
                          <div className="mt-2 text-sm text-neutral-300">
                            UI shell — later show member list for private groups (or limited roles).
                          </div>
                          <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-950/35 px-3 py-3">
                            <div className="text-xs text-neutral-400">
                              Current: {openGroup.members} members. (List hidden in MVP.)
                            </div>
                          </div>
                        </div>
                      )}

                      {/* NON-CLASS: Schedule */}
                      {groupModalTab === "Schedule" && openGroup.mode !== "Class" && (
                        <div className="rounded-3xl border border-white/12 bg-neutral-900/35 p-5">
                          <div className="text-sm font-semibold text-white">Schedule</div>
                          <div className="mt-2 text-sm text-neutral-300">UI shell — later becomes opt-in schedule suggestions.</div>
                        </div>
                      )}
                    </div>

                    <div className="h-6" />
                  </div>

                  {/* Right (assistant reduced + collapsible) */}
                  <div className="lg:col-span-4 p-5 border-l border-white/10 bg-neutral-950/40">
                    <div className="rounded-3xl border border-white/12 bg-white/6 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">Assistant</div>
                          <div className="text-xs text-neutral-400 mt-1">Ask about expectations, pacing, or schedule fit.</div>
                        </div>

                        <button
                          onClick={() => setAssistantCollapsed((v) => !v)}
                          className="rounded-xl px-2 py-1 text-xs border border-white/12 bg-white/6 hover:bg-white/10 transition"
                        >
                          {assistantCollapsed ? "Open" : "Hide"}
                        </button>
                      </div>

                      {!assistantCollapsed && (
                        <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900/30 p-3">
                          <div className="text-[11px] text-neutral-500">
                            Example: “How much do people study for Exam 1?” or “What’s the hardest topic?”
                          </div>
                          <div className="mt-3 flex gap-2">
                            <input
                              value={assistantInput}
                              onChange={(e) => setAssistantInput(e.target.value)}
                              placeholder="Ask…"
                              className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-white/10"
                            />
                            <button
                              onClick={() => {
                                if (!assistantInput.trim()) return;
                                alert("UI shell — assistant response later");
                                setAssistantInput("");
                              }}
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white/8 hover:bg-white/12 transition border-white/10"
                              style={oliveSoftStyle}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 rounded-2xl border border-white/10 bg-neutral-900/30 px-3 py-3">
                        <div className="text-xs text-neutral-400">Design rule: no feeds, no streak pressure, no noise.</div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-white/12 bg-white/6 p-4">
                      <div className="text-sm font-semibold">Expectations</div>
                      <div className="mt-2 text-sm text-neutral-300">
                        {openGroup.cadence}
                        <div className="text-xs text-neutral-400 mt-1">{openGroup.timeCommit}</div>
                        <div className="text-xs text-neutral-400 mt-1">Structure: {openGroup.structure}</div>
                      </div>
                    </div>

                    {openGroup.visibility === "Private" && (
                      <div className="mt-4 rounded-3xl border border-white/12 bg-white/6 p-4">
                        <div className="text-sm font-semibold">Private group rules</div>
                        <div className="mt-2 text-sm text-neutral-300">Chat enabled • Max {openGroup.memberLimit ?? 20}</div>
                        <div className="mt-3 rounded-2xl border border-white/10 bg-neutral-900/30 px-3 py-3">
                          <div className="text-xs text-neutral-400">
                            Use for coordination (projects, scheduling). Public groups don’t have chat.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

/* ---------- small UI primitives ---------- */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950/30 px-3 py-2">
      <div className="text-[10px] text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-100">{value}</div>
    </div>
  );
}

function InfoRowSoft({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950/30 px-3 py-3">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-neutral-100">{value}</div>
    </div>
  );
}

function StatCardSoft({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950/30 px-3 py-3">
      <div className="text-[11px] text-neutral-500">{title}</div>
      <div className="mt-1 text-sm font-semibold text-neutral-100">{value}</div>
    </div>
  );
}

function InsightCard({ title, body, meta }: { title: string; body: string; meta: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-950/30 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-neutral-100">{title}</div>
        <div className="text-[11px] text-neutral-500">{meta}</div>
      </div>
      <div className="mt-2 text-sm text-neutral-300 leading-relaxed">{body}</div>
    </div>
  );
}

function FieldDark({ label, children }: { label: string; children: ReactNode }) {
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
  maxWidthClass = "max-w-lg",
}: {
  children: ReactNode;
  onClose: () => void;
  maxWidthClass?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
    >
      <div
        className={cx("w-full rounded-3xl border border-white/10 bg-neutral-950/85 backdrop-blur p-6", maxWidthClass)}
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
