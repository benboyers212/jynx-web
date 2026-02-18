import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const VALID_EVENT_TYPES = [
  "class", "work", "health", "meeting", "prep", "study", "life", "free",
] as const;

async function resolveUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
}

// GET /api/events
// Query params: startAt, endAt, eventType
export async function GET(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const startAt = searchParams.get("startAt");
  const endAt = searchParams.get("endAt");
  const eventType = searchParams.get("eventType");

  const where: any = { userId: user.id };
  if (startAt || endAt) {
    where.startAt = {};
    if (startAt) where.startAt.gte = new Date(startAt);
    if (endAt) where.startAt.lte = new Date(endAt);
  }
  if (eventType) where.eventType = eventType;

  const events = await prisma.scheduleBlock.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: {
      notes: { orderBy: { createdAt: "desc" }, take: 5 },
      tasks: { where: { taskType: "assignment" }, orderBy: { dueDate: "asc" } },
      workoutLogs: { orderBy: { createdAt: "desc" }, take: 3 },
      files: { orderBy: { createdAt: "desc" } },
      classHub: { select: { id: true, name: true, courseCode: true } },
      workoutHub: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: events });
}

// POST /api/events
export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const title = String(body?.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  if (!body?.startAt || !body?.endAt) {
    return NextResponse.json({ error: "startAt and endAt are required" }, { status: 400 });
  }

  const eventType = VALID_EVENT_TYPES.includes(body?.eventType)
    ? String(body.eventType)
    : "work";

  const event = await prisma.scheduleBlock.create({
    data: {
      userId: user.id,
      title,
      eventType,
      category: eventType, // keep in sync for backward compat
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      location: body?.location ? String(body.location) : null,
      description: body?.description ? String(body.description) : null,
      classHubId: body?.classHubId || null,
      workoutHubId: body?.workoutHubId || null,
    },
  });

  return NextResponse.json({ success: true, data: event }, { status: 201 });
}
