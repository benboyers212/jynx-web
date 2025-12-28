"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const OLIVE = "#556B2F";

const tabs = [
  { label: "MyJynx", href: "/myjynx" },
  { label: "Groups", href: "/groups" },
  { label: "Schedule", href: "/" },
  { label: "Goals", href: "/goals" },
  { label: "Chat", href: "/chat", active: true },
  { label: "Files", href: "/files" },
];

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
};

type Thread = {
  id: string;
  title: string;
  createdAt: number;
  lastMessagePreview?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDay(ts: number) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}`;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function shortPreview(s: string, n = 58) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return t.slice(0, n - 1) + "…";
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export default function ChatPage() {
  const [threads, setThreads] = useState<Thread[]>(() => {
    const now = Date.now();
    return [
      {
        id: "t1",
        title: "Build schedule for today",
        createdAt: now,
        lastMessagePreview: "Optimize my blocks around class + gym…",
      },
      {
        id: "t2",
        title: "Study plan for finance final",
        createdAt: now - 24 * 60 * 60 * 1000,
        lastMessagePreview: "Make a 3-hour cram plan + formulas…",
      },
      {
        id: "t3",
        title: "Weekly routine revamp",
        createdAt: now - 2 * 24 * 60 * 60 * 1000,
        lastMessagePreview: "Rebuild my split without knee pain…",
      },
      {
        id: "t4",
        title: "Sunday errands + meal prep",
        createdAt: now - 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000,
        lastMessagePreview: "Plan groceries + prep list…",
      },
    ];
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id ?? "t1");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [cardsOpen, setCardsOpen] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hasChatted = messages.length > 0;

  // When first message appears, collapse overview by default
  useEffect(() => {
    if (hasChatted) setCardsOpen(false);
  }, [hasChatted]);

  // Autosize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = next + "px";
  }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const groupedThreads = useMemo(() => {
    const filtered = threads.filter((t) => {
      if (!historyQuery.trim()) return true;
      const q = historyQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.lastMessagePreview ?? "").toLowerCase().includes(q)
      );
    });

    const groups = new Map<string, Thread[]>();
    filtered
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((t) => {
        const key = formatDay(t.createdAt);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      });

    return Array.from(groups.entries()).map(([day, items]) => ({ day, items }));
  }, [threads, historyQuery]);

  function newChat() {
    const now = Date.now();
    const id = uid();
    const t: Thread = { id, title: "New chat", createdAt: now, lastMessagePreview: "" };
    setThreads((prev) => [t, ...prev]);
    setActiveThreadId(id);
    setMessages([]);
    setInput("");
    setCardsOpen(true);
  }

  function onSend() {
    const text = input.trim();
    if (!text) return;

    const now = Date.now();

    setMessages((prev) => [
      ...prev,
      { id: uid(), role: "user", content: text, createdAt: now },
      {
        id: uid(),
        role: "assistant",
        content:
          "Got it. (UI shell) — this is where the assistant response will appear once wired to your backend.",
        createdAt: now + 250,
      },
    ]);

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t;
        const title =
          t.title === "New chat" || t.title === "" ? shortPreview(text, 34) : t.title;
        return { ...t, title, lastMessagePreview: shortPreview(text, 70) };
      })
    );

    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  // === Styling tokens ===
  const panelBase =
    "rounded-3xl border bg-white/6 backdrop-blur";
  const panelInner =
    "rounded-2xl border bg-neutral-900/40";
  const buttonBase =
    "rounded-2xl px-3 py-2 text-xs font-semibold border transition";

  // Prominent olive border (this is the main change you asked for)
  const oliveCardStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.60)",
    boxShadow:
      "0 0 0 1px rgba(85,107,47,0.55), 0 18px 50px rgba(0,0,0,0.40)",
  };

  const oliveSoftStyle: React.CSSProperties = {
    borderColor: "rgba(85,107,47,0.42)",
    boxShadow: "0 0 0 1px rgba(85,107,47,0.28)",
  };

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

        {/* History */}
        <aside className="w-[290px] border-r border-white/10 bg-neutral-950/45 backdrop-blur hidden lg:flex flex-col">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold tracking-wide">History</div>
              <div className="ml-auto" />
              <button
                onClick={newChat}
                className="rounded-xl px-3 py-2 text-xs font-semibold border border-white/12 bg-white/6 hover:bg-white/10 transition"
                style={oliveSoftStyle}
              >
                + New Chat
              </button>
            </div>

            <div className="mt-3">
              <input
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-xl border border-white/12 bg-white/6 px-3 py-2 text-sm outline-none placeholder:text-neutral-500 focus:ring-2 focus:ring-white/10"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {groupedThreads.length === 0 ? (
              <div className="p-3 text-sm text-neutral-400">No chats found.</div>
            ) : (
              <div className="space-y-4">
                {groupedThreads.map((g) => (
                  <div key={g.day}>
                    <div className="px-2 mb-2 text-[11px] uppercase tracking-wider text-neutral-500">
                      {g.day}
                    </div>

                    <div className="space-y-1">
                      {g.items.map((t) => {
                        const active = t.id === activeThreadId;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              setActiveThreadId(t.id);
                              setMessages([]);
                              setCardsOpen(true);
                              setInput("");
                            }}
                            className={cx(
                              "w-full text-left rounded-2xl px-3 py-3 border transition relative",
                              active
                                ? "border-white/18 bg-white/12"
                                : "border-white/12 bg-white/6 hover:bg-white/10 hover:border-white/18"
                            )}
                          >
                            {active && (
                              <span
                                className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                                style={{ backgroundColor: OLIVE }}
                              />
                            )}

                            <div className="flex items-start gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold truncate">{t.title}</div>
                                <div className="mt-1 text-xs text-neutral-300/80 truncate">
                                  {t.lastMessagePreview || "—"}
                                </div>
                              </div>
                              <div className="text-[11px] text-neutral-500 whitespace-nowrap">
                                {formatTime(t.createdAt)}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main column: header + scrollable content + sticky composer */}
        <section className="flex-1 flex flex-col h-full">
          {/* Header */}
          <header className="border-b border-white/10 bg-neutral-950/45 backdrop-blur shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-wide truncate">
                  {threads.find((t) => t.id === activeThreadId)?.title || "Chat"}
                </div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  Ask, plan, adjust — your workspace stays focused.
                </div>
              </div>

              <div className="ml-auto">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[11px] text-neutral-200">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400/80" />
                  UI shell
                </div>
              </div>
            </div>
          </header>

          {/* Scrollable content area (composer stays visible) */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-5 pb-28">
              {/* PRE-CHAT: compact dashboard ONLY */}
              {!hasChatted ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* A */}
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-2xl flex items-center justify-center border border-white/12 bg-white/6 text-xs"
                          style={oliveSoftStyle}
                        >
                          ✓
                        </div>
                        <div className="text-sm font-semibold">Today’s Priorities</div>
                        <div className="ml-auto text-[11px] text-neutral-400">quick summary</div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {[
                          { label: "Finish chat UI layout + styling", meta: "45m" },
                          { label: "Implement message persistence later", meta: "30m" },
                          { label: "Plan tomorrow’s schedule blocks", meta: "10m" },
                        ].map((it) => (
                          <div
                            key={it.label}
                            className={cx(panelInner, "px-3 py-2")}
                            style={{ borderColor: "rgba(255,255,255,0.12)" }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-4 w-4 rounded-md border border-white/15 bg-white/6" />
                              <div className="min-w-0 flex-1">
                                <div className="text-sm text-neutral-100 truncate">{it.label}</div>
                                <div className="text-xs text-neutral-400">{it.meta}</div>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/12 text-neutral-200">
                                focus
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          className={cx(buttonBase, "bg-white/10 hover:bg-white/14")}
                          style={oliveSoftStyle}
                          onClick={() => alert("UI shell")}
                        >
                          Build my schedule
                        </button>
                        <button
                          className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                          onClick={() => alert("UI shell")}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* B */}
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-2xl flex items-center justify-center border border-white/12 bg-white/6 text-xs"
                          style={oliveSoftStyle}
                        >
                          ⏱
                        </div>
                        <div className="text-sm font-semibold">Schedule Snapshot</div>
                        <div className="ml-auto text-[11px] text-neutral-400">today</div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {[
                          { time: "Morning", label: "Deep work block", tag: "90m" },
                          { time: "Afternoon", label: "Class / meetings", tag: "2–3h" },
                          { time: "Evening", label: "Gym + dinner", tag: "75m" },
                        ].map((b) => (
                          <div
                            key={b.time}
                            className={cx(panelInner, "px-3 py-2 flex items-center gap-3")}
                            style={{ borderColor: "rgba(255,255,255,0.12)" }}
                          >
                            <div className="w-20 text-xs text-neutral-400">{b.time}</div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm text-neutral-100 truncate">{b.label}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/12 text-neutral-200">
                              {b.tag}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <button
                          className={cx(buttonBase, "bg-white/10 hover:bg-white/14")}
                          style={oliveSoftStyle}
                          onClick={() => alert("UI shell")}
                        >
                          Optimize
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* F (fixed height + internal scroll so the whole page doesn’t push composer off-screen) */}
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-2xl flex items-center justify-center border border-white/12 bg-white/6 text-xs"
                          style={oliveSoftStyle}
                        >
                          ✦
                        </div>
                        <div className="text-sm font-semibold">Suggested Actions</div>
                        <div className="ml-auto text-[11px] text-neutral-400">AI nudges</div>
                      </div>

                      <div className="mt-3 space-y-2 max-h-[170px] overflow-y-auto pr-1">
                        {[
                          "You have a big gap midday — want a 60–90m focus block inserted?",
                          "If you move gym 30m earlier, you’ll avoid a late-night crush.",
                          "Want me to turn today’s priorities into time blocks automatically?",
                          "Do you want a 2-hour deep work block before your first meeting?",
                        ].map((s) => (
                          <button
                            key={s}
                            className="w-full text-left rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 hover:bg-white/6 transition"
                            onClick={() => setInput(s)}
                          >
                            <div className="text-sm text-neutral-100">{s}</div>
                            <div className="mt-1 text-xs text-neutral-400">Click to send/edit</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* D */}
                  <div className={panelBase} style={oliveCardStyle}>
                    <div className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-2xl flex items-center justify-center border border-white/12 bg-white/6 text-xs"
                          style={oliveSoftStyle}
                        >
                          ⬇
                        </div>
                        <div className="text-sm font-semibold">Inbox</div>
                        <div className="ml-auto text-[11px] text-neutral-400">drop-off zone</div>
                      </div>

                      <div className="mt-3 rounded-3xl border border-dashed border-white/18 bg-neutral-900/35 px-4 py-5 text-center">
                        <div className="text-sm text-neutral-200">Drop files / notes here (later)</div>
                        <div className="mt-1 text-xs text-neutral-400">
                          For now, this is a placeholder card.
                        </div>

                        <div className="mt-3 flex justify-center gap-2">
                          <Link
                            href="/files"
                            className={cx(buttonBase, "bg-white/10 hover:bg-white/14")}
                            style={oliveSoftStyle}
                          >
                            Go to Files
                          </Link>
                          <button
                            className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                            onClick={() => alert("UI shell")}
                          >
                            Upload (later)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Chat mode: overview bar (toggle ALWAYS works now) */}
                  <button
                    onClick={() => setCardsOpen((v) => !v)}
                    className={cx(panelBase, "w-full px-4 py-3 flex items-center gap-3 hover:bg-white/8 transition")}
                    style={oliveCardStyle}
                  >
                    <div
                      className="h-8 w-8 rounded-2xl border border-white/12 bg-white/6 flex items-center justify-center"
                      style={oliveSoftStyle}
                    >
                      ≡
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-sm font-semibold">Today Overview</div>
                      <div className="text-xs text-neutral-400 truncate">
                        Priorities • Schedule • Suggested actions • Inbox
                      </div>
                    </div>
                    <div className="text-xs text-neutral-200">{cardsOpen ? "Hide" : "Show"}</div>
                  </button>

                  {cardsOpen && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Re-show all 4 cards in compact form */}
                      <div className={panelBase} style={oliveCardStyle}>
                        <div className="p-4">
                          <div className="text-sm font-semibold">Today’s Priorities</div>
                          <div className="mt-3 space-y-2 text-sm text-neutral-200">
                            <div className="rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2">
                              Finish chat UI layout + styling
                            </div>
                            <div className="rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2">
                              Implement message persistence later
                            </div>
                            <div className="rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2">
                              Plan tomorrow’s schedule blocks
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={panelBase} style={oliveCardStyle}>
                        <div className="p-4">
                          <div className="text-sm font-semibold">Schedule Snapshot</div>
                          <div className="mt-3 space-y-2 text-sm text-neutral-200">
                            <div className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2">
                              <span>Morning</span>
                              <span className="text-xs text-neutral-400">Deep work</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2">
                              <span>Afternoon</span>
                              <span className="text-xs text-neutral-400">Class / meetings</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2">
                              <span>Evening</span>
                              <span className="text-xs text-neutral-400">Gym + dinner</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className={panelBase} style={oliveCardStyle}>
                        <div className="p-4">
                          <div className="text-sm font-semibold">Suggested Actions</div>
                          <div className="mt-3 space-y-2 text-sm text-neutral-200">
                            <button
                              onClick={() => setInput("Insert a 60–90m focus block in my midday gap and adjust my schedule.")}
                              className="w-full text-left rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 hover:bg-white/6 transition"
                            >
                              Insert a focus block midday
                            </button>
                            <button
                              onClick={() => setInput("Move gym 30 minutes earlier and re-balance the rest of my evening.")}
                              className="w-full text-left rounded-2xl border border-white/12 bg-neutral-900/40 px-3 py-2 hover:bg-white/6 transition"
                            >
                              Move gym earlier
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className={panelBase} style={oliveCardStyle}>
                        <div className="p-4">
                          <div className="text-sm font-semibold">Inbox</div>
                          <div className="mt-3 rounded-2xl border border-dashed border-white/18 bg-neutral-900/35 px-3 py-6 text-center text-sm text-neutral-300">
                            Drop-off zone (files/notes) — placeholder
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link
                              href="/files"
                              className={cx(buttonBase, "bg-white/10 hover:bg-white/14")}
                              style={oliveSoftStyle}
                            >
                              Files
                            </Link>
                            <button
                              onClick={() => alert("UI shell")}
                              className={cx(buttonBase, "bg-transparent hover:bg-white/6 border-white/12")}
                            >
                              Upload (later)
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thread */}
                  <div className={cx(panelBase, "mt-4")} style={oliveCardStyle}>
                    <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                      <div className="text-sm font-semibold">Thread</div>
                      <div className="ml-auto text-xs text-neutral-400">
                        {messages.length ? `${messages.length} messages` : "No messages yet"}
                      </div>
                    </div>

                    <div className="px-5 py-5 space-y-4">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cx(
                              "max-w-[720px] rounded-3xl px-4 py-3 border",
                              m.role === "user"
                                ? "border-white/12 bg-neutral-900/40"
                                : "border-white/12 bg-white/6"
                            )}
                            style={
                              m.role === "user"
                                ? { boxShadow: "0 0 0 1px rgba(85,107,47,0.35)" }
                                : undefined
                            }
                          >
                            <div className="text-sm leading-relaxed text-neutral-100 whitespace-pre-wrap">
                              {m.content}
                            </div>
                            <div className="mt-2 text-[11px] text-neutral-500">
                              {formatTime(m.createdAt)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={bottomRef} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sticky Composer (ALWAYS visible) */}
          <div className="border-t border-white/10 bg-neutral-950/70 backdrop-blur shrink-0">
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="mx-auto max-w-3xl">
                <div className="rounded-3xl border bg-white/6 px-3 py-3" style={oliveCardStyle}>
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Message Jynx…"
                      rows={1}
                      className="w-full resize-none bg-transparent outline-none text-sm text-neutral-100 placeholder:text-neutral-500 leading-relaxed px-2"
                      style={{ height: 0 }}
                    />

                    <button
                      onClick={onSend}
                      disabled={!input.trim()}
                      className={cx(
                        "shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold transition border",
                        input.trim()
                          ? "border-white/12 bg-white/12 hover:bg-white/16"
                          : "border-white/5 bg-white/5 text-neutral-500 cursor-not-allowed"
                      )}
                      style={
                        input.trim()
                          ? {
                              boxShadow:
                                "0 0 0 2px rgba(85,107,47,0.40), 0 12px 30px rgba(0,0,0,0.35)",
                            }
                          : undefined
                      }
                    >
                      Send
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2 px-2">
                    <span className="text-[11px] text-neutral-500">
                      Enter to send • Shift+Enter for a new line
                    </span>
                    <span className="ml-auto text-[11px] text-neutral-500">
                      UI shell • not wired yet
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Build my schedule today",
                    "What should I prioritize next?",
                    "Optimize my day into time blocks",
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="rounded-full border border-white/12 bg-white/6 px-3 py-1.5 text-[11px] text-neutral-200 hover:bg-white/10 transition"
                      style={oliveSoftStyle}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
