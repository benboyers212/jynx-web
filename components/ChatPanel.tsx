"use client";

import { useEffect, useRef, useState } from "react";
import { useChatPanel } from "@/contexts/ChatPanelContext";
import { StructuredQuestions, type StructuredQuestion } from "./StructuredQuestions";

const OLIVE = "#4b5e3c";
const MAX_CHARS = 200;

type Role = "user" | "assistant";

type Message = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  isStreaming?: boolean;
  actionLabel?: string;
  structuredQuestions?: StructuredQuestion[];
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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

export function ChatPanel() {
  const { isOpen, initialMessage, closePanel } = useChatPanel();
  const [mounted, setMounted] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldAutoSend, setShouldAutoSend] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  // Autosize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 120);
    el.style.height = next + "px";
  }, [input]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Create a new conversation when panel opens
  useEffect(() => {
    if (isOpen && !conversationId) {
      async function create() {
        try {
          const data = await apiPost<{ ok: true; conversation: { id: string } }>(
            "/api/conversations",
            { title: null }
          );
          setConversationId(data.conversation.id);

          // If there's an initial message, set it and mark for auto-send
          if (initialMessage) {
            setInput(initialMessage);
            setShouldAutoSend(true);
          }
        } catch (e: any) {
          setError(e?.message || "Failed to create conversation");
        }
      }
      create();
    }
  }, [isOpen, conversationId, initialMessage]);

  // Auto-send initial message once conversation is created
  useEffect(() => {
    if (shouldAutoSend && conversationId && input && !streaming) {
      setShouldAutoSend(false);
      onSend();
    }
  }, [shouldAutoSend, conversationId, input, streaming]);

  async function onSend() {
    const text = input.trim();
    if (!text || streaming || !conversationId) return;

    setError(null);

    const tempUserId = `temp_${uid()}`;
    const tempAssistantId = `streaming_${uid()}`;

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      { id: tempUserId, role: "user", content: text, createdAt: Date.now() },
      { id: tempAssistantId, role: "assistant", content: "", createdAt: Date.now(), isStreaming: true },
    ]);

    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
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

          if (event.type === "model_selected") {
            // Log model selection for debugging
            console.log(`[Jynx AI] Using ${event.model === "sonnet" ? "Sonnet (complex reasoning)" : "Haiku (fast & efficient)"}`);
          } else if (event.type === "chunk") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, content: m.content + event.text, actionLabel: undefined }
                  : m
              )
            );
          } else if (event.type === "structured_questions") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAssistantId
                  ? { ...m, structuredQuestions: event.questions }
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
            // Notify other pages to refresh
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
          } else if (event.type === "error") {
            throw new Error(event.error);
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || "Failed to get response");
      setMessages((prev) => prev.filter((m) => m.id !== tempAssistantId));
    } finally {
      setStreaming(false);
    }
  }

  async function onAnswerStructuredQuestions(messageId: string, answers: Record<string, string>) {
    // Format answers as a message
    const answerText = Object.entries(answers)
      .map(([id, value]) => {
        const question = messages
          .find((m) => m.id === messageId)
          ?.structuredQuestions?.find((q) => q.id === id);
        return `${question?.question}: ${value}`;
      })
      .join("\n");

    // Remove structured questions from the message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, structuredQuestions: undefined } : m
      )
    );

    // Set input and send
    setInput(answerText);
    setTimeout(() => onSend(), 100);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  function handleClose() {
    // Reset state when closing
    setConversationId("");
    setMessages([]);
    setInput("");
    setError(null);
    closePanel();
  }

  const charCount = input.length;
  const isOverLimit = charCount > MAX_CHARS;

  const border = "rgba(0,0,0,0.10)";
  const borderStrong = "rgba(0,0,0,0.14)";
  const surface = "var(--surface)";
  const bg = "var(--background)";
  const fg = "var(--foreground)";
  const muted = "var(--muted-foreground)";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 transition-opacity z-[60] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-[480px] shadow-2xl z-[70] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: bg, color: fg }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className="shrink-0 border-b px-6 py-4 flex items-center justify-between"
            style={{ borderColor: border, background: surface }}
          >
            <div>
              <div className="text-sm font-semibold">AI Assistant</div>
              <div className="text-xs mt-0.5" style={{ color: muted }}>
                Quick chat
              </div>
            </div>
            <button
              onClick={handleClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center transition hover:bg-black/[0.06]"
              style={{ color: muted }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
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

            {messages.length === 0 ? (
              <div
                className="rounded-3xl border px-4 py-4"
                style={{
                  borderColor: border,
                  background: "rgba(255,255,255,0.70)",
                }}
              >
                <div className="text-sm font-semibold mb-2">Start a conversation</div>
                <div className="text-sm" style={{ color: muted }}>
                  Ask about your schedule, priorities, or what to focus on next.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className="max-w-[85%] rounded-3xl px-4 py-3 border"
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

                    {m.structuredQuestions && m.structuredQuestions.length > 0 && (
                      <div className="mt-3">
                        <StructuredQuestions
                          questions={m.structuredQuestions}
                          onSubmit={(answers) => onAnswerStructuredQuestions(m.id, answers)}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Composer */}
          <div
            className="shrink-0 border-t px-6 py-4"
            style={{ borderColor: border, background: surface }}
          >
            <div
              className="rounded-3xl border px-4 py-3"
              style={{
                borderColor: border,
                background: "rgba(255,255,255,0.80)",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_CHARS) {
                    setInput(e.target.value);
                  }
                }}
                onKeyDown={onKeyDown}
                placeholder="Ask me anything…"
                rows={1}
                maxLength={MAX_CHARS}
                className="w-full resize-none bg-transparent outline-none text-sm leading-relaxed"
                style={{
                  height: 0,
                  color: "rgba(17,17,17,0.92)",
                }}
              />

              <div className="mt-2 flex items-center gap-2">
                <span
                  className="text-[11px]"
                  style={{ color: isOverLimit ? "rgba(239,68,68,0.85)" : muted }}
                >
                  {charCount}/{MAX_CHARS}
                </span>
                <span className="ml-auto text-[11px]" style={{ color: muted }}>
                  Enter to send
                </span>
                <button
                  onClick={onSend}
                  disabled={!input.trim() || streaming || isOverLimit}
                  className="rounded-2xl px-4 py-1.5 text-xs font-semibold transition border"
                  style={
                    input.trim() && !streaming && !isOverLimit
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
