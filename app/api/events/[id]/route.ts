import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const VALID_EVENT_TYPES = [
  "class", "work", "health", "meeting", "prep", "study", "life", "free",
] as const;

async function resolveUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
}

type Ctx = { params: Promise<{ id: string }> };

// GET /api/events/[id]
// Returns full event bundle for the event modal
export async function GET(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await ctx.params;

  const event = await prisma.scheduleBlock.findFirst({
    where: { id, userId: user.id },
    include: {
      // canonical notes
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          fileRepresentation: { select: { id: true, name: true, type: true } },
        },
      },
      // all tasks for this event
      tasks: {
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      },
      // workout logs
      workoutLogs: { orderBy: { createdAt: "desc" } },
      // files (includes note-type files)
      files: {
        orderBy: { createdAt: "desc" },
        include: {
          noteContent: { select: { id: true, content: true, title: true } },
        },
      },
      // hub references
      classHub: {
        select: {
          id: true, name: true, courseCode: true, instructor: true, semester: true,
        },
      },
      workoutHub: { select: { id: true, name: true, description: true } },
    },
  });

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Shape response: surface tasks typed as "assignment" separately for the UI
  const { tasks, ...rest } = event;
  const assignments = tasks.filter((t) => t.taskType === "assignment");
  const otherTasks = tasks.filter((t) => t.taskType !== "assignment");

  return NextResponse.json({
    ...rest,
    assignments,
    tasks: otherTasks,
  });
}

// PATCH /api/events/[id]
export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  const event = await prisma.scheduleBlock.findFirst({ where: { id, userId: user.id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  // Whitelist safe fields only
  const data: any = {};
  if (body.title !== undefined) data.title = String(body.title);
  if (body.location !== undefined) data.location = body.location ?? null;
  if (body.description !== undefined) data.description = body.description ?? null;
  if (body.startAt !== undefined) data.startAt = new Date(body.startAt);
  if (body.endAt !== undefined) data.endAt = new Date(body.endAt);
  if (body.classHubId !== undefined) data.classHubId = body.classHubId ?? null;
  if (body.workoutHubId !== undefined) data.workoutHubId = body.workoutHubId ?? null;
  if (body.eventType !== undefined && VALID_EVENT_TYPES.includes(body.eventType)) {
    data.eventType = String(body.eventType);
    data.category = data.eventType; // keep in sync
  }

  const updated = await prisma.scheduleBlock.update({ where: { id }, data });

  return NextResponse.json({ success: true, data: updated });
}

// DELETE /api/events/[id]
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await resolveUser(clerkUserId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await ctx.params;

  const event = await prisma.scheduleBlock.findFirst({ where: { id, userId: user.id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  await prisma.scheduleBlock.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
