export const runtime = "nodejs";

import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { buildSystemPrompt } from "@/lib/buildSystemPrompt";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Model to use for all chat responses.
// claude-sonnet-4-6 is the latest Sonnet available on this account.
const MODEL = "claude-sonnet-4-5-20250929";

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function* generateResponse(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string
): AsyncGenerator<string> {
  const stream = anthropic.messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [...history, { role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}

// POST /api/conversations/:id/send
// Body: { content: string }
// Response: NDJSON stream
//   { type: "chunk", text: string }
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

  // 2. Build system prompt + history (history now includes the user message above)
  const { systemPrompt, history } = await buildSystemPrompt(
    dbUser.id,
    conversationId
  );

  // 3. Stream the AI response
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let assistantContent = "";

      try {
        for await (const chunk of generateResponse(systemPrompt, history, content)) {
          assistantContent += chunk;
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ type: "chunk", text: chunk }) + "\n"
            )
          );
        }

        // Save complete assistant message
        const assistantMsg = await prisma.message.create({
          data: { conversationId, role: "assistant", content: assistantContent },
          select: { id: true, createdAt: true },
        });

        // Bump conversation updatedAt for sidebar ordering
        await prisma.conversation.update({
          where: { id: conversationId },
          data: {},
        });

        controller.enqueue(
          encoder.encode(
            JSON.stringify({
              type: "done",
              userId: userMsg.id,
              userCreatedAt: userMsg.createdAt.getTime(),
              assistantId: assistantMsg.id,
              assistantCreatedAt: assistantMsg.createdAt.getTime(),
            }) + "\n"
          )
        );
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            JSON.stringify({ type: "error", error: String(err) }) + "\n"
          )
        );
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
