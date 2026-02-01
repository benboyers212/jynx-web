"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  SlidersHorizontal,
  Search,
  Plus,
  Users,
  MessageSquare,
  Bell,
  Pin,
  ChevronRight,
} from "lucide-react";

/**
 * Groups page (UI shell) — based on the newer layout, with old interactions restored:
 * - Clicking a group opens a Group modal (class overview / private chat / org people + DM)
 * - Pinned toggles work (pin icon on rows + pinned list in left rail)
 * - Quick actions work (Create group / Find group / Invites)
 * - Notifications clear + small toast pops
 * - My groups vs Discover actually swaps lists
 * - Invite to group button (email input) in group modal
 *
 * NOTE: This is still a UI shell (no backend). All actions are stateful in-memory.
 */

const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const surfaceStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
};

const surfaceSoftStyle: CSSProperties = {
  borderColor: "rgba(0,0,0,0.08)",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.04)",
};

type GroupVisibility = "Private" | "Public" | "Verified";
type GroupType = "Class hub" | "Study group" | "Accountability" | "Project" | "Organization";
type GroupCategory = "Study" | "Fitness" | "Work" | "Life";

type ClassStats = {
  avgTimePerWeek: string;
  exam1Avg: string;
  exam2Avg: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Very hard";
};

type UpcomingAssignment = {
  title: string;
  due: string;
  estTime: string;
};

type GroupMember = {
  id: string;
  name: string;
  email?: string;
};

type ChatMsg = {
  id: string;
  who: string;
  text: string;
  ts: string;
};

type Group = {
  id: string;
  name: string;
  type: GroupType;
  visibility: GroupVisibility;
  category: GroupCategory;

  verified?: boolean;
  active?: boolean;

  memberCount: number;
  chatEnabled: boolean;

  description: string;
  expectations: string;

  // UI shell
  pinned?: boolean;
  unread?: number; // chat notifications (private groups only)
  lastActivity: string;
  lastActivityText: string;

  // Class (optional)
  classStats?: ClassStats;
  upcomingAssignments?: UpcomingAssignment[];

  // Org (optional)
  membersList?: GroupMember[];
};

type Activity = {
  id: string;
  groupId: string;
  groupName: string;
  kind: "chat" | "update" | "reminder";
  text: string;
  when: string;
};

function pillStyleBase(active?: boolean): CSSProperties {
  return {
    borderColor: active ? rgbaBrand(0.26) : "rgba(0,0,0,0.08)",
    background: active ? rgbaBrand(0.10) : "rgba(0,0,0,0.03)",
    color: active ? "rgba(0,0,0,0.82)" : "rgba(0,0,0,0.70)",
    boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
  };
}

function badgeStyle(kind: "Verified" | "Private" | "Public" | "Active" | "Chat" | "Quiet"): CSSProperties {
  const base: CSSProperties = {
    borderColor: "rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.03)",
    color: "rgba(0,0,0,0.72)",
  };

  if (kind === "Verified") {
    return {
      borderColor: rgbaBrand(0.28),
      background: rgbaBrand(0.10),
      color: "rgba(0,0,0,0.80)",
      boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
    };
  }

  if (kind === "Active") {
    return {
      borderColor: rgbaBrand(0.20),
      background: "rgba(0,0,0,0.02)",
      color: "rgba(0,0,0,0.64)",
    };
  }

  if (kind === "Quiet") {
    return {
      borderColor: "rgba(0,0,0,0.10)",
      background: "rgba(0,0,0,0.02)",
      color: "rgba(0,0,0,0.58)",
    };
  }

  if (kind === "Chat") {
    return {
      borderColor: "rgba(0,0,0,0.12)",
      background: "rgba(0,0,0,0.02)",
      color: "rgba(0,0,0,0.66)",
    };
  }

  return base;
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

type MainTab = "My groups" | "Discover";
type GroupModalTab = "Overview" | "Chat" | "Assignments" | "People" | "Files" | "Schedule";

export default function GroupsPage() {
  // Left sidebar (collapsible) — match Schedule
  const [leftOpen, setLeftOpen] = useState(true);

  useEffect(() => {
    const check = () => { if (window.innerWidth < 768) setLeftOpen(false); };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Main filters
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | GroupCategory>("All");
  const [tab, setTab] = useState<MainTab>("My groups");

  // Toast
  const [toast, setToast] = useState<{ open: boolean; text: string }>({ open: false, text: "" });
  const toastTimer = useRef<number | null>(null);
  function showToast(text: string) {
    setToast({ open: true, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast({ open: false, text: "" }), 1700);
  }

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showFind, setShowFind] = useState(false);
  const [showInvites, setShowInvites] = useState(false);

  // Create modal fields (simple)
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<GroupCategory>("Study");
  const [newType, setNewType] = useState<GroupType>("Study group");
  const [newVisibility, setNewVisibility] = useState<GroupVisibility>("Private");

  // Invite modal fields
  const [inviteEmail, setInviteEmail] = useState("");

  // Group modal
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [groupTab, setGroupTab] = useState<GroupModalTab>("Overview");
  const [groupExpanded, setGroupExpanded] = useState(false);

  // Chat state per-group (UI shell)
  const [chatByGroup, setChatByGroup] = useState<Record<string, ChatMsg[]>>({
    g2: [
      { id: "m1", who: "You", text: "Quick check-in: when are we meeting?", ts: "Today 2:14 PM" },
      { id: "m2", who: "Dylan", text: "I can do 6:30 after class.", ts: "Today 2:16 PM" },
    ],
    g3: [
      { id: "m3", who: "You", text: "Leg day today — anyone in?", ts: "Today 9:41 AM" },
      { id: "m4", who: "Dylan", text: "I’m down. 4:30?", ts: "Today 9:43 AM" },
    ],
  });
  const [chatDraft, setChatDraft] = useState("");

  // My groups (stateful)
  const [myGroups, setMyGroups] = useState<Group[]>([
    {
      id: "g1",
      name: "F305 — Financial Management",
      type: "Class hub",
      visibility: "Verified",
      category: "Study",
      verified: true,
      active: true,
      memberCount: 186,
      chatEnabled: false,
      description: "Course hub: assignments + pacing insights (verified)",
      expectations: "Weekly rhythm · ~3–6 hrs/week · Structured",
      pinned: true,
      unread: 0,
      lastActivity: "1h ago",
      lastActivityText: "New assignment posted: Problem Set 3",
      classStats: {
        avgTimePerWeek: "4.2 hrs",
        exam1Avg: "7.1 hrs",
        exam2Avg: "8.0 hrs",
        difficulty: "Hard",
      },
      upcomingAssignments: [
        { title: "HW 3 — Time Value of Money", due: "Thu 11:59 PM", estTime: "~45–60 min" },
        { title: "Quiz — WACC Concepts", due: "Mon 9:00 AM", estTime: "~15 min" },
      ],
    },
    {
      id: "g2",
      name: "F305 Study Group",
      type: "Study group",
      visibility: "Private",
      category: "Study",
      active: true,
      memberCount: 6,
      chatEnabled: true,
      description: "Exam reviews, problem sets, weekly cadence",
      expectations: "2–3x/week check-ins · ~30–60 min/session · Moderate",
      pinned: false,
      unread: 3,
      lastActivity: "2h ago",
      lastActivityText: "3 new messages in chat",
      membersList: [
        { id: "u1", name: "You" },
        { id: "u2", name: "Dylan" },
        { id: "u3", name: "Ava" },
        { id: "u4", name: "Noah" },
        { id: "u5", name: "Mia" },
        { id: "u6", name: "Ryan" },
      ],
    },
    {
      id: "g3",
      name: "Gym Accountability",
      type: "Accountability",
      visibility: "Private",
      category: "Fitness",
      active: true,
      memberCount: 4,
      chatEnabled: true,
      description: "3x/week check-ins (no streak pressure)",
      expectations: "3x/week check-ins · ~5 min/check-in · Loose",
      pinned: false,
      unread: 0,
      lastActivity: "Yesterday",
      lastActivityText: "Check-in reminder went out",
      membersList: [
        { id: "u1", name: "You" },
        { id: "u2", name: "Dylan" },
        { id: "u7", name: "Sam" },
        { id: "u8", name: "Lena" },
      ],
    },
    {
      id: "g4",
      name: "Deal Prep Sprint",
      type: "Project",
      visibility: "Private",
      category: "Work",
      active: false,
      memberCount: 3,
      chatEnabled: true,
      description: "Light structure for interview + modeling reps",
      expectations: "3 sessions/week · 45–60 min · Structured",
      pinned: false,
      unread: 1,
      lastActivity: "3d ago",
      lastActivityText: "Pinned: Technicals checklist updated",
      membersList: [
        { id: "u1", name: "You" },
        { id: "u2", name: "Dylan" },
        { id: "u9", name: "Chris" },
      ],
    },
  ]);

  // Discover groups (separate list)
  const [discoverGroups] = useState<Group[]>([
    {
      id: "d1",
      name: "Kelley — Finance Grind",
      type: "Organization",
      visibility: "Public",
      category: "Study",
      active: true,
      memberCount: 128,
      chatEnabled: false,
      description: "Study blocks, recruiting prep, accountability",
      expectations: "Weekdays · 45–90 min · Moderate",
      pinned: false,
      unread: 0,
      lastActivity: "Today",
      lastActivityText: "New: IB technicals sheet shared",
      membersList: [
        { id: "m1", name: "Sasha", email: "sasha@kelley.edu" },
        { id: "m2", name: "Andrew", email: "andrew@kelley.edu" },
        { id: "m3", name: "Priya", email: "priya@kelley.edu" },
        { id: "m4", name: "Max", email: "max@kelley.edu" },
      ],
    },
    {
      id: "d2",
      name: "Morning Deep Work",
      type: "Accountability",
      visibility: "Public",
      category: "Work",
      active: true,
      memberCount: 62,
      chatEnabled: false,
      description: "9–11 AM focus blocks. Minimal distractions.",
      expectations: "Weekdays · 60–120 min · Structured",
      pinned: false,
      unread: 0,
      lastActivity: "2d ago",
      lastActivityText: "Schedule template updated",
    },
    {
      id: "d3",
      name: "Sunday Reset Crew",
      type: "Organization",
      visibility: "Public",
      category: "Life",
      active: true,
      memberCount: 41,
      chatEnabled: false,
      description: "Plan week, batch chores, light cardio",
      expectations: "Weekly · 30–60 min · Loose",
      pinned: false,
      unread: 0,
      lastActivity: "This week",
      lastActivityText: "New weekly checklist posted",
      membersList: [
        { id: "x1", name: "Jordan" },
        { id: "x2", name: "Leah" },
        { id: "x3", name: "Kevin" },
      ],
    },
    {
      id: "d4",
      name: "Calc II — Verified Hub",
      type: "Class hub",
      visibility: "Verified",
      category: "Study",
      verified: true,
      active: true,
      memberCount: 212,
      chatEnabled: false,
      description: "Assignments + pacing insights (verified)",
      expectations: "Weekly rhythm · ~3–5 hrs/week · Structured",
      pinned: false,
      unread: 0,
      lastActivity: "5h ago",
      lastActivityText: "New homework posted",
      classStats: {
        avgTimePerWeek: "3.7 hrs",
        exam1Avg: "6.4 hrs",
        exam2Avg: "7.6 hrs",
        difficulty: "Hard",
      },
      upcomingAssignments: [
        { title: "Problem Set 5", due: "Fri 5:00 PM", estTime: "~60–90 min" },
        { title: "Quiz — Sequences", due: "Tue 9:00 AM", estTime: "~15 min" },
      ],
    },
  ]);

  // Demo “recent activity” (left rail)
  const [activity] = useState<Activity[]>([
    {
      id: "a1",
      groupId: "g1",
      groupName: "F305 — Financial Management",
      kind: "update",
      text: "Problem Set 3 posted · due before next class",
      when: "1h",
    },
    {
      id: "a2",
      groupId: "g2",
      groupName: "F305 Study Group",
      kind: "chat",
      text: "“Anyone want to meet 8pm to review CAPM?”",
      when: "2h",
    },
    {
      id: "a3",
      groupId: "g3",
      groupName: "Gym Accountability",
      kind: "reminder",
      text: "Check-in: what’s the plan for today?",
      when: "1d",
    },
  ]);

  const list = useMemo(() => (tab === "My groups" ? myGroups : discoverGroups), [tab, myGroups, discoverGroups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((g) => (category === "All" ? true : g.category === category))
      .filter((g) => {
        if (!q) return true;
        return (
          g.name.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.expectations.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        // pinned first ONLY for My groups (discover ignores pinned)
        if (tab === "My groups") {
          const ap = a.pinned ? 1 : 0;
          const bp = b.pinned ? 1 : 0;
          if (ap !== bp) return bp - ap;
        }
        const aa = a.active ? 1 : 0;
        const ba = b.active ? 1 : 0;
        if (aa !== ba) return ba - aa;
        return a.name.localeCompare(b.name);
      });
  }, [list, query, category, tab]);

  const pinned = tab === "My groups" ? filtered.filter((g) => g.pinned) : [];
  const rest = tab === "My groups" ? filtered.filter((g) => !g.pinned) : filtered;

  const maxW = "max-w-[1280px]";

  function openGroupModal(g: Group) {
    setOpenGroup(g);
    setGroupExpanded(false);

    // Default tab based on group type
    if (g.type === "Class hub") setGroupTab("Assignments");
    else if (g.visibility === "Private" && g.chatEnabled) setGroupTab("Chat");
    else if (g.type === "Organization") setGroupTab("People");
    else setGroupTab("Overview");

    // Clear unread if it’s one of *your* groups
    if (tab === "My groups" && g.unread && g.unread > 0) {
      setMyGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, unread: 0, lastActivityText: "Opened" } : x)));
      showToast("Marked as read");
    }
  }

  function closeGroupModal() {
    setOpenGroup(null);
    setGroupExpanded(false);
    setChatDraft("");
    setInviteEmail("");
  }

  function togglePin(groupId: string) {
    setMyGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, pinned: !g.pinned } : g)));
  }

  function createGroupNow() {
    const name = newName.trim();
    if (!name) {
      showToast("Add a group name");
      return;
    }

    // Rules (MVP):
    // - Private => chat enabled
    // - Public/Verified => no chat in this UI shell
    const visibility: GroupVisibility = newType === "Class hub" ? "Verified" : newVisibility;
    const chatEnabled = visibility === "Private";
    const newGroup: Group = {
      id: `g_${Date.now()}_${uid()}`,
      name,
      type: newType,
      visibility,
      category: newCategory,
      verified: visibility === "Verified",
      active: true,
      memberCount: 1,
      chatEnabled,
      description: newDesc.trim() || "No description yet",
      expectations:
        newType === "Accountability"
          ? "3x/week check-ins · ~5 min/check-in · Loose"
          : newType === "Project"
          ? "2–3 sessions/week · 45–60 min · Structured"
          : newType === "Class hub"
          ? "Weekly rhythm · ~3–6 hrs/week · Structured"
          : "2–3x/week check-ins · ~30–60 min/session · Moderate",
      pinned: false,
      unread: 0,
      lastActivity: "Just now",
      lastActivityText: "Created",
      membersList: [{ id: "me", name: "You" }],
    };

    setMyGroups((prev) => [newGroup, ...prev]);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    setNewCategory("Study");
    setNewType("Study group");
    setNewVisibility("Private");
    showToast("Group created");
  }

  function sendChat() {
    if (!openGroup) return;
    if (!(openGroup.visibility === "Private" && openGroup.chatEnabled)) return;

    const txt = chatDraft.trim();
    if (!txt) return;

    setChatByGroup((prev) => {
      const cur = prev[openGroup.id] ?? [];
      return {
        ...prev,
        [openGroup.id]: [...cur, { id: uid(), who: "You", text: txt, ts: "Just now" }],
      };
    });

    setChatDraft("");
  }

  function inviteToGroup() {
    if (!openGroup) return;
    const email = inviteEmail.trim();
    if (!email || !email.includes("@")) {
      showToast("Enter a valid email");
      return;
    }

    // UI shell: add member count + member list entry for private groups
    if (tab === "My groups") {
      setMyGroups((prev) =>
        prev.map((g) => {
          if (g.id !== openGroup.id) return g;
          const nextMembers = (g.membersList ?? []).some((m) => m.email === email)
            ? g.membersList ?? []
            : [...(g.membersList ?? []), { id: uid(), name: email.split("@")[0], email }];
          return {
            ...g,
            memberCount: g.memberCount + 1,
            membersList: nextMembers,
            lastActivity: "Just now",
            lastActivityText: `Invited ${email}`,
          };
        })
      );
    }

    showToast("Invite sent");
    setInviteEmail("");
  }

  // Left rail pinned list should be “your groups” with pin toggles
  const leftPinnedList = useMemo(() => {
    return myGroups
      .slice()
      .sort((a, b) => {
        const ap = a.pinned ? 1 : 0;
        const bp = b.pinned ? 1 : 0;
        if (ap !== bp) return bp - ap;
        return a.name.localeCompare(b.name);
      })
      .slice(0, 6);
  }, [myGroups]);

  return (
   <main className="h-screen bg-neutral-50 text-neutral-950 overflow-hidden">
      {/* Subtle ambient — match Schedule */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full blur-3xl opacity-25"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${rgbaBrand(0.22)}, rgba(255,255,255,0) 60%)`,
          }}
        />
        <div className="absolute bottom-[-240px] right-[-240px] h-[520px] w-[520px] rounded-full blur-3xl opacity-20 bg-black/10" />
      </div>

      {/* Toast */}
      {toast.open && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80]">
          <div
            className="rounded-2xl border bg-white px-4 py-2 text-sm font-semibold"
            style={{
              borderColor: "rgba(0,0,0,0.10)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
            }}
          >
            {toast.text}
          </div>
        </div>
      )}

      <div className="relative flex h-full">
        {/* LEFT SIDEBAR */}
        <div
          className="h-full transition-[width] duration-200"
          style={{
            width: leftOpen ? "clamp(220px, 22vw, 320px)" : "56px",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRight: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="h-full flex flex-col">
            {/* Rail top control — same “Control center” pattern */}
            <div className={cx("px-3 pt-4", leftOpen ? "pb-3" : "pb-2 flex justify-center")}>
  <div className={cx("flex items-center", leftOpen ? "justify-start" : "justify-center")}>

                <button
                  onClick={() => setLeftOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  style={surfaceSoftStyle}
                  aria-label="Toggle Groups rail"
                  title="Groups rail"
                >
                  <SlidersHorizontal size={18} />
                </button>

                {/* (match Schedule) no header text here */}
              </div>
            </div>

            {leftOpen ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4">
  <div className="space-y-7">
    {/* Recent activity — flat (Schedule-style) */}
    <section>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">Recent activity</div>
        <span
          className="inline-flex items-center justify-center h-7 px-2.5 rounded-full border text-[11px] font-semibold"
          style={{
            borderColor: "rgba(0,0,0,0.10)",
            background: "rgba(0,0,0,0.03)",
            color: "rgba(0,0,0,0.70)",
          }}
        >
          {activity.length}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {activity.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              const g = myGroups.find((x) => x.id === a.groupId);
              if (g) openGroupModal(g);
              else showToast("That group isn’t in My groups");
            }}
            className="w-full text-left rounded-2xl border bg-white hover:bg-black/[0.03] transition"
            style={surfaceSoftStyle}
          >
            <div className="px-3 py-2">
              <div className="flex items-start gap-2">
                <div
                  className="mt-0.5 h-8 w-8 rounded-2xl border bg-white flex items-center justify-center"
                  style={{
                    ...surfaceSoftStyle,
                    borderColor: rgbaBrand(0.16),
                  }}
                >
                  {a.kind === "chat" ? (
                    <MessageSquare size={16} />
                  ) : a.kind === "update" ? (
                    <Bell size={16} />
                  ) : (
                    <Users size={16} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-900 truncate">{a.groupName}</div>
                  <div className="text-[11px] text-neutral-500 leading-relaxed">{a.text}</div>
                </div>

                <div className="text-[11px] text-neutral-400 shrink-0">{a.when}</div>
              </div>
            </div>
          </button>
        ))}

        <button
          onClick={() => showToast("Activity inbox (UI shell)")}
          className="w-full rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
        >
          Open activity
        </button>
      </div>
    </section>

    {/* Pinned — flat */}
    <section>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-neutral-900">Pinned</div>
        <div className="text-[11px] text-neutral-500">{myGroups.filter((g) => g.pinned).length}</div>
      </div>

      <div className="mt-3 space-y-2">
        {leftPinnedList.map((g) => (
          <div key={g.id} className="w-full rounded-2xl border bg-white" style={surfaceSoftStyle}>
            <div className="px-3 py-2">
              <div className="flex items-center gap-2">
                <button className="min-w-0 flex-1 text-left" onClick={() => openGroupModal(g)}>
                  <div className="text-sm font-semibold text-neutral-900 truncate">{g.name}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{g.lastActivityText}</div>
                </button>

                <button
                  className="h-8 w-8 rounded-xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  style={surfaceSoftStyle}
                  title={g.pinned ? "Unpin" : "Pin"}
                  onClick={() => {
                    togglePin(g.id);
                    showToast(g.pinned ? "Unpinned" : "Pinned");
                  }}
                >
                  <Pin size={14} className={g.pinned ? "text-neutral-900" : "text-neutral-500"} />
                </button>

                <ChevronRight size={16} className="text-neutral-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    {/* Quick actions — flat */}
    <section>
      <div className="text-sm font-semibold text-neutral-900">Quick actions</div>
      <div className="mt-2 text-sm text-neutral-700 leading-relaxed">
        Keep groups lightweight: structure + expectations, not feeds.
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
          onClick={() => setShowCreate(true)}
        >
          Create group
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
          style={surfaceSoftStyle}
          onClick={() => {
            setTab("Discover");
            setShowFind(true);
          }}
        >
          Find group
        </button>
        <button
          className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition col-span-2"
          style={surfaceSoftStyle}
          onClick={() => setShowInvites(true)}
        >
          Invites / requests
        </button>
      </div>
    </section>
  </div>
</div>


                <div className="px-3 py-3">
                  <Link
                    href="/chat"
                    className="w-full block rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition text-center"
                    style={surfaceSoftStyle}
                  >
                    Open Chat
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </div>

        {/* MAIN */}
        <div className="flex-1 flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            <div className={cx(maxW, "mx-auto px-6 pt-6 pb-10")}>
              {/* In-canvas header row */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">Groups</div>
                  <div className="text-xs text-neutral-500">Structure + expectations. No feed. No noise.</div>
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition flex items-center gap-2"
                    style={{
                      ...surfaceSoftStyle,
                      borderColor: rgbaBrand(0.22),
                      boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
                    }}
                  >
                    <Plus size={16} />
                    Create group
                  </button>

                  <button
                    onClick={() => {
                      setTab("Discover");
                      setShowFind(true);
                    }}
                    className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                    style={surfaceSoftStyle}
                  >
                    Find group
                  </button>
                </div>
              </div>

              {/* Toolbar row */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {/* Search */}
                <div
                  className="flex items-center gap-2 rounded-2xl border bg-white px-3 h-10 min-w-[280px] flex-1"
                  style={surfaceSoftStyle}
                >
                  <Search size={16} className="text-neutral-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={tab === "My groups" ? "Search groups…" : "Search discover…"}
                    className="w-full bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>

                {/* Category filter */}
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="h-10 rounded-2xl border bg-white px-3 text-sm outline-none"
                  style={surfaceSoftStyle}
                >
                  <option value="All">All</option>
                  <option value="Study">Study</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Work">Work</option>
                  <option value="Life">Life</option>
                </select>

                {/* Tabs */}
                <div className="h-10 rounded-2xl border bg-white p-1 flex items-center gap-1" style={surfaceSoftStyle}>
                  {(["My groups", "Discover"] as const).map((t) => {
                    const active = tab === t;
                    return (
                      <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={cx(
                          "h-8 rounded-xl px-3 text-xs font-semibold transition",
                          active ? "bg-black/[0.04]" : "hover:bg-black/[0.03]"
                        )}
                        style={{
                          border: "1px solid",
                          borderColor: active ? rgbaBrand(0.22) : "rgba(0,0,0,0)",
                          boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
                          color: active ? "rgba(0,0,0,0.88)" : "rgba(0,0,0,0.68)",
                        }}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Body */}
              <div className="mt-6 space-y-8">
                {/* Pinned section (only in My groups) */}
                {tab === "My groups" && pinned.length ? (
                  <section>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold tracking-widest text-neutral-500">PINNED</div>
                      <div className="text-[11px] text-neutral-500">{pinned.length} pinned</div>
                    </div>

                    <div className="mt-3 space-y-3">
                      {pinned.map((g) => (
                        <GroupRow
                          key={g.id}
                          group={g}
                          isMyGroups
                          onOpen={() => openGroupModal(g)}
                          onTogglePin={() => togglePin(g.id)}
                          onNotify={(txt) => showToast(txt)}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}

                <section>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold tracking-widest text-neutral-500">
                      {tab === "My groups" ? "MY GROUPS" : "DISCOVER"}
                    </div>
                    <div className="text-[11px] text-neutral-500">{filtered.length} total</div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {rest.length ? (
                      rest.map((g) => (
                        <GroupRow
                          key={g.id}
                          group={g}
                          isMyGroups={tab === "My groups"}
                          onOpen={() => openGroupModal(g)}
                          onTogglePin={() => togglePin(g.id)}
                          onNotify={(txt) => showToast(txt)}
                        />
                      ))
                    ) : (
                      <div className="rounded-3xl border bg-white p-6" style={surfaceSoftStyle}>
                        <div className="text-sm font-semibold text-neutral-900">No matches</div>
                        <div className="mt-1 text-sm text-neutral-600 leading-relaxed">
                          Try a different search, or flip the category filter back to All.
                        </div>
                        <div className="mt-4 flex gap-2">
                          <button
                            className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                            style={surfaceSoftStyle}
                            onClick={() => {
                              setQuery("");
                              setCategory("All");
                            }}
                          >
                            Clear filters
                          </button>
                          {tab === "My groups" ? (
                            <button
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                              style={{
                                ...surfaceSoftStyle,
                                borderColor: rgbaBrand(0.22),
                                boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
                              }}
                              onClick={() => setShowCreate(true)}
                            >
                              Create group
                            </button>
                          ) : (
                            <button
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                              style={{
                                ...surfaceSoftStyle,
                                borderColor: rgbaBrand(0.22),
                                boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
                              }}
                              onClick={() => setShowFind(true)}
                            >
                              Browse
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <div className="text-[11px] text-neutral-500">
                  Tip: Verified class hubs focus on pacing + assignments. Private groups keep chat small (max 20 for MVP).
                </div>
              </div>
            </div>
          </div>
          </div>
  </div>

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create group" subtitle="UI shell — creates a new group in My groups.">
          <div className="space-y-3">
            <Field label="Group name">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                style={surfaceSoftStyle}
                placeholder="e.g., F305 Study Group"
              />
            </Field>

            <Field label="Description (optional)">
              <input
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded-2xl border bg-white px-3 py-2 text-sm outline-none"
                style={surfaceSoftStyle}
                placeholder="What’s this group for?"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full h-10 rounded-2xl border bg-white px-3 text-sm outline-none"
                  style={surfaceSoftStyle}
                >
                  <option value="Study">Study</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Work">Work</option>
                  <option value="Life">Life</option>
                </select>
              </Field>

              <Field label="Type">
                <select
                  value={newType}
                  onChange={(e) => {
                    const next = e.target.value as GroupType;
                    setNewType(next);
                    if (next === "Class hub") setNewVisibility("Verified");
                  }}
                  className="w-full h-10 rounded-2xl border bg-white px-3 text-sm outline-none"
                  style={surfaceSoftStyle}
                >
                  <option value="Study group">Study group</option>
                  <option value="Accountability">Accountability</option>
                  <option value="Project">Project</option>
                  <option value="Class hub">Class hub (Verified)</option>
                  <option value="Organization">Organization</option>
                </select>
              </Field>
            </div>

            <Field label="Visibility">
              <select
                value={newType === "Class hub" ? "Verified" : newVisibility}
                onChange={(e) => setNewVisibility(e.target.value as any)}
                disabled={newType === "Class hub"}
                className={cx(
                  "w-full h-10 rounded-2xl border bg-white px-3 text-sm outline-none",
                  newType === "Class hub" && "opacity-70 cursor-not-allowed"
                )}
                style={surfaceSoftStyle}
              >
                <option value="Private">Private (chat)</option>
                <option value="Public">Public (no chat)</option>
                <option value="Verified">Verified</option>
              </select>
              {newType === "Class hub" && (
                <div className="mt-2 text-[11px] text-neutral-500">
                  Class hubs aren’t public/private — they’re verified communities (school/org gate later).
                </div>
              )}
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
              style={surfaceSoftStyle}
            >
              Cancel
            </button>
            <button
              onClick={createGroupNow}
              className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
              style={{
                ...surfaceSoftStyle,
                borderColor: rgbaBrand(0.22),
                boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
              }}
            >
              Create
            </button>
          </div>
        </Modal>
      )}

      {/* Find modal (Discover browser) */}
      {showFind && (
        <Modal
          onClose={() => setShowFind(false)}
          title="Find a group"
          subtitle="UI shell — browse Discover. (Public groups have no chat.)"
          maxWidthClass="max-w-4xl"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex items-center gap-2 rounded-2xl border bg-white px-3 h-10 min-w-[280px] flex-1"
              style={surfaceSoftStyle}
            >
              <Search size={16} className="text-neutral-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search discover…"
                className="w-full bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </div>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="h-10 rounded-2xl border bg-white px-3 text-sm outline-none"
              style={surfaceSoftStyle}
            >
              <option value="All">All</option>
              <option value="Study">Study</option>
              <option value="Fitness">Fitness</option>
              <option value="Work">Work</option>
              <option value="Life">Life</option>
            </select>
          </div>

          <div className="mt-4 space-y-3 max-h-[62vh] overflow-y-auto pr-1">
            {filtered
              .filter(() => tab === "Discover")
              .map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    setShowFind(false);
                    openGroupModal(g);
                  }}
                  className="w-full text-left rounded-3xl border bg-white px-5 py-4 hover:bg-black/[0.02] transition"
                  style={surfaceStyle}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-neutral-900 truncate">{g.name}</div>
                      <div className="mt-1 text-sm text-neutral-600">{g.description}</div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={badgeStyle(g.visibility === "Verified" ? "Verified" : g.visibility)}
                        >
                          {g.visibility}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={badgeStyle(g.active ? "Active" : "Quiet")}
                        >
                          {g.active ? "Active" : "Quiet"}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={badgeStyle("Chat")}
                        >
                          {g.chatEnabled ? "Chat · max 20" : "No chat"}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={pillStyleBase(false)}
                        >
                          {g.category}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={pillStyleBase(false)}
                        >
                          {g.memberCount} members
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-neutral-500">{g.lastActivity}</div>
                      <div className="mt-1 text-sm text-neutral-800 max-w-[260px] leading-snug">{g.lastActivityText}</div>
                    </div>
                  </div>
                </button>
              ))}

            {tab === "Discover" && filtered.length === 0 && (
              <div className="rounded-3xl border bg-white p-6" style={surfaceSoftStyle}>
                <div className="text-sm font-semibold text-neutral-900">No matches</div>
                <div className="mt-1 text-sm text-neutral-600 leading-relaxed">Try a different search.</div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Invites / Requests modal */}
      {showInvites && (
        <Modal
          onClose={() => setShowInvites(false)}
          title="Invites / requests"
          subtitle="UI shell — this becomes your group invites inbox."
        >
          <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
            <div className="text-sm font-semibold">Nothing pending</div>
            <div className="mt-1 text-sm text-neutral-600">
              When someone invites you to a private group or a verified hub, it shows up here.
            </div>
            <div className="mt-4">
              <button
                onClick={() => {
                  setShowInvites(false);
                  showToast("All caught up");
                }}
                className="h-10 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                style={surfaceSoftStyle}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Group Modal */}
      {openGroup && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={closeGroupModal} />

          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-6 pb-6 px-4">
            <div
              className={cx(
                "relative bg-white border transition-all duration-200 ease-out overflow-hidden flex flex-col",
                groupExpanded
                  ? "w-full min-h-[calc(100vh-3.5rem)] rounded-none"
                  : "w-[92vw] max-w-[1200px] mt-2 rounded-3xl h-[calc(100vh-3.5rem)]"
              )}
              style={{
                borderColor: "rgba(0,0,0,0.10)",
                boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 28px 90px rgba(0,0,0,0.14)",
                background: "white",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="min-h-[64px] px-6 py-3 flex items-center border-b shrink-0"
                style={{ borderColor: "rgba(0,0,0,0.08)" }}
              >
                <div className="min-w-0 leading-tight">
                  <div className="text-[15px] font-semibold text-neutral-900 truncate">{openGroup.name}</div>
                  <div className="text-[11px] text-neutral-500 truncate">{openGroup.description}</div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  {/* Invite button */}
                  {tab === "My groups" && (
                    <div className="flex items-center gap-2">
                      <div className="hidden md:flex items-center gap-2 rounded-2xl border bg-white px-2 h-9" style={surfaceSoftStyle}>
                        <input
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="Invite by email…"
                          className="w-[220px] bg-transparent outline-none text-sm placeholder:text-neutral-400"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") inviteToGroup();
                          }}
                        />
                        <button
                          onClick={inviteToGroup}
                          className="h-7 rounded-xl px-2 text-[11px] font-semibold border bg-white hover:bg-black/[0.03] transition"
                          style={{
                            ...surfaceSoftStyle,
                            borderColor: rgbaBrand(0.18),
                          }}
                        >
                          Invite
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          const email = window.prompt("Invite email:");
                          if (!email) return;
                          setInviteEmail(email);
                          setTimeout(() => inviteToGroup(), 0);
                        }}
                        className="md:hidden h-9 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                        style={surfaceSoftStyle}
                      >
                        Invite
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setGroupExpanded((v) => !v)}
                    className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                    style={surfaceSoftStyle}
                    title={groupExpanded ? "Exit full screen" : "Full screen"}
                  >
                    ⛶
                  </button>
                  <button
                    onClick={closeGroupModal}
                    className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                    style={surfaceSoftStyle}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full grid grid-cols-1 lg:grid-cols-12">
                  {/* Left */}
                  <div className="lg:col-span-8 p-5 overflow-y-auto">
                    {/* Summary */}
                    <div
                      className="rounded-3xl border bg-white p-4"
                      style={{
                        ...surfaceStyle,
                        borderColor: openGroup.visibility === "Verified" ? rgbaBrand(0.22) : "rgba(0,0,0,0.08)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-neutral-900 truncate">{openGroup.description}</div>
                          <div className="mt-1 text-xs text-neutral-600">
                            {openGroup.type === "Class hub"
                              ? "Class hub: assignments + pacing insights — no member lists."
                              : openGroup.visibility === "Private"
                              ? "Private group: keep chat small and practical."
                              : openGroup.type === "Organization"
                              ? "Organization: see members + message people."
                              : "Clear expectations before you commit."}
                          </div>
                        </div>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={pillStyleBase(false)}
                        >
                          {openGroup.category}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={badgeStyle(openGroup.visibility === "Verified" ? "Verified" : openGroup.visibility)}
                        >
                          {openGroup.visibility}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={badgeStyle(openGroup.active ? "Active" : "Quiet")}
                        >
                          {openGroup.active ? "Active" : "Quiet"}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={badgeStyle("Chat")}
                        >
                          {openGroup.chatEnabled ? "Chat · max 20" : "No chat"}
                        </span>

                        <span
                          className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
                          style={pillStyleBase(false)}
                        >
                          {openGroup.memberCount} members
                        </span>
                      </div>

                      <div className="mt-3 text-sm text-neutral-800">
                        <span className="text-neutral-500">Expectations:</span> {openGroup.expectations}
                      </div>

                      {openGroup.type === "Class hub" && openGroup.classStats && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <MiniStat label="Avg / week" value={openGroup.classStats.avgTimePerWeek} />
                          <MiniStat label="Difficulty" value={openGroup.classStats.difficulty} />
                          <MiniStat label="Exam 1 avg" value={openGroup.classStats.exam1Avg} />
                          <MiniStat label="Exam 2 avg" value={openGroup.classStats.exam2Avg} />
                        </div>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {getGroupTabs(openGroup).map((t) => (
                        <button
                          key={t}
                          onClick={() => setGroupTab(t)}
                          className={cx(
                            "rounded-full px-3 py-1.5 text-[11px] font-semibold border transition",
                            groupTab === t
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white border-neutral-200 hover:bg-neutral-50"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Content */}
                    <div className="mt-4 space-y-4">
                      {/* Assignments (class) */}
                      {groupTab === "Assignments" && openGroup.type === "Class hub" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">Upcoming assignments</div>
                              <div className="mt-1 text-xs text-neutral-600">UI shell — sync later from syllabus/LMS.</div>
                            </div>
                            <span className="text-[11px] text-neutral-500">Focus</span>
                          </div>

                          <div className="mt-4 space-y-2">
                            {(openGroup.upcomingAssignments ?? []).length === 0 ? (
                              <div className="text-sm text-neutral-600">No assignments added yet.</div>
                            ) : (
                              (openGroup.upcomingAssignments ?? []).map((a) => (
                                <div
                                  key={a.title + a.due}
                                  className="rounded-2xl border bg-white px-3 py-3"
                                  style={surfaceSoftStyle}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-neutral-900 truncate">{a.title}</div>
                                      <div className="mt-1 text-xs text-neutral-600">Due {a.due}</div>
                                    </div>
                                    <div className="text-[11px] text-neutral-600 whitespace-nowrap">{a.estTime}</div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Chat (private only) */}
                      {groupTab === "Chat" && openGroup.visibility === "Private" && openGroup.chatEnabled && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">Group chat</div>
                              <div className="text-xs text-neutral-600 mt-1">Private groups only (max 20). UI shell.</div>
                            </div>
                            <div className="text-[11px] text-neutral-500">MVP</div>
                          </div>

                          <div className="mt-4 rounded-2xl border bg-white p-3 h-[320px] overflow-y-auto" style={surfaceSoftStyle}>
                            <div className="space-y-3">
                              {(chatByGroup[openGroup.id] ?? []).map((m) => (
                                <div key={m.id} className="flex items-start gap-3">
                                  <div
                                    className="h-8 w-8 rounded-xl border bg-white flex items-center justify-center text-[10px] font-semibold text-neutral-800"
                                    style={{
                                      ...surfaceSoftStyle,
                                      borderColor: m.who === "You" ? rgbaBrand(0.30) : "rgba(0,0,0,0.10)",
                                    }}
                                  >
                                    {m.who === "You" ? "YOU" : "MEM"}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <div className="text-xs font-semibold text-neutral-900">{m.who}</div>
                                      <div className="text-[11px] text-neutral-500">{m.ts}</div>
                                    </div>
                                    <div className="mt-1 text-sm text-neutral-900 leading-relaxed">{m.text}</div>
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
                              className="flex-1 rounded-2xl border bg-white px-3 py-2 text-sm outline-none placeholder:text-neutral-500"
                              style={surfaceSoftStyle}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") sendChat();
                              }}
                            />
                            <button
                              onClick={sendChat}
                              className="rounded-2xl px-3 py-2 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                              style={surfaceSoftStyle}
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}

                      {/* People */}
                      {groupTab === "People" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-neutral-900">People</div>
                              <div className="mt-1 text-xs text-neutral-600">
                                {openGroup.type === "Class hub"
                                  ? "Class hubs don’t show member lists (privacy by design)."
                                  : openGroup.type === "Organization"
                                  ? "Organizations: view members + message people."
                                  : "Private groups: view members (UI shell)."}
                              </div>
                            </div>
                            <div className="text-[11px] text-neutral-500">{openGroup.memberCount} total</div>
                          </div>

                          {openGroup.type === "Class hub" ? (
                            <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                              <div className="text-sm text-neutral-700">
                                Member list hidden. You only see aggregated stats + assignments.
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 space-y-2">
                              {(openGroup.membersList ?? []).length === 0 ? (
                                <div className="text-sm text-neutral-600">No member list yet.</div>
                              ) : (
                                (openGroup.membersList ?? []).map((m) => (
                                  <div
                                    key={m.id}
                                    className="rounded-2xl border bg-white px-3 py-3 flex items-center justify-between gap-3"
                                    style={surfaceSoftStyle}
                                  >
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-neutral-900 truncate">{m.name}</div>
                                      {m.email ? <div className="text-[11px] text-neutral-500 truncate">{m.email}</div> : null}
                                    </div>

                                    {openGroup.type === "Organization" ? (
                                      <button
                                        onClick={() => showToast(`DM to ${m.name} (UI shell)`)}
                                        className="h-9 rounded-2xl px-3 text-xs font-semibold border bg-white hover:bg-black/[0.03] transition"
                                        style={{
                                          ...surfaceSoftStyle,
                                          borderColor: rgbaBrand(0.18),
                                        }}
                                      >
                                        Message
                                      </button>
                                    ) : null}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Overview */}
                      {groupTab === "Overview" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="text-sm font-semibold text-neutral-900">Overview</div>
                          <div className="mt-2 text-sm text-neutral-700 leading-relaxed">
                            {openGroup.type === "Class hub" ? (
                              <>
                                This is a <b>verified class hub</b>. You’ll see assignments + pacing insights, but not member lists.
                              </>
                            ) : openGroup.type === "Organization" ? (
                              <>
                                This is an <b>organization</b>. You can view members and privately message people.
                              </>
                            ) : openGroup.visibility === "Private" ? (
                              <>
                                This is a <b>private group</b>. Chat is enabled (max 20). Keep it coordination-only.
                              </>
                            ) : (
                              <>
                                This is a <b>public group</b>. No chat in MVP — join for structure + expectations.
                              </>
                            )}
                          </div>

                          <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                            <div className="text-xs text-neutral-600">UI shell: schedule suggestions + files attach later.</div>
                          </div>
                        </div>
                      )}

                      {/* Files */}
                      {groupTab === "Files" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="text-sm font-semibold text-neutral-900">Files</div>
                          <div className="mt-2 text-sm text-neutral-700">
                            UI shell — connects to your Files tab and adds group context.
                          </div>

                          <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                            <div className="text-xs text-neutral-600">No files yet.</div>
                          </div>
                        </div>
                      )}

                      {/* Schedule */}
                      {groupTab === "Schedule" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="text-sm font-semibold text-neutral-900">Schedule</div>
                          <div className="mt-2 text-sm text-neutral-700">
                            UI shell — opt-in schedule suggestions only. Nothing forced.
                          </div>

                          <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                            <div className="text-xs text-neutral-600">
                              Example: “Suggest a 60-min block Sunday afternoon” based on pacing.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-6" />
                  </div>

                  {/* Right column */}
                  <div className="lg:col-span-4 p-5 border-l bg-neutral-50" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <div className="rounded-3xl border bg-white p-4" style={surfaceSoftStyle}>
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">At a glance</div>
                        <button
                          onClick={() => showToast("Notifications (UI shell)")}
                          className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                          style={surfaceSoftStyle}
                          title="Notifications"
                        >
                          <Bell size={16} />
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        <InfoLine label="Type" value={openGroup.type} />
                        <InfoLine label="Visibility" value={openGroup.visibility} />
                        <InfoLine label="Members" value={`${openGroup.memberCount}`} />
                        <InfoLine label="Chat" value={openGroup.chatEnabled ? "Enabled (private only)" : "Off"} />
                      </div>

                      <div className="mt-4 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                        <div className="text-xs text-neutral-600">Design rule: no feeds, no streak pressure, no noise.</div>
                      </div>
                    </div>

                    {openGroup.visibility === "Private" ? (
                      <div className="mt-4 rounded-3xl border bg-white p-4" style={surfaceSoftStyle}>
                        <div className="text-sm font-semibold">Private group rules</div>
                        <div className="mt-2 text-sm text-neutral-700">Chat enabled • Max 20</div>
                        <div className="mt-3 rounded-2xl border bg-white px-3 py-3" style={surfaceSoftStyle}>
                          <div className="text-xs text-neutral-600">
                            Use for coordination (projects, scheduling). Keep it simple.
                          </div>
                        </div>
                      </div>
                    ) : null}
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

function getGroupTabs(g: Group): GroupModalTab[] {
  if (g.type === "Class hub") return ["Assignments", "Overview", "Schedule", "Files"];
  if (g.visibility === "Private" && g.chatEnabled) return ["Chat", "Overview", "People", "Schedule", "Files"];
  if (g.type === "Organization") return ["People", "Overview", "Files"];
  return ["Overview", "People", "Schedule", "Files"];
}

function GroupRow({
  group,
  isMyGroups,
  onOpen,
  onTogglePin,
  onNotify,
}: {
  group: Group;
  isMyGroups: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onNotify: (txt: string) => void;
}) {
  const leftDot = group.verified ? rgbaBrand(0.9) : "rgba(0,0,0,0.22)";
  const visibilityBadge = group.visibility === "Verified" ? "Verified" : group.visibility === "Private" ? "Private" : "Public";
  const hasUnread = !!group.unread && group.unread > 0 && group.chatEnabled;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={cx(
        "w-full rounded-3xl border bg-white px-5 py-4 transition relative overflow-hidden cursor-pointer",
        "hover:bg-black/[0.02] hover:-translate-y-[1px]"
      )}
      style={{
        borderColor: "rgba(0,0,0,0.08)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[6px]"
        style={{
          background: `linear-gradient(to bottom, ${leftDot}, rgba(255,255,255,0))`,
          opacity: 0.55,
        }}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="text-base font-semibold text-neutral-900 truncate">{group.name}</div>

            {isMyGroups ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onTogglePin();
                  onNotify(group.pinned ? "Unpinned" : "Pinned");
                }}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full border text-[11px] font-semibold hover:bg-black/[0.02] transition"
                style={{
                  borderColor: group.pinned ? rgbaBrand(0.22) : "rgba(0,0,0,0.10)",
                  background: group.pinned ? rgbaBrand(0.10) : "rgba(0,0,0,0.02)",
                  color: "rgba(0,0,0,0.78)",
                }}
                title={group.pinned ? "Unpin" : "Pin"}
              >
                <Pin size={12} />
                {group.pinned ? "Pinned" : "Pin"}
              </button>
            ) : null}
          </div>

          <div className="mt-1 text-sm text-neutral-600 leading-relaxed">{group.description}</div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
              style={badgeStyle(group.verified ? "Verified" : (visibilityBadge as any))}
            >
              {visibilityBadge}
            </span>

            <span
              className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold"
              style={badgeStyle(group.active ? "Active" : "Quiet")}
            >
              {group.active ? "Active" : "Quiet"}
            </span>

            <span className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold" style={badgeStyle("Chat")}>
              {group.chatEnabled ? "Chat · max 20" : "No chat"}
            </span>

            <span className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold" style={pillStyleBase(false)}>
              {group.category}
            </span>

            <span className="inline-flex items-center justify-center h-7 px-3 rounded-full border text-[11px] font-semibold" style={pillStyleBase(false)}>
              {group.memberCount} members
            </span>
          </div>

          <div className="mt-3 text-sm text-neutral-800">
            <span className="text-neutral-500">Expectations:</span> {group.expectations}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] text-neutral-500">{group.lastActivity}</div>
          <div className="mt-1 text-sm text-neutral-800 max-w-[260px] leading-snug">{group.lastActivityText}</div>

          <div className="mt-3 flex items-center justify-end gap-2">
            {group.chatEnabled ? (
              <div className="relative">
                <span className="inline-flex items-center justify-center h-9 w-9 rounded-2xl border bg-white" style={surfaceSoftStyle} aria-label="Chat" title="Chat">
                  <MessageSquare size={16} />
                </span>

                {hasUnread ? (
                  <span
                    className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full border text-[11px] font-semibold flex items-center justify-center"
                    style={{
                      borderColor: rgbaBrand(0.30),
                      background: rgbaBrand(0.14),
                      color: "rgba(0,0,0,0.82)",
                      boxShadow: `0 0 0 1px ${rgbaBrand(0.08)}`,
                    }}
                    title={`${group.unread} unread`}
                  >
                    {group.unread}
                  </span>
                ) : null}
              </div>
            ) : null}

            <span
              className="inline-flex items-center justify-center h-9 w-9 rounded-2xl border bg-white"
              style={{ ...surfaceSoftStyle, borderColor: rgbaBrand(0.18) }}
              aria-label="Members"
              title="Members"
            >
              <Users size={16} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI primitives ---------- */

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white px-3 py-2" style={surfaceSoftStyle}>
      <div className="text-[10px] text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-2" style={surfaceSoftStyle}>
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="text-sm font-semibold text-neutral-900">{value}</div>
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
  onClose,
  title,
  subtitle,
  children,
  maxWidthClass = "max-w-lg",
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className={cx("w-full rounded-3xl border bg-white p-6", maxWidthClass)}
        style={{
          boxShadow: "0 1px 0 rgba(0,0,0,0.04), 0 30px 90px rgba(0,0,0,0.18)",
          borderColor: "rgba(0,0,0,0.10)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle ? <div className="text-xs text-neutral-500 mt-1">{subtitle}</div> : null}
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
            style={surfaceSoftStyle}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
