export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";
import { JYNX_TOOLS, TOOL_LABELS } from "@/lib/ai/tools";
import { executeToolCall } from "@/lib/ai/toolHandlers";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model selection strategy:
// - Sonnet: Complex reasoning, file reading, schedule optimization, problem-solving
// - Haiku: Simple CRUD operations, basic queries, most conversational tasks (4x cheaper)
const MODEL_SONNET = "claude-sonnet-4-5-20250929";
const MODEL_HAIKU = "claude-haiku-4-5-20251001";

// Maximum agentic rounds before we stop to avoid infinite loops.
// Higher value needed for bulk operations like semester syllabus parsing.
const MAX_ROUNDS = 10;

/**
 * Determines which model to use based on request complexity.
 * Sonnet for complex reasoning/files, Haiku for simple operations.
 */
function selectModel(content: string, hasAttachments: boolean): string {
  // Always use Sonnet for file attachments (PDFs, images need strong comprehension)
  if (hasAttachments) return MODEL_SONNET;

  const contentLower = content.toLowerCase();

  // Complex reasoning indicators → use Sonnet
  const complexityIndicators = [
    // Problem-solving & reasoning
    "help me figure out",
    "work through",
    "thinking through",
    "struggling with",
    "having trouble",
    "can't decide",
    "not sure how to",
    "what's the best way",
    "how should i",
    "help me understand",
    "explain why",
    "why is",

    // Schedule optimization & conflicts
    "optimize my",
    "reorganize my",
    "adjust my schedule",
    "reschedule everything",
    "fit everything in",
    "too much to do",
    "overwhelmed",
    "behind on",
    "conflict",
    "overlap",
    "prioritize",
    "what should i focus",

    // Planning & strategy
    "plan my",
    "strategy for",
    "approach to",
    "best approach",
    "recommend",
    "suggest how",
    "advice on",
    "guidance on",

    // Analysis & insights
    "analyze my",
    "patterns in",
    "insights about",
    "how am i doing",
    "am i on track",
    "review my",
    "assess my",

    // Complex multi-step requests
    "and then",
    "after that",
    "but also",
    "however",
    "given that",
    "considering",
  ];

  // Check if request contains complexity indicators
  if (complexityIndicators.some((indicator) => contentLower.includes(indicator))) {
    return MODEL_SONNET;
  }

  // Simple CRUD operations → use Haiku
  const simpleOperations = [
    // Direct commands
    "add a",
    "create a",
    "schedule a",
    "delete",
    "remove",
    "cancel",
    "update",
    "change",
    "move to",
    "set to",
    "mark as",
    "complete",

    // Simple queries
    "what's on my",
    "show me my",
    "list my",
    "what do i have",
    "when is",
    "do i have",
  ];

  if (simpleOperations.some((op) => contentLower.includes(op))) {
    return MODEL_HAIKU;
  }

  // Default to Haiku for general conversation and unclear requests
  // This keeps costs low while still handling most cases well
  return MODEL_HAIKU;
}

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/conversations/:id/send
// Body: { content: string, attachments?: Array<{ name, mediaType, data }> }
// Response: NDJSON stream
//   { type: "model_selected", model: "sonnet" | "haiku" }
//   { type: "chunk", text: string }
//   { type: "structured_questions", questions: Array<...> }
//   { type: "tool_start", tool: string, label: string }
//   { type: "tool_done", tool: string, success: boolean }
//   { type: "done", userId: string, userCreatedAt: number, assistantId: string, assistantCreatedAt: number }
//   { type: "error", error: string }
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  const { id } = await ctx.params;
  const conversationId = String(id || "").trim();
  if (!conversationId) return jsonError("Missing conversation id", 400);

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: dbUser.id },
    select: { id: true, title: true },
  });
  if (!convo) return jsonError("Conversation not found", 404);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const content = String(body?.content ?? "").trim();
  if (!content) return jsonError("content is required", 400);

  // Optional file attachments: [{ name, mediaType, data (base64) }]
  const attachments: Array<{ name: string; mediaType: string; data: string }> =
    Array.isArray(body?.attachments) ? body.attachments.slice(0, 5) : [];

  // 1. Save the user message
  const userMsg = await prisma.message.create({
    data: { conversationId, role: "user", content },
    select: { id: true, createdAt: true },
  });

  // Update conversation title if still default
  const shouldSetTitle =
    !convo.title || convo.title.trim() === "" || convo.title === "New chat";
  if (shouldSetTitle) {
    const nextTitle = content.length > 34 ? content.slice(0, 33) + "…" : content;
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: nextTitle },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {},
    });
  }

  // 2. Build system prompt + history (history includes the user message just saved)
  const { systemPrompt, history } = await buildSystemPrompt(
    dbUser.id,
    conversationId
  );

  // 3. Agentic streaming loop
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function emit(obj: object) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      // history already contains the user message we just saved to DB (text only).
      // If there are file attachments, replace the last entry with a rich content
      // block array so Claude can actually read the files.
      let currentMessages: Array<{ role: "user" | "assistant"; content: any }> =
        history as Array<{ role: "user" | "assistant"; content: any }>;

      if (attachments.length > 0) {
        const blocks: any[] = [];
        for (const att of attachments) {
          if (att.mediaType === "application/pdf") {
            blocks.push({
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: att.data },
            });
          } else if (
            att.mediaType === "image/jpeg" ||
            att.mediaType === "image/png" ||
            att.mediaType === "image/gif" ||
            att.mediaType === "image/webp"
          ) {
            blocks.push({
              type: "image",
              source: { type: "base64", media_type: att.mediaType, data: att.data },
            });
          }
        }
        // Text goes last so Claude sees the instruction after reading the documents
        blocks.push({ type: "text", text: content });

        currentMessages = [
          // All prior messages (drop the text-only version of the current message)
          ...(history.slice(0, -1) as Array<{ role: "user" | "assistant"; content: any }>),
          { role: "user" as const, content: blocks },
        ];
      }

      // Accumulate text across all rounds — this is what gets saved to DB
      let accumulatedText = "";

      try {
        // Select model once at the start based on the user's request
        const selectedModel = selectModel(content, attachments.length > 0);

        // Emit model selection for transparency (helpful for debugging)
        emit({
          type: "model_selected",
          model: selectedModel === MODEL_SONNET ? "sonnet" : "haiku",
        });

        for (let round = 0; round < MAX_ROUNDS; round++) {
          const apiStream = anthropic.messages.stream({
            model: selectedModel,
            max_tokens: 8192,
            system: systemPrompt,
            tools: JYNX_TOOLS,
            messages: currentMessages,
          });

          let roundText = "";
          const toolUseBlocks: Array<{
            id: string;
            name: string;
            input: any;
          }> = [];
          let currentTool: {
            id: string;
            name: string;
            inputStr: string;
          } | null = null;
          let stopReason = "";

          for await (const event of apiStream) {
            if (event.type === "content_block_start") {
              if (event.content_block.type === "tool_use") {
                currentTool = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  inputStr: "",
                };
              }
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                roundText += event.delta.text;
                accumulatedText += event.delta.text;
                emit({ type: "chunk", text: event.delta.text });
              } else if (
                event.delta.type === "input_json_delta" &&
                currentTool
              ) {
                currentTool.inputStr += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop") {
              if (currentTool) {
                try {
                  toolUseBlocks.push({
                    id: currentTool.id,
                    name: currentTool.name,
                    input: JSON.parse(currentTool.inputStr || "{}"),
                  });
                } catch {
                  // malformed JSON from model — skip this tool call
                }
                currentTool = null;
              }
            } else if (event.type === "message_delta") {
              stopReason = event.delta.stop_reason ?? "";
            }
          }

          // If the model didn't request tools, we're done
          if (stopReason !== "tool_use" || toolUseBlocks.length === 0) {
            break;
          }

          // Build the assistant's content block (text + tool_use blocks)
          const assistantContent: any[] = [];
          if (roundText) {
            assistantContent.push({ type: "text", text: roundText });
          }
          for (const tb of toolUseBlocks) {
            assistantContent.push({
              type: "tool_use",
              id: tb.id,
              name: tb.name,
              input: tb.input,
            });
          }

          // Execute each tool call and collect results
          const toolResults: any[] = [];
          for (const tb of toolUseBlocks) {
            emit({
              type: "tool_start",
              tool: tb.name,
              label: TOOL_LABELS[tb.name] ?? tb.name,
            });

            const result = await executeToolCall(tb.name, tb.input, dbUser.id);

            // Check if this is a structured questions response
            if (result.success && (result.data as any)?.type === "structured_questions") {
              emit({
                type: "structured_questions",
                questions: (result.data as any).questions,
              });
            }

            emit({ type: "tool_done", tool: tb.name, success: result.success });

            toolResults.push({
              type: "tool_result",
              tool_use_id: tb.id,
              content: JSON.stringify(
                result.success ? result.data : { error: result.error }
              ),
            });
          }

          // Extend messages for the next round
          currentMessages = [
            ...currentMessages,
            { role: "assistant", content: assistantContent },
            { role: "user", content: toolResults },
          ];
        }

        // Save the complete assistant message
        const assistantMsg = await prisma.message.create({
          data: {
            conversationId,
            role: "assistant",
            content: accumulatedText,
          },
          select: { id: true, createdAt: true },
        });

        // Bump conversation updatedAt for sidebar ordering
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {},
        });

        emit({
          type: "done",
          userId: userMsg.id,
          userCreatedAt: userMsg.createdAt.getTime(),
          assistantId: assistantMsg.id,
          assistantCreatedAt: assistantMsg.createdAt.getTime(),
        });
      } catch (err) {
        emit({ type: "error", error: String(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Transfer-Encoding": "chunked",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
