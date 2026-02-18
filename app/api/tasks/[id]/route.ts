export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  return user?.id ?? null;
}

type Ctx = { params: Promise<{ id: string }> };

// GET /api/tasks/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const task = await prisma.task.findFirst({
    where: { id, userId: dbUserId },
    include: {
      event: { select: { id: true, title: true, eventType: true, startAt: true } },
      classHub: { select: { id: true, name: true, courseCode: true } },
      group: { select: { id: true, name: true } },
    },
  });

  if (!task) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: task });
}

// PATCH /api/tasks/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.task.findFirst({ where: { id, userId: dbUserId } });
  if (!existing) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

  // Whitelist safe fields
  const data: any = {};
  if (body.title !== undefined) data.title = String(body.title);
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.completed !== undefined) data.completed = Boolean(body.completed);
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.points !== undefined) data.points = body.points != null ? Number(body.points) : null;
  if (body.priority !== undefined) data.priority = body.priority ?? null;
  if (body.taskType !== undefined) data.taskType = String(body.taskType);

  const task = await prisma.task.update({
    where: { id },
    data,
    include: {
      event: { select: { id: true, title: true, eventType: true } },
      classHub: { select: { id: true, name: true, courseCode: true } },
    },
  });

  return NextResponse.json({ success: true, data: task });
}

// DELETE /api/tasks/[id]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.task.findFirst({ where: { id, userId: dbUserId } });
  if (!existing) return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });

  await prisma.task.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
