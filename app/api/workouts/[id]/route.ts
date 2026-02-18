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

// GET /api/workouts/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const hub = await prisma.workoutHub.findFirst({
    where: { id, userId: dbUserId },
    include: {
      workoutLogs: { orderBy: { createdAt: "desc" } },
      notes: { orderBy: { updatedAt: "desc" } },
      files: { orderBy: { createdAt: "desc" } },
      events: { orderBy: { startAt: "asc" } },
    },
  });

  if (!hub) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: hub });
}

// PATCH /api/workouts/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.workoutHub.findFirst({ where: { id, userId: dbUserId } });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name);
  if (body.description !== undefined) data.description = body.description ?? null;

  const updated = await prisma.workoutHub.update({ where: { id }, data });

  return NextResponse.json({ success: true, data: updated });
}

// DELETE /api/workouts/[id]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.workoutHub.findFirst({ where: { id, userId: dbUserId } });
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

  await prisma.workoutHub.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
