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

// GET /api/files/[id]
export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const file = await prisma.file.findFirst({
    where: { id, userId: dbUserId },
    include: {
      noteContent: { select: { id: true, title: true, content: true, updatedAt: true } },
      event: { select: { id: true, title: true, eventType: true } },
      classHub: { select: { id: true, name: true, courseCode: true } },
      group: { select: { id: true, name: true } },
    },
  });

  if (!file) return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });

  return NextResponse.json({ success: true, data: file });
}

// PATCH /api/files/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const existing = await prisma.file.findFirst({ where: { id, userId: dbUserId } });
  if (!existing) return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });

  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name);
  if (body.url !== undefined) data.url = body.url ?? null;
  if (body.pinned !== undefined) data.pinned = Boolean(body.pinned);
  if (body.category !== undefined) data.category = body.category ?? null;
  if (body.notes !== undefined) data.notes = body.notes ?? null;
  if ("groupId" in body) data.groupId = body.groupId ?? null;

  const file = await prisma.file.update({ where: { id }, data });

  return NextResponse.json({ success: true, data: file });
}

// DELETE /api/files/[id]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.file.findFirst({ where: { id, userId: dbUserId } });
  if (!existing) return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });

  await prisma.file.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
