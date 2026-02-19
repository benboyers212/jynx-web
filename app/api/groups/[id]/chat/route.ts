export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true, name: true },
  });
}

type Ctx = { params: Promise<{ id: string }> };

// GET /api/groups/[id]/chat — load (or init) the group conversation + messages
export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUser = await getDbUser();
  if (!dbUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await ctx.params;

  // Verify user is a member
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: dbUser.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ success: false, error: "Not a member" }, { status: 403 });

  // Find or create a group conversation (one per group, shared by all members)
  let convo = await prisma.conversation.findFirst({
    where: { groupId, conversationType: "group" },
    select: { id: true },
  });

  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        userId: dbUser.id,
        groupId,
        conversationType: "group",
        title: "Group chat",
      },
      select: { id: true },
    });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: convo.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true, senderName: true, createdAt: true },
  });

  return NextResponse.json({
    success: true,
    data: {
      conversationId: convo.id,
      messages: messages.map((m) => ({
        id: m.id,
        who: m.senderName ?? "Member",
        text: m.content,
        ts: m.createdAt.toISOString(),
      })),
    },
  });
}

// POST /api/groups/[id]/chat — send a message to the group chat
export async function POST(req: NextRequest, ctx: Ctx) {
  const dbUser = await getDbUser();
  if (!dbUser) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await ctx.params;

  // Verify user is a member
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: dbUser.id } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ success: false, error: "Not a member" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const content = String(body?.content ?? "").trim();
  if (!content) return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });

  // Find or create the group conversation
  let convo = await prisma.conversation.findFirst({
    where: { groupId, conversationType: "group" },
    select: { id: true },
  });

  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        userId: dbUser.id,
        groupId,
        conversationType: "group",
        title: "Group chat",
      },
      select: { id: true },
    });
  }

  const msg = await prisma.message.create({
    data: {
      conversationId: convo.id,
      role: "user",
      content,
      senderName: dbUser.name ?? "You",
    },
    select: { id: true, content: true, senderName: true, createdAt: true },
  });

  // Bump conversation updatedAt
  await prisma.conversation.update({ where: { id: convo.id }, data: {} });

  return NextResponse.json({
    success: true,
    data: {
      id: msg.id,
      who: msg.senderName ?? "You",
      text: msg.content,
      ts: msg.createdAt.toISOString(),
    },
  }, { status: 201 });
}
