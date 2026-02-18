import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;

  // Use canonical Note model instead of EventNote
  const notes = await prisma.note.findMany({
    where: { eventId: id, userId: user.id },
    include: {
      fileRepresentation: {
        select: { id: true, name: true, type: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { id } = await params;
  const body = await req.json();
  const { content, title } = body;

  // Verify event exists and belongs to user
  const event = await prisma.scheduleBlock.findFirst({
    where: { id, userId: user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Create canonical Note
  const note = await prisma.note.create({
    data: {
      eventId: id,
      userId: user.id,
      content,
      title: title || `Note - ${event.title}`,
    },
  });

  // Create File entry linked to this Note
  const file = await prisma.file.create({
    data: {
      userId: user.id,
      eventId: id,
      noteId: note.id,  // Link to Note
      name: title || `Note - ${new Date().toLocaleDateString()}`,
      type: "note",
      category: event.category.charAt(0).toUpperCase() + event.category.slice(1),
    },
  });

  return NextResponse.json({ ...note, fileRepresentation: file }, { status: 201 });
}
