export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// GET /api/conversations -> list conversations for logged-in user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  const conversations = await prisma.conversation.findMany({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { content: true, role: true, createdAt: true },
      },
    },
  });

  const threads = conversations.map((c) => ({
    id: c.id,
    title: c.title || "New chat",
    createdAt: c.createdAt.getTime(),
    updatedAt: c.updatedAt.getTime(),
    lastMessagePreview: c.messages[0]?.content ? String(c.messages[0].content) : "",
  }));

  return NextResponse.json({ ok: true, threads });
}

// POST /api/conversations -> create a new conversation
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const title =
    body?.title != null ? String(body.title).trim().slice(0, 120) : null;

  const convo = await prisma.conversation.create({
    data: {
      userId: dbUser.id,
      title: title || null,
    },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json(
    {
      ok: true,
      conversation: {
        id: convo.id,
        title: convo.title || "New chat",
        createdAt: convo.createdAt.getTime(),
        updatedAt: convo.updatedAt.getTime(),
        lastMessagePreview: "",
      },
    },
    { status: 201 }
  );
}
