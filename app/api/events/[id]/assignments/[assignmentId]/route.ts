import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function resolveUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
}

type Ctx = { params: Promise<{ id: string; assignmentId: string }> };

// PATCH /api/events/[id]/assignments/[assignmentId]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { assignmentId } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.task.findFirst({
    where: { id: assignmentId, userId: user.id, taskType: "assignment" },
  });
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  // Whitelist only safe fields
  const data: any = {};
  if (body.title !== undefined) data.title = String(body.title);
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.completed !== undefined) data.completed = Boolean(body.completed);
  if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;
  if (body.points !== undefined) data.points = body.points != null ? Number(body.points) : null;
  if (body.priority !== undefined) data.priority = body.priority ?? null;

  const updated = await prisma.task.update({ where: { id: assignmentId }, data });

  return NextResponse.json(updated);
}

// DELETE /api/events/[id]/assignments/[assignmentId]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { assignmentId } = await ctx.params;

  const existing = await prisma.task.findFirst({
    where: { id: assignmentId, userId: user.id, taskType: "assignment" },
  });
  if (!existing) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

  await prisma.task.delete({ where: { id: assignmentId } });

  return NextResponse.json({ success: true });
}
