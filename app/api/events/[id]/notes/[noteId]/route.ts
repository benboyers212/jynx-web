import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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

  const { noteId } = await params;
  const body = await req.json();
  const { content, title } = body;

  // Use canonical Note model
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const data: any = {};
  if (content !== undefined) data.content = content;
  if (title !== undefined) data.title = title;

  const updated = await prisma.note.update({
    where: { id: noteId },
    data,
    include: {
      fileRepresentation: {
        select: { id: true, name: true, type: true }
      }
    }
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
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

  const { noteId } = await params;

  // Use canonical Note model
  const note = await prisma.note.findFirst({
    where: { id: noteId, userId: user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Delete note (File will cascade delete due to onDelete: Cascade)
  await prisma.note.delete({
    where: { id: noteId },
  });

  return NextResponse.json({ success: true });
}
