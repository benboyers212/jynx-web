export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
  return user?.id ?? null;
}

type Ctx = { params: Promise<{ id: string }> };

// POST /api/groups/[id]/members — add member (owner/admin only)
export async function POST(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await ctx.params;

  const requesterMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: dbUserId } },
    select: { role: true },
  });
  if (!requesterMembership) return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
  if (!["owner", "admin"].includes(requesterMembership.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const targetUserId = String(body?.userId || "").trim();
  if (!targetUserId) return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

  const member = await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId, userId: targetUserId } },
    create: { groupId, userId: targetUserId, role: body?.role || "member" },
    update: { role: body?.role || "member" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ success: true, data: member }, { status: 201 });
}

// DELETE /api/groups/[id]/members — leave group (or owner removes member)
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id: groupId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  // If targetUserId is provided, caller is removing someone else (must be owner/admin)
  const targetUserId = body?.userId || dbUserId;

  if (targetUserId !== dbUserId) {
    const requesterMembership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId: dbUserId } },
      select: { role: true },
    });
    if (!requesterMembership || !["owner", "admin"].includes(requesterMembership.role)) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }
  }

  await prisma.groupMember.deleteMany({
    where: { groupId, userId: targetUserId },
  });

  return NextResponse.json({ success: true });
}
