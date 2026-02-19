"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  Menu,
  Search,
  Plus,
  Bell,
  Pin,
  ChevronRight,
} from "lucide-react";
import { useTheme } from "../ThemeContext";


const BRAND_RGB = { r: 31, g: 138, b: 91 };
function rgbaBrand(a: number) {
  return `rgba(${BRAND_RGB.r},${BRAND_RGB.g},${BRAND_RGB.b},${a})`;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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

type GroupEvent = {
  id: string;
  title: string;
  group: string;
  time: string;
  required: boolean;
  duration: string;
  location: string;
  notes: string;
};

function pillStyleBase(active?: boolean, dark?: boolean): CSSProperties {
  return {
    borderColor: active ? rgbaBrand(0.26) : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
    background: active ? rgbaBrand(0.10) : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)"),
    color: active ? (dark ? "rgba(240,240,240,0.82)" : "rgba(0,0,0,0.82)") : (dark ? "rgba(240,240,240,0.70)" : "rgba(0,0,0,0.70)"),
    boxShadow: active ? `0 0 0 1px ${rgbaBrand(0.08)}` : undefined,
  };
}

function badgeStyle(kind: "Verified" | "Private" | "Public" | "Active" | "Chat" | "Quiet", dark?: boolean): CSSProperties {
  const base: CSSProperties = {
    borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
    color: dark ? "rgba(240,240,240,0.72)" : "rgba(0,0,0,0.72)",
  };

  if (kind === "Verified") {
    return {
      borderColor: rgbaBrand(0.28),
      background: rgbaBrand(0.10),
      color: dark ? "rgba(240,240,240,0.80)" : "rgba(0,0,0,0.80)",
      boxShadow: `0 0 0 1px ${rgbaBrand(0.06)}`,
    };
  }

  if (kind === "Active") {
    return {
      borderColor: rgbaBrand(0.20),
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      color: dark ? "rgba(240,240,240,0.64)" : "rgba(0,0,0,0.64)",
    };
  }

  if (kind === "Quiet") {
    return {
      borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      color: dark ? "rgba(240,240,240,0.58)" : "rgba(0,0,0,0.58)",
    };
  }

  if (kind === "Chat") {
    return {
      borderColor: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
      background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
      color: dark ? "rgba(240,240,240,0.66)" : "rgba(0,0,0,0.66)",
    };
  }

  return base;
}


type MainTab = "My groups" | "Discover";
type GroupModalTab = "Overview" | "Chat" | "Assignments" | "People" | "Files" | "Schedule";

export default function GroupsPage() {
  const { dark } = useTheme();

  const surfaceStyle: CSSProperties = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    boxShadow: dark
      ? "0 1px 0 rgba(255,255,255,0.04), 0 18px 50px rgba(0,0,0,0.20)"
      : "0 1px 0 rgba(0,0,0,0.04), 0 18px 50px rgba(0,0,0,0.06)",
  };

  const surfaceSoftStyle: CSSProperties = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    boxShadow: dark
      ? "0 0 0 1px rgba(255,255,255,0.04)"
      : "0 0 0 1px rgba(0,0,0,0.04)",
  };

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
  const [showInbox, setShowInbox] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<GroupEvent | null>(null);

  // Inbox — no hardcoded data
  const inboxCount = 0;

  // Upcoming group events — none yet (no cross-group event API)
  const upcomingEvents: GroupEvent[] = [];

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

  // Chat state — backed by Conversations API
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatDraft, setChatDraft] = useState("");

  // Group detail state (for Files + Assignments tabs)
  const [groupFiles, setGroupFiles] = useState<any[]>([]);
  const [groupTasks, setGroupTasks] = useState<any[]>([]);

  // My groups — fetched from API
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  // Map API group type to UI GroupType
  function apiTypeToUiType(t: string): GroupType {
    if (t === "class") return "Class hub";
    if (t === "project") return "Project";
    return "Study group";
  }

  // Map API group → UI Group shape
  function mapApiGroup(g: any): Group {
    return {
      id: g.id,
      name: g.name,
      type: apiTypeToUiType(g.type ?? "general"),
      visibility: "Private",
      category: "Study",
      active: true,
      memberCount: g.members?.length ?? 1,
      chatEnabled: true,
      description: g.description ?? "",
      expectations: "",
      pinned: g.memberPinned === true,
      unread: 0,
      lastActivity: "Recently",
      lastActivityText: "",
      membersList: (g.members ?? []).map((m: any) => ({
        id: m.user?.id ?? m.userId,
        name: m.user?.name ?? "Member",
        email: m.user?.email,
      })),
    };
  }

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((res) => {
        const raw: any[] = res?.data ?? res ?? [];
        setMyGroups(raw.map(mapApiGroup));
      })
      .catch(console.error)
      .finally(() => setLoadingGroups(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Discover groups — no public group discovery API yet
  const discoverGroups: Group[] = [];

  // Activity feed — empty for now (no real-time feed yet)
  const activity: Activity[] = [];

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

  const maxW = "max-w-[1600px]";

  async function loadGroupChat(groupId: string) {
    setChatLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/chat`);
      const body = await res.json();
      if (body?.success && body.data) {
        setChatMsgs(body.data.messages ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  }

  async function loadGroupFiles(groupId: string) {
    try {
      const res = await fetch(`/api/files?groupId=${groupId}`);
      const body = await res.json();
      setGroupFiles(body?.data ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadGroupTasks(groupId: string) {
    try {
      const res = await fetch(`/api/tasks?groupId=${groupId}`);
      const body = await res.json();
      setGroupTasks(body?.data ?? []);
    } catch (err) {
      console.error(err);
    }
  }

  function openGroupModal(g: Group) {
    setOpenGroup(g);
    setGroupExpanded(false);
    setChatMsgs([]);
    setGroupFiles([]);
    setGroupTasks([]);

    // Default tab based on group type
    if (g.type === "Class hub") setGroupTab("Assignments");
    else if (g.visibility === "Private" && g.chatEnabled) setGroupTab("Chat");
    else if (g.type === "Organization") setGroupTab("People");
    else setGroupTab("Overview");

    // Load backend data
    loadGroupChat(g.id);
    loadGroupFiles(g.id);
    loadGroupTasks(g.id);
  }

  function closeGroupModal() {
    setOpenGroup(null);
    setGroupExpanded(false);
    setChatDraft("");
    setInviteEmail("");
    setChatMsgs([]);
    setGroupFiles([]);
    setGroupTasks([]);
  }

  async function togglePin(groupId: string) {
    const g = myGroups.find((x) => x.id === groupId);
    if (!g) return;
    const nextPinned = !g.pinned;
    // Optimistic update
    setMyGroups((prev) => prev.map((x) => (x.id === groupId ? { ...x, pinned: nextPinned } : x)));
    try {
      await fetch(`/api/groups/${groupId}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinned }),
      });
    } catch (err) {
      console.error(err);
      // Revert on failure
      setMyGroups((prev) => prev.map((x) => (x.id === groupId ? { ...x, pinned: g.pinned } : x)));
    }
  }

  async function createGroupNow() {
    const name = newName.trim();
    if (!name) {
      showToast("Add a group name");
      return;
    }

    const typeMap: Record<GroupType, string> = {
      "Class hub": "class",
      "Project": "project",
      "Study group": "social",
      "Accountability": "social",
      "Organization": "general",
    };

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: typeMap[newType] ?? "general",
          description: newDesc.trim() || null,
        }),
      });
      const body = await res.json();
      const created = body?.data ?? body;
      if (created?.id) {
        setMyGroups((prev) => [mapApiGroup(created), ...prev]);
        showToast("Group created");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to create group");
    }

    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    setNewCategory("Study");
    setNewType("Study group");
    setNewVisibility("Private");
  }

  async function sendChat() {
    if (!openGroup) return;
    if (!(openGroup.visibility === "Private" && openGroup.chatEnabled)) return;

    const txt = chatDraft.trim();
    if (!txt) return;

    setChatDraft("");

    try {
      const res = await fetch(`/api/groups/${openGroup.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: txt }),
      });
      const body = await res.json();
      if (body?.success && body.data) {
        setChatMsgs((prev) => [...prev, body.data as ChatMsg]);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to send message");
    }
  }

  async function inviteToGroup() {
    if (!openGroup) return;
    const email = inviteEmail.trim();
    if (!email || !email.includes("@")) {
      showToast("Enter a valid email");
      return;
    }

    try {
      // Look up user by email
      const searchRes = await fetch(`/api/users/search?email=${encodeURIComponent(email)}`);
      const searchBody = await searchRes.json();
      if (!searchBody?.success || !searchBody.data?.id) {
        showToast(searchBody?.error ?? "No Jynx account found with that email");
        return;
      }

      const targetUserId = searchBody.data.id;

      // Add as member
      const addRes = await fetch(`/api/groups/${openGroup.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const addBody = await addRes.json();
      if (!addBody?.success) {
        showToast(addBody?.error ?? "Failed to invite");
        return;
      }

      // Update local member list
      setMyGroups((prev) =>
        prev.map((g) => {
          if (g.id !== openGroup.id) return g;
          const alreadyIn = (g.membersList ?? []).some((m) => m.email === email);
          const nextMembers = alreadyIn
            ? g.membersList ?? []
            : [...(g.membersList ?? []), { id: targetUserId, name: searchBody.data.name ?? email.split("@")[0], email }];
          return { ...g, memberCount: alreadyIn ? g.memberCount : g.memberCount + 1, membersList: nextMembers };
        })
      );

      showToast("Invited!");
    } catch (err) {
      console.error(err);
      showToast("Failed to send invite");
    }

    setInviteEmail("");
  }

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
              borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
              boxShadow: dark ? "0 12px 40px rgba(0,0,0,0.30)" : "0 12px 40px rgba(0,0,0,0.10)",
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
            width: leftOpen ? "clamp(220px, 22vw, 460px)" : "56px",
            background: dark ? "rgba(15,15,15,0.88)" : "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderRight: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <div className="h-full flex flex-col">
            {/* Rail top control — same "Control center" pattern */}
            <div className={cx("px-3 pt-4", leftOpen ? "pb-3" : "pb-2 flex justify-center")}>
  <div className={cx("flex items-center", leftOpen ? "justify-start" : "justify-center")}>

                <button
                  onClick={() => setLeftOpen((v) => !v)}
                  className="h-10 w-10 rounded-2xl border bg-white hover:bg-black/[0.03] transition flex items-center justify-center"
                  style={surfaceSoftStyle}
                  aria-label="Toggle Groups rail"
                  title="Groups rail"
                >
                  <Menu size={18} />
                </button>

                {/* (match Schedule) no header text here */}
              </div>
            </div>

            {leftOpen ? (
              <>
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                  {/* Inbox */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Inbox</div>

                    <button
                      onClick={() => setShowInbox(true)}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
                      style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                    >
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center"
                        style={{ background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}
                      >
                        <Bell size={17} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-semibold" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>Inbox</div>
                      </div>
                      {inboxCount > 0 && (
                        <span
                          className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold text-white"
                          style={{ background: "#1F8A5B" }}
                        >
                          {inboxCount}
                        </span>
                      )}
                    </button>
                  </section>

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* Activity */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Activity</div>

                    <div className="space-y-1.5">
                      {activity.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => {
                            const g = myGroups.find((x) => x.id === a.groupId);
                            if (g) openGroupModal(g);
                            else showToast("That group isn't in My groups");
                          }}
                          className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl transition text-left"
                          style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                        >
                          <div
                            className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              background: a.kind === "chat" ? "#1F8A5B" : a.kind === "update" ? "#E8943A" : "#6C6CFF",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[12px] font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{a.groupName}</div>
                            <div className="text-[11px] leading-relaxed truncate" style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(0,0,0,0.55)" }}>{a.text}</div>
                          </div>
                          <div className="text-[10px] shrink-0 mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }}>{a.when}</div>
                        </button>
                      ))}
                    </div>
                  </section>

                  <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }} />

                  {/* Upcoming events */}
                  <section>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Upcoming</div>

                    <div className="space-y-1.5">
                      {upcomingEvents.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className="w-full flex items-start gap-2.5 px-3 py-2 rounded-xl transition text-left"
                          style={{ background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <div className="text-[12px] font-semibold truncate" style={{ color: dark ? "rgba(240,240,240,0.90)" : "rgba(0,0,0,0.90)" }}>{ev.title}</div>
                              <span
                                className="inline-flex items-center justify-center h-3.5 px-1.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                                style={{
                                  background: ev.required
                                    ? (dark ? "rgba(31,138,91,0.18)" : "rgba(31,138,91,0.12)")
                                    : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                                  color: ev.required
                                    ? "#1F8A5B"
                                    : (dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.45)"),
                                }}
                              >
                                {ev.required ? "Required" : "Optional"}
                              </span>
                            </div>
                            <div className="text-[11px] mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.55)" : "rgba(0,0,0,0.55)" }}>{ev.time} · {ev.duration}</div>
                          </div>
                          <ChevronRight size={14} className="shrink-0 mt-0.5" style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.40)" }} />
                        </button>
                      ))}
                    </div>
                  </section>
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
                          color: active ? (dark ? "rgba(240,240,240,0.88)" : "rgba(0,0,0,0.88)") : (dark ? "rgba(240,240,240,0.68)" : "rgba(0,0,0,0.68)"),
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
                {/* Loading state */}
                {loadingGroups && tab === "My groups" && (
                  <div className="text-sm" style={{ color: dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.50)" }}>Loading groups…</div>
                )}

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
                          dark={dark}
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
                          dark={dark}
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
        <Modal onClose={() => setShowCreate(false)} title="Create group" subtitle="Creates a new private group." dark={dark}>
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
          subtitle="Browse public and verified groups."
          maxWidthClass="max-w-4xl"
          dark={dark}
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

      {/* Inbox modal */}
      {showInbox && (
        <Modal
          onClose={() => setShowInbox(false)}
          title="Inbox"
          subtitle={`${inboxCount} pending`}
          dark={dark}
          maxWidthClass="max-w-md"
        >
          <div className="text-sm text-neutral-600">
            No pending invitations or requests.
          </div>
        </Modal>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <Modal
          onClose={() => setSelectedEvent(null)}
          title={selectedEvent.title}
          subtitle={selectedEvent.group}
          dark={dark}
          maxWidthClass="max-w-sm"
        >
          <div className="space-y-3">
            {/* Required / Optional badge */}
            <div>
              <span
                className="inline-flex items-center justify-center h-5 px-2.5 rounded-full text-[11px] font-bold uppercase tracking-wide"
                style={{
                  background: selectedEvent.required
                    ? (dark ? "rgba(31,138,91,0.18)" : "rgba(31,138,91,0.12)")
                    : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"),
                  color: selectedEvent.required
                    ? "#1F8A5B"
                    : (dark ? "rgba(240,240,240,0.50)" : "rgba(0,0,0,0.45)"),
                }}
              >
                {selectedEvent.required ? "Required" : "Optional"}
              </span>
            </div>

            {/* Detail rows */}
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="text-[11px] font-semibold text-neutral-500 w-20 shrink-0">When</div>
                <div className="text-[12px] text-neutral-900">{selectedEvent.time}</div>
              </div>
              <div className="flex gap-3">
                <div className="text-[11px] font-semibold text-neutral-500 w-20 shrink-0">Duration</div>
                <div className="text-[12px] text-neutral-900">{selectedEvent.duration}</div>
              </div>
              <div className="flex gap-3">
                <div className="text-[11px] font-semibold text-neutral-500 w-20 shrink-0">Where</div>
                <div className="text-[12px] text-neutral-900">{selectedEvent.location}</div>
              </div>
            </div>

            {/* Notes */}
            {selectedEvent.notes && (
              <div
                className="mt-2 px-3 py-2.5 rounded-xl"
                style={{ background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)" }}
              >
                <div className="text-[11px] font-semibold text-neutral-500 mb-1">Notes</div>
                <div className="text-[12px] text-neutral-700 leading-relaxed">{selectedEvent.notes}</div>
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
          subtitle="Group invitations and join requests."
          dark={dark}
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
                          <MiniStat label="Avg / week" value={openGroup.classStats.avgTimePerWeek} dark={dark} />
                          <MiniStat label="Difficulty" value={openGroup.classStats.difficulty} dark={dark} />
                          <MiniStat label="Exam 1 avg" value={openGroup.classStats.exam1Avg} dark={dark} />
                          <MiniStat label="Exam 2 avg" value={openGroup.classStats.exam2Avg} dark={dark} />
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
                      {/* Assignments */}
                      {groupTab === "Assignments" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="text-sm font-semibold text-neutral-900">Assignments</div>

                          <div className="mt-4 space-y-2">
                            {groupTasks.length === 0 ? (
                              <div className="text-sm text-neutral-600">No assignments yet.</div>
                            ) : (
                              groupTasks.map((t: any) => (
                                <div
                                  key={t.id}
                                  className="rounded-2xl border bg-white px-3 py-3"
                                  style={surfaceSoftStyle}
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-neutral-900 truncate">{t.title}</div>
                                      {t.dueDate && (
                                        <div className="mt-1 text-xs text-neutral-600">
                                          Due {new Date(t.dueDate).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    {t.priority && (
                                      <div className="text-[11px] text-neutral-600 whitespace-nowrap capitalize">{t.priority}</div>
                                    )}
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
                          <div className="text-sm font-semibold text-neutral-900 mb-4">Group chat</div>

                          <div className="rounded-2xl border bg-white p-3 h-[320px] overflow-y-auto" style={surfaceSoftStyle}>
                            {chatLoading ? (
                              <div className="text-sm text-neutral-500 text-center mt-6">Loading…</div>
                            ) : chatMsgs.length === 0 ? (
                              <div className="text-sm text-neutral-500 text-center mt-6">No messages yet. Say hello!</div>
                            ) : (
                              <div className="space-y-3">
                                {chatMsgs.map((m) => (
                                  <div key={m.id} className="flex items-start gap-3">
                                    <div
                                      className="h-8 w-8 rounded-xl border bg-white flex items-center justify-center text-[10px] font-semibold text-neutral-800 shrink-0"
                                      style={{
                                        ...surfaceSoftStyle,
                                        borderColor: rgbaBrand(0.30),
                                      }}
                                    >
                                      {m.who.slice(0, 3).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="text-xs font-semibold text-neutral-900">{m.who}</div>
                                        <div className="text-[11px] text-neutral-500">
                                          {new Date(m.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                      </div>
                                      <div className="mt-1 text-sm text-neutral-900 leading-relaxed">{m.text}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
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
                                  : "Private groups: view members."}
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
                                        onClick={() => showToast(`DM coming soon`)}
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

                        </div>
                      )}

                      {/* Files */}
                      {groupTab === "Files" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="text-sm font-semibold text-neutral-900">Files</div>

                          <div className="mt-4 space-y-2">
                            {groupFiles.length === 0 ? (
                              <div className="text-sm text-neutral-600">No files yet. Add files from the Files page and tag them to this group.</div>
                            ) : (
                              groupFiles.map((f: any) => (
                                <div
                                  key={f.id}
                                  className="rounded-2xl border bg-white px-3 py-3 flex items-center justify-between gap-3"
                                  style={surfaceSoftStyle}
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-neutral-900 truncate">{f.name}</div>
                                    <div className="text-[11px] text-neutral-500 mt-0.5 uppercase">{f.type}</div>
                                  </div>
                                  {f.url && (
                                    <a
                                      href={f.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                                      style={{ background: rgbaBrand(0.10), color: "#1F8A5B" }}
                                    >
                                      Open
                                    </a>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Schedule */}
                      {groupTab === "Schedule" && (
                        <div className="rounded-3xl border bg-white p-5" style={surfaceSoftStyle}>
                          <div className="text-sm font-semibold text-neutral-900">Schedule</div>
                          <div className="mt-2 text-sm text-neutral-700">
                            Opt-in schedule suggestions — coming soon.
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
                        <Bell size={16} style={{ color: dark ? "rgba(240,240,240,0.40)" : "rgba(0,0,0,0.35)" }} />
                      </div>

                      <div className="mt-3 space-y-2">
                        <InfoLine label="Type" value={openGroup.type} dark={dark} />
                        <InfoLine label="Visibility" value={openGroup.visibility} dark={dark} />
                        <InfoLine label="Members" value={`${openGroup.memberCount}`} dark={dark} />
                        <InfoLine label="Chat" value={openGroup.chatEnabled ? "Enabled (private only)" : "Off"} dark={dark} />
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
  dark,
  onOpen,
  onTogglePin,
  onNotify,
}: {
  group: Group;
  isMyGroups: boolean;
  dark: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onNotify: (txt: string) => void;
}) {
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
      className="w-full rounded-xl px-4 py-3.5 transition cursor-pointer relative overflow-hidden hover:scale-[1.005]"
      style={{
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
        boxShadow: dark
          ? "0 1px 3px rgba(0,0,0,0.15)"
          : "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Subtle green left accent for verified groups */}
      {group.verified && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{
            background: "linear-gradient(to bottom, #1F8A5B 0%, rgba(31,138,91,0.3) 100%)",
          }}
        />
      )}

      <div className="flex items-center justify-between gap-4">
        {/* Left: Name + optional subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-semibold text-neutral-900 truncate">{group.name}</div>
            {group.verified && (
              <div
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: "#1F8A5B" }}
                title="Verified"
              />
            )}
          </div>
          <div className="text-[12px] text-neutral-500 mt-0.5">{group.lastActivity}</div>
        </div>

        {/* Right: Activity indicator + pin */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Unread badge */}
          {hasUnread && (
            <span
              className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-bold"
              style={{
                background: "#1F8A5B",
                color: "#fff",
              }}
              title={`${group.unread} unread`}
            >
              {group.unread}
            </span>
          )}

          {/* Pin icon (My Groups only) */}
          {isMyGroups && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePin();
                onNotify(group.pinned ? "Unpinned" : "Pinned");
              }}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-black/[0.04] active:bg-black/[0.06] transition"
              style={{
                color: group.pinned
                  ? "#1F8A5B"
                  : dark
                  ? "rgba(240,240,240,0.30)"
                  : "rgba(0,0,0,0.22)",
              }}
              title={group.pinned ? "Unpin" : "Pin"}
            >
              <Pin size={14} />
            </button>
          )}

          {/* Subtle chevron indicator */}
          <ChevronRight
            size={16}
            className="shrink-0"
            style={{ color: dark ? "rgba(240,240,240,0.20)" : "rgba(0,0,0,0.15)" }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI primitives ---------- */

function MiniStat({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  const s: CSSProperties = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 0 0 1px rgba(255,255,255,0.04)" : "0 0 0 1px rgba(0,0,0,0.04)",
  };
  return (
    <div className="rounded-2xl border bg-white px-3 py-2" style={s}>
      <div className="text-[10px] text-neutral-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function InfoLine({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  const s: CSSProperties = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 0 0 1px rgba(255,255,255,0.04)" : "0 0 0 1px rgba(0,0,0,0.04)",
  };
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-2" style={s}>
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
  dark,
  maxWidthClass = "max-w-lg",
}: {
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  dark: boolean;
  maxWidthClass?: string;
}) {
  const modalSoftStyle: CSSProperties = {
    borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    boxShadow: dark ? "0 0 0 1px rgba(255,255,255,0.04)" : "0 0 0 1px rgba(0,0,0,0.04)",
  };
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className={cx("w-full rounded-3xl border bg-white p-6", maxWidthClass)}
        style={{
          boxShadow: dark
            ? "0 1px 0 rgba(255,255,255,0.04), 0 30px 90px rgba(0,0,0,0.40)"
            : "0 1px 0 rgba(0,0,0,0.04), 0 30px 90px rgba(0,0,0,0.18)",
          borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
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
            style={modalSoftStyle}
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
