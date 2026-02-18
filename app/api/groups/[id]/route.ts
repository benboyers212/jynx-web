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

async function requireMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });
}

// GET /api/groups/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const membership = await requireMembership(id, dbUserId);
  if (!membership) return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        orderBy: [{ completed: "asc" }, { dueDate: "asc" }],
      },
      notes: {
        orderBy: { updatedAt: "desc" },
        include: {
          fileRepresentation: { select: { id: true, name: true } },
        },
      },
      files: {
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: {
          noteContent: { select: { id: true, title: true, content: true } },
        },
      },
      conversations: {
        where: { conversationType: "group" },
        orderBy: { updatedAt: "desc" },
        take: 1,
        include: {
          messages: { orderBy: { createdAt: "asc" }, take: 50 },
        },
      },
    },
  });

  return NextResponse.json({ success: true, data: { ...group, memberRole: membership.role } });
}

// PATCH /api/groups/[id] — owner/admin only
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const membership = await requireMembership(id, dbUserId);
  if (!membership) return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
  if (!["owner", "admin"].includes(membership.role)) {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name);
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.type !== undefined) data.type = String(body.type);

  const group = await prisma.group.update({ where: { id }, data });

  return NextResponse.json({ success: true, data: group });
}

// DELETE /api/groups/[id] — owner only
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const membership = await requireMembership(id, dbUserId);
  if (!membership) return NextResponse.json({ success: false, error: "Group not found" }, { status: 404 });
  if (membership.role !== "owner") {
    return NextResponse.json({ success: false, error: "Only the owner can delete this group" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
