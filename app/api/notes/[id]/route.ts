export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

async function getDbUserIdOrCreate() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { clerkUserId: userId },
    select: { id: true },
  });

  return created.id;
}

type Ctx = { params: Promise<{ id: string }> };

// GET /api/notes/[id] - Get a specific note
export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const note = await prisma.note.findFirst({
    where: { id, userId: dbUserId },
    include: {
      fileRepresentation: true,
      event: {
        select: { id: true, title: true, category: true }
      },
      group: {
        select: { id: true, name: true }
      }
    }
  });

  if (!note) {
    return NextResponse.json(
      { success: false, error: "Note not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: note });
}

// PATCH /api/notes/[id] - Update a note
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const existing = await prisma.note.findFirst({
    where: { id, userId: dbUserId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Note not found" },
      { status: 404 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body.content !== undefined) data.content = String(body.content);
  if (body.title !== undefined) data.title = body.title === null ? null : String(body.title);

  const note = await prisma.note.update({
    where: { id },
    data,
    include: {
      fileRepresentation: true
    }
  });

  return NextResponse.json({ success: true, data: note });
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;

  const existing = await prisma.note.findFirst({
    where: { id, userId: dbUserId },
    select: { id: true, fileRepresentation: { select: { id: true } } },
  });

  if (!existing) {
    return NextResponse.json(
      { success: false, error: "Note not found" },
      { status: 404 }
    );
  }

  // Delete the note (File will cascade delete due to onDelete: Cascade)
  await prisma.note.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
