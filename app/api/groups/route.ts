export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
  return user?.id ?? null;
}

const VALID_GROUP_TYPES = ["class", "project", "social", "general"] as const;

// GET /api/groups — groups the user belongs to
export async function GET() {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const memberships = await prisma.groupMember.findMany({
    where: { userId: dbUserId },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          tasks: { where: { completed: false }, orderBy: { dueDate: "asc" }, take: 5 },
          files: { orderBy: { createdAt: "desc" }, take: 5 },
          notes: { orderBy: { updatedAt: "desc" }, take: 3 },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const groups = memberships.map((m) => ({
    ...m.group,
    memberRole: m.role,
    joinedAt: m.joinedAt,
  }));

  return NextResponse.json({ success: true, data: groups });
}

// POST /api/groups — create group + auto-add creator as owner
export async function POST(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const name = String(body?.name || "").trim();
  if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

  const type = VALID_GROUP_TYPES.includes(body?.type) ? String(body.type) : "general";

  const group = await prisma.group.create({
    data: {
      name,
      type,
      description: body?.description ? String(body.description) : null,
      members: {
        create: { userId: dbUserId, role: "owner" },
      },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json({ success: true, data: group }, { status: 201 });
}
