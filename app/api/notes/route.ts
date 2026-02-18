export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

// GET /api/notes - List all user's notes (optionally filtered)
export async function GET(req: Request) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const groupId = searchParams.get("groupId");

  const where: any = { userId: dbUserId };
  if (eventId) where.eventId = eventId;
  if (groupId) where.groupId = groupId;

  const notes = await prisma.note.findMany({
    where,
    include: {
      fileRepresentation: {
        select: { id: true, name: true, type: true, createdAt: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: notes });
}

// POST /api/notes - Create a new note
export async function POST(req: Request) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const content = String(body?.content || "").trim();
  if (!content) {
    return NextResponse.json(
      { success: false, error: "Content is required" },
      { status: 400 }
    );
  }

  // Create note
  const note = await prisma.note.create({
    data: {
      userId: dbUserId,
      content,
      title: body?.title ? String(body.title) : null,
      eventId: body?.eventId || null,
      groupId: body?.groupId || null,
    },
  });

  // Auto-create File entry for this note
  const event = body?.eventId
    ? await prisma.scheduleBlock.findUnique({
        where: { id: body.eventId },
        select: { category: true, title: true }
      })
    : null;

  const file = await prisma.file.create({
    data: {
      userId: dbUserId,
      noteId: note.id,
      eventId: body?.eventId || null,
      groupId: body?.groupId || null,
      name: body?.title || `Note - ${new Date().toLocaleDateString()}`,
      type: "note",
      category: event?.category
        ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
        : null,
    },
  });

  return NextResponse.json({
    success: true,
    data: { ...note, fileRepresentation: file }
  }, { status: 201 });
}
