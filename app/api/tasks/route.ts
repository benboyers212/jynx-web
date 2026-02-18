export const runtime = "nodejs";

import { NextResponse } from "next/server";
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

const VALID_TYPES = ["task", "assignment", "goal"] as const;
const VALID_PRIORITIES = ["low", "medium", "high"] as const;

// GET /api/tasks
// Query params: taskType, eventId, classHubId, groupId, completed
export async function GET(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const taskType = searchParams.get("taskType");
  const eventId = searchParams.get("eventId");
  const classHubId = searchParams.get("classHubId");
  const groupId = searchParams.get("groupId");
  const completedParam = searchParams.get("completed");

  const where: any = { userId: dbUserId };
  if (taskType) where.taskType = taskType;
  if (eventId) where.eventId = eventId;
  if (classHubId) where.classHubId = classHubId;
  if (groupId) where.groupId = groupId;
  if (completedParam !== null) where.completed = completedParam === "true";

  const tasks = await prisma.task.findMany({
    where,
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "asc" },
    ],
    include: {
      event: { select: { id: true, title: true, eventType: true, startAt: true } },
      classHub: { select: { id: true, name: true, courseCode: true } },
      group: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: tasks });
}

// POST /api/tasks
export async function POST(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const title = String(body?.title || "").trim();
  if (!title) return NextResponse.json({ success: false, error: "Title is required" }, { status: 400 });

  const taskType = VALID_TYPES.includes(body?.taskType) ? String(body.taskType) : "task";
  const priority = VALID_PRIORITIES.includes(body?.priority) ? String(body.priority) : null;

  // Validate context references are owned by this user
  if (body?.eventId) {
    const event = await prisma.scheduleBlock.findFirst({ where: { id: body.eventId, userId: dbUserId } });
    if (!event) return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
  }
  if (body?.classHubId) {
    const hub = await prisma.classHub.findFirst({ where: { id: body.classHubId, userId: dbUserId } });
    if (!hub) return NextResponse.json({ success: false, error: "ClassHub not found" }, { status: 404 });
  }

  const task = await prisma.task.create({
    data: {
      userId: dbUserId,
      title,
      taskType,
      description: body?.description ? String(body.description) : null,
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      points: body?.points != null ? Number(body.points) : null,
      priority,
      eventId: body?.eventId || null,
      classHubId: body?.classHubId || null,
      groupId: body?.groupId || null,
    },
    include: {
      event: { select: { id: true, title: true, eventType: true } },
      classHub: { select: { id: true, name: true, courseCode: true } },
    },
  });

  return NextResponse.json({ success: true, data: task }, { status: 201 });
}
