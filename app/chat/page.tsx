"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const OLIVE = "#4b5e3c";

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  actionLabel?: string; // shown while a tool call is executing
};

type Thread = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt?: number;
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

type Attachment = { name: string; mediaType: string; data: string };

const SUPPORTED_MEDIA_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function readFileAsBase64(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(",")[1] ?? "";
      resolve({ name: file.name, mediaType: file.type, data });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as any)?.ok === false) {
    throw new Error((data as any)?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

async function apiPost<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as any)?.ok === false) {
    throw new Error((data as any)?.error || `Request failed: ${res.status}`);
  }
  return data as T;
}

export default function ChatPage() {
  // avoid hydration mismatch for timestamps
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");

  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Files (composer)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hasChatted = messages.length > 0;

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

  // Load threads on mount
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoadingThreads(true);
      setError(null);
      try {
        const data = await apiGet<{ ok: true; threads: Thread[] }>("/api/conversations");
        if (!alive) return;

        const list = Array.isArray(data.threads) ? data.threads : [];
        setThreads(list);

        if (list.length > 0) {
          setActiveThreadId(list[0].id);
        } else {
          setActiveThreadId("");
          setMessages([]);
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load conversations");
      } finally {
        if (!alive) return;
        setLoadingThreads(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  // Load messages whenever activeThreadId changes
  useEffect(() => {
    let alive = true;

    async function loadThread() {
      if (!activeThreadId) {
        setMessages([]);
        return;
      }

      setLoadingThread(true);
      setError(null);
      try {
        const data = await apiGet<{
          ok: true;
          conversation: { id: string; title: string; createdAt: number; updatedAt: number };
          messages: Message[];
        }>(`/api/conversations/${activeThreadId}`);

        if (!alive) return;
        setMessages(Array.isArray(data.messages) ? data.messages : []);

        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? { ...t, title: data.conversation?.title || t.title }
              : t
          )
        );
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Failed to load conversation");
        setMessages([]);
      } finally {
        if (!alive) return;
        setLoadingThread(false);
      }
    }

    loadThread();
    return () => {
      alive = false;
    };
  }, [activeThreadId]);

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
      .sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt))
      .forEach((t) => {
        const key = formatDay(t.createdAt);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(t);
      });

    return Array.from(groups.entries()).map(([day, items]) => ({ day, items }));
  }, [threads, historyQuery]);

  async function deleteThread(threadId: string) {
    try {
      await fetch(`/api/conversations/${threadId}`, { method: "DELETE" });
      setThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeThreadId === threadId) {
        const remaining = threads.filter((t) => t.id !== threadId);
        if (remaining.length > 0) {
          setActiveThreadId(remaining[0].id);
        } else {
          setActiveThreadId("");
          setMessages([]);
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to delete conversation");
    }
  }

  async function newChat() {
    setError(null);
    try {
      const data = await apiPost<{ ok: true; conversation: Thread }>("/api/conversations", {
        title: null,
      });

      const t = data.conversation;
      setThreads((prev) => [t, ...prev]);
      setActiveThreadId(t.id);
      setMessages([]);
      setInput("");
      setAttachedFiles([]);
    } catch (e: any) {
      setError(e?.message || "Failed to create a new chat");
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    setAttachedFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}|${f.size}|${f.lastModified}`));
      const next = [...prev];
      for (const f of list) {
        const key = `${f.name}|${f.size}|${f.lastModified}`;
        if (!seen.has(key)) next.push(f);
      }
      return next;
    });

    e.target.value = "";
  }

  function removeFileAt(idx: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function onSend() {
    const text = input.trim();
    if (!text && attachedFiles.length === 0) return;
    if (streaming) return;

    setError(null);

    const filesLine =
      attachedFiles.length > 0
        ? `\n\nAttached:\n${attachedFiles.map((f) => `• ${f.name}`).join("\n")}`
        : "";

    const userContent = (text || "(sent files)") + filesLine;
    const tempUserId = `temp_${uid()}`;
    const tempAssistantId = `streaming_${uid()}`;

    // Optimistic: show user message + empty streaming assistant message immediately
    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: userContent, createdAt: Date.now() },
      { id: tempAssistantId, role: "assistant", content: "", createdAt: Date.now(), isStreaming: true },
    ]);

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id !== activeThreadId) return t;
        const baseTitle =
          t.title === "New chat" || t.title === ""
            ? shortPreview(text || "Files", 34)
            : t.title;
        const previewBase =
          text || (attachedFiles.length ? `Attached ${attachedFiles.length} file(s)` : "");
        const preview =
          attachedFiles.length && text
            ? `${shortPreview(text, 52)} • +${attachedFiles.length} file(s)`
            : shortPreview(previewBase, 70);
        return { ...t, title: baseTitle, lastMessagePreview: preview, updatedAt: Date.now() };
      })
    );

    setInput("");
    setAttachedFiles([]);
    setStreaming(true);

    // Resolve conversation ID — create one if the user hasn't started a thread yet
    let threadId = activeThreadId;
    if (!threadId) {
      try {
        const created = await apiPost<{ ok: true; conversation: Thread }>("/api/conversations", {
          title: null,
        });
        threadId = created.conversation.id;
        setThreads((prev) => [created.conversation, ...prev]);
        setActiveThreadId(threadId);
      } catch (e: any) {
        setError(e?.message || "Failed to create conversation");
        setStreaming(false);
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserId && m.id !== tempAssistantId)
        );
        return;
      }
    }

    // Read supported files as base64 before the API call
    let attachments: Attachment[] = [];
    const supportedFiles = attachedFiles.filter((f) => SUPPORTED_MEDIA_TYPES.has(f.type));
    if (supportedFiles.length > 0) {
      try {
        attachments = await Promise.all(supportedFiles.map(readFileAsBase64));
      } catch (e: any) {
        setError(e?.message || "Failed to read attached file");
        setStreaming(false);
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempUserId && m.id !== tempAssistantId)
        );
        return;
      }
    }

    // Stream the send request
    try {
      const res = await fetch(`/api/conversations/${threadId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userContent,
          attachments: attachments.length > 0 ? attachments : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || `Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: any;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }

          if (event.type === "chunk") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, content: m.content + event.text, actionLabel: undefined }
                  : m
              )
            );
          } else if (event.type === "tool_start") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, actionLabel: event.label ?? event.tool }
                  : m
              )
            );
          } else if (event.type === "tool_done") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId ? { ...m, actionLabel: undefined } : m
              )
            );
            // Notify other pages (schedule, tasks) to re-fetch their data
            window.dispatchEvent(new CustomEvent("jynx:refresh"));
          } else if (event.type === "done") {
            setMessages((prev) =>
              prev.map((m) => {
                if (m.id === tempUserId) {
                  return { ...m, id: event.userId, createdAt: event.userCreatedAt };
                }
                if (m.id === tempAssistantId) {
                  return {
                    ...m,
                    id: event.assistantId,
                    createdAt: event.assistantCreatedAt,
                    isStreaming: false,
                  };
                }
                return m;
              })
            );
            setThreads((prev) =>
              prev.map((t) => (t.id === threadId ? { ...t, updatedAt: Date.now() } : t))
            );
          } else if (event.type === "error") {
            throw new Error(event.error);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to get response");
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempAssistantId)
      );
    } finally {
      setStreaming(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  // --- Light UI tokens (match the rest of the app) ---
  const border = "rgba(0,0,0,0.10)";
  const borderStrong = "rgba(0,0,0,0.14)";
  const surface = "var(--surface)";
  const bg = "var(--background)";
  const fg = "var(--foreground)";
  const muted = "var(--muted-foreground)";

  const pillStyle: React.CSSProperties = {
    borderColor: "rgba(0,0,0,0.10)",
    background: "rgba(0,0,0,0.02)",
  };

  const activeRowStyle: React.CSSProperties = {
    borderColor: "rgba(75,94,60,0.30)",
    boxShadow: "0 0 0 1px rgba(75,94,60,0.16)",
    background: "rgba(75,94,60,0.06)",
  };

  return (
    <main className="h-full overflow-hidden" style={{ background: bg, color: fg }}>
      <div className="relative flex h-full">
        {/* History */}
        <aside
          className="w-[320px] hidden md:flex flex-col border-r"
          style={{ borderColor: border, background: surface }}
        >
          <div className="p-4 border-b" style={{ borderColor: border }}>
            <div className="flex items-center gap-2">
              <div className="text-sm font-semibold tracking-wide">History</div>
              <div className="ml-auto" />
              <button
                onClick={newChat}
                className="rounded-xl px-3 py-2 text-xs font-semibold border transition hover:bg-black/[0.04]"
                style={{
                  borderColor: "rgba(75,94,60,0.26)",
                  background: "rgba(75,94,60,0.06)",
                }}
              >
                + New Chat
              </button>
            </div>

            <div className="mt-3">
              <input
                value={historyQuery}
                onChange={(e) => setHistoryQuery(e.target.value)}
                placeholder="Search chats…"
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: border,
                  background: "rgba(0,0,0,0.02)",
                  color: fg,
                }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loadingThreads ? (
              <div className="p-3 text-sm" style={{ color: muted }}>
                Loading…
              </div>
            ) : groupedThreads.length === 0 ? (
              <div className="p-3 text-sm" style={{ color: muted }}>
                No chats found.
              </div>
            ) : (
              <div className="space-y-4">
                {groupedThreads.map((g) => (
                  <div key={g.day}>
                    <div className="px-2 mb-2 text-[11px] uppercase tracking-wider" style={{ color: muted }}>
                      {g.day}
                    </div>

                    <div className="space-y-1">
                      {g.items.map((t) => {
                        const active = t.id === activeThreadId;

                        return (
                          <div
                            key={t.id}
                            className={cx(
                              "group relative rounded-2xl border transition",
                            )}
                            style={{
                              borderColor: border,
                              background: "rgba(255,255,255,0.65)",
                              ...(active ? activeRowStyle : null),
                            }}
                          >
                            {active && (
                              <span
                                className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                                style={{ backgroundColor: OLIVE }}
                              />
                            )}

                            <button
                              onClick={() => {
                                setActiveThreadId(t.id);
                                setInput("");
                                setAttachedFiles([]);
                              }}
                              className="w-full text-left px-3 py-3 hover:bg-black/[0.03] transition rounded-2xl"
                            >
                              <div className="flex items-start gap-2 pr-6">
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-semibold truncate">{t.title}</div>
                                  <div className="mt-1 text-xs truncate" style={{ color: muted }}>
                                    {t.lastMessagePreview || "—"}
                                  </div>
                                </div>
                                <div className="text-[11px] whitespace-nowrap" style={{ color: muted }}>
                                  <span suppressHydrationWarning>
                                    {mounted ? formatTime(t.createdAt) : ""}
                                  </span>
                                </div>
                              </div>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); deleteThread(t.id); }}
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/[0.06]"
                              style={{ color: "rgba(17,17,17,0.50)" }}
                              title="Delete conversation"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <section className="flex-1 flex flex-col h-full min-w-0">
          {/* Header */}
          <header className="shrink-0 border-b" style={{ borderColor: border, background: surface }}>
            <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold tracking-wide truncate">
                  {threads.find((t) => t.id === activeThreadId)?.title || "Chat"}
                </div>
                <div className="text-xs mt-0.5" style={{ color: muted }}>
                  {threads.length > 0 ? `${threads.length} conversation${threads.length !== 1 ? "s" : ""}` : "Start a conversation"}
                </div>
              </div>

            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-6 py-6 pb-48">
              {error && (
                <div
                  className="mb-4 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: "rgba(239,68,68,0.25)",
                    background: "rgba(239,68,68,0.08)",
                    color: "rgba(127,29,29,0.95)",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Empty-state overlay (fades away after you start chatting) */}
              <div
                className={cx(
                  "relative transition-opacity duration-300",
                  hasChatted ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
              >
                <div
                  className="rounded-3xl border px-6 py-6"
                  style={{
                    borderColor: border,
                    background: "rgba(255,255,255,0.70)",
                    boxShadow: "0 18px 55px rgba(0,0,0,0.08)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="h-11 w-11 rounded-2xl border flex items-center justify-center text-xs font-semibold"
                      style={{
                        borderColor: "rgba(75,94,60,0.22)",
                        background: "rgba(75,94,60,0.08)",
                        color: "rgba(17,17,17,0.85)",
                      }}
                    >
                      J
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-base font-semibold">Start a thread</div>
                      <div className="text-sm mt-1" style={{ color: muted }}>
                        Ask anything — planning, focus blocks, priorities. This panel disappears once you send your first message.
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          "Build my schedule today",
                          "What should I prioritize next?",
                          "Optimize my day into time blocks",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => setInput(q)}
                            className="rounded-full border px-3 py-1.5 text-[11px] font-semibold hover:bg-black/[0.04] transition"
                            style={pillStyle}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className={cx("mt-6", !hasChatted && "mt-8")}>
                <div className="space-y-4">
                  {loadingThread ? (
                    <div className="text-sm" style={{ color: muted }}>
                      Loading…
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm" style={{ color: muted }}>
                      {/* keep space calm; empty-state above handles guidance */}
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}
                      >
                        <div
                          className="max-w-[760px] rounded-3xl px-4 py-3 border"
                          style={{
                            borderColor: borderStrong,
                            background:
                              m.role === "user"
                                ? "rgba(75,94,60,0.08)"
                                : "rgba(255,255,255,0.80)",
                            boxShadow:
                              m.role === "user" ? "0 0 0 1px rgba(75,94,60,0.14)" : "none",
                          }}
                        >
                          <div
                            className="text-sm leading-relaxed whitespace-pre-wrap"
                            style={{ color: "rgba(17,17,17,0.92)" }}
                          >
                            {m.content}
                            {m.isStreaming && !m.actionLabel && (
                              <span
                                className="inline-block w-[2px] h-[14px] ml-[2px] align-middle animate-pulse"
                                style={{ background: OLIVE, borderRadius: 1 }}
                              />
                            )}
                          </div>

                          {m.actionLabel && (
                            <div
                              className="mt-1.5 flex items-center gap-1.5 text-xs"
                              style={{ color: OLIVE }}
                            >
                              <span
                                className="inline-block w-[6px] h-[6px] rounded-full animate-pulse"
                                style={{ background: OLIVE }}
                              />
                              {m.actionLabel}
                            </div>
                          )}

                          {!m.isStreaming && (
                            <div className="mt-2 text-[11px]" style={{ color: "rgba(17,17,17,0.55)" }}>
                              <span suppressHydrationWarning>
                                {mounted ? formatTime(m.createdAt) : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  <div ref={bottomRef} />
                </div>
              </div>
            </div>
          </div>

          {/* Composer */}
          <div className="sticky bottom-0 z-50 shrink-0 border-t" style={{ borderColor: border, background: surface }}>
            <div className="max-w-6xl mx-auto px-6 py-4">
              <div className="mx-auto max-w-4xl">
                <div
                  className="rounded-3xl border px-4 py-4"
                  style={{
                    borderColor: border,
                    background: "rgba(255,255,255,0.80)",
                    boxShadow: "0 18px 55px rgba(0,0,0,0.08)",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    onChange={onPickFiles}
                  />

                  {attachedFiles.length > 0 && (
                    <div className="pb-3">
                      <div className="flex flex-wrap gap-2">
                        {attachedFiles.map((f, idx) => (
                          <div
                            key={`${f.name}-${f.size}-${f.lastModified}-${idx}`}
                            className="flex items-center gap-2 rounded-full border px-3 py-1.5"
                            style={{
                              borderColor: border,
                              background: "rgba(0,0,0,0.02)",
                            }}
                          >
                            <span className="text-[11px] max-w-[260px] truncate" style={{ color: "rgba(17,17,17,0.78)" }}>
                              {f.name}
                            </span>
                            <button
                              onClick={() => removeFileAt(idx)}
                              className="text-[11px] transition hover:opacity-80"
                              style={{ color: "rgba(17,17,17,0.55)" }}
                              aria-label={`Remove ${f.name}`}
                              title="Remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-3">
                    <button
                      onClick={openFilePicker}
                      className="shrink-0 h-11 w-11 rounded-2xl border transition flex items-center justify-center hover:bg-black/[0.04]"
                      style={{
                        borderColor: border,
                        background: "rgba(0,0,0,0.02)",
                        color: "rgba(17,17,17,0.85)",
                      }}
                      title="Add file"
                      aria-label="Add file"
                    >
                      +
                    </button>

                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="Message Jynx…"
                      rows={1}
                      className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed px-2"
                      style={{
                        height: 0,
                        color: "rgba(17,17,17,0.92)",
                      }}
                    />

                    <button
                      onClick={onSend}
                      disabled={(!input.trim() && attachedFiles.length === 0) || loadingThread || streaming}
                      className={cx(
                        "shrink-0 rounded-2xl px-5 py-2.5 text-xs font-semibold transition border"
                      )}
                      style={
                        (input.trim() || attachedFiles.length) && !streaming
                          ? {
                              borderColor: "rgba(75,94,60,0.30)",
                              background: "rgba(75,94,60,0.10)",
                              color: "rgba(17,17,17,0.92)",
                              boxShadow: "0 0 0 1px rgba(75,94,60,0.14)",
                            }
                          : {
                              borderColor: "rgba(0,0,0,0.08)",
                              background: "rgba(0,0,0,0.03)",
                              color: "rgba(17,17,17,0.45)",
                              cursor: "not-allowed",
                            }
                      }
                    >
                      {streaming ? "…" : "Send"}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center gap-2 px-1">
                    <span className="text-[11px]" style={{ color: "rgba(17,17,17,0.55)" }}>
                      Enter to send • Shift+Enter for a new line
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: "rgba(17,17,17,0.55)" }}>
                      {streaming ? "Generating…" : "Saved to history"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
