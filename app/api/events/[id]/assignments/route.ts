import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function resolveUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
}

// GET /api/events/[id]/assignments
// Returns all tasks of type "assignment" for this event
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;

  const tasks = await prisma.task.findMany({
    where: { eventId: id, userId: user.id, taskType: "assignment" },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(tasks);
}

// POST /api/events/[id]/assignments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const title = String(body?.title || "").trim();
  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  // Verify event ownership
  const event = await prisma.scheduleBlock.findFirst({ where: { id, userId: user.id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      userId: user.id,
      eventId: id,
      taskType: "assignment",
      title,
      description: body?.description ? String(body.description) : null,
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      points: body?.points ? Number(body.points) : null,
      priority: body?.priority ? String(body.priority) : null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
