export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// GET /api/conversations/:id -> fetch one conversation + messages
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
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
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });
  if (!convo) return jsonError("Conversation not found", 404);

  return NextResponse.json({
    ok: true,
    conversation: {
      id: convo.id,
      title: convo.title || "New chat",
      createdAt: convo.createdAt.getTime(),
      updatedAt: convo.updatedAt.getTime(),
    },
    messages: convo.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt.getTime(),
    })),
  });
}

// POST /api/conversations/:id -> add a message
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
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
    select: { id: true },
  });
  if (!convo) return jsonError("Conversation not found", 404);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const role = String(body?.role ?? "").trim();
  const content = String(body?.content ?? "").trim();

  if (role !== "user" && role !== "assistant") {
    return jsonError("Invalid role", 400);
  }
  if (!content) return jsonError("Message content is required", 400);

  const msg = await prisma.message.create({
    data: {
      conversationId,
      role,
      content,
    },
    select: { id: true, role: true, content: true, createdAt: true },
  });

  // Optional: keep title updated when first user message comes in
  // If convo title is null or "New chat", set it to a short preview
  if (role === "user") {
    const existingTitle = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { title: true },
    });

    const shouldSetTitle =
      !existingTitle?.title || existingTitle.title.trim() === "" || existingTitle.title === "New chat";

    if (shouldSetTitle) {
      const nextTitle = content.length > 34 ? content.slice(0, 33) + "…" : content;
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title: nextTitle },
      });
    } else {
      // bump updatedAt for ordering
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {},
      });
    }
  } else {
    // bump updatedAt for assistant messages too
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {},
    });
  }

  return NextResponse.json(
    {
      ok: true,
      message: {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.getTime(),
      },
    },
    { status: 201 }
  );
}

// DELETE /api/conversations/:id -> delete conversation + cascaded messages
export async function DELETE(
  _req: Request,
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

  const existing = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: dbUser.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Conversation not found", 404);

  await prisma.conversation.delete({
    where: { id: conversationId },
  });

  return NextResponse.json({ ok: true });
}
