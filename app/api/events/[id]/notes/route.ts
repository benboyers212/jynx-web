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
  const { content, title, classHubId: providedClassHubId, skipMatching } = body;

  // Verify event exists and belongs to user
  const event = await prisma.scheduleBlock.findFirst({
    where: { id, userId: user.id },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Determine which ClassHub to link to (if applicable for class events)
  let classHubId: string | null = null;

  if (event.eventType === "class") {
    if (providedClassHubId) {
      // Frontend explicitly provided a classHubId after disambiguation
      classHubId = providedClassHubId;
    } else if (event.classHubId) {
      // Event already linked to a ClassHub
      classHubId = event.classHubId;
    } else if (!skipMatching) {
      // Need to find or create a matching ClassHub
      const { findMatchingEvents } = await import("@/lib/ai/eventMatching");
      const matchResult = await findMatchingEvents(
        user.id,
        event.title,
        "class",
        event.startAt,
        event.location || undefined
      );

      if (matchResult.needsDisambiguation) {
        // Return disambiguation info for frontend to handle
        return NextResponse.json({
          needsDisambiguation: true,
          matches: matchResult.matches,
          suggestedMatch: matchResult.suggestedMatch,
        }, { status: 200 });
      } else if (matchResult.suggestedMatch?.type === "classHub") {
        classHubId = matchResult.suggestedMatch.id;

        // Also update the event to link to this hub
        await prisma.scheduleBlock.update({
          where: { id },
          data: { classHubId },
        });
      } else {
        // No matches found, create a new ClassHub
        const newHub = await prisma.classHub.create({
          data: {
            userId: user.id,
            name: event.title,
          },
        });
        classHubId = newHub.id;

        // Link event to new hub
        await prisma.scheduleBlock.update({
          where: { id },
          data: { classHubId: newHub.id },
        });
      }
    }
  }

  // Create canonical Note linked to both event and classHub (if applicable)
  const note = await prisma.note.create({
    data: {
      eventId: id,
      userId: user.id,
      content,
      title: title || `Note - ${event.title}`,
      ...(classHubId && { classHubId }),
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
      ...(classHubId && { classHubId }),
    },
  });

  return NextResponse.json({ ...note, fileRepresentation: file }, { status: 201 });
}
