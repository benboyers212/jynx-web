export const runtime = "nodejs";

/**
 * GET /api/ai/context
 *
 * Returns a full, structured context bundle for the authenticated user.
 * This is the canonical data source for any AI feature that needs to
 * understand and reason about what is happening in the user's life.
 *
 * Shape:
 * {
 *   user: { id, name, email, onboardingCompleted },
 *   onboarding: { answers } | null,
 *   upcomingEvents: ScheduleBlock[],   // next 14 days
 *   recentEvents: ScheduleBlock[],     // past 7 days
 *   openTasks: Task[],                 // incomplete, sorted by dueDate
 *   recentNotes: Note[],               // last 20 notes
 *   recentFiles: File[],               // last 20 files (non-note)
 *   classHubs: ClassHub[],             // with latest tasks + notes
 *   workoutHubs: WorkoutHub[],         // with latest logs
 *   recentConversations: Conversation[], // last 5, with last 10 messages each
 *   medications: Medication[],
 *   reminders: Reminder[],
 *   groups: Group[],                   // user's groups with recent activity
 * }
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    select: { id: true, name: true, email: true, onboardingCompleted: true },
  });

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
  }

  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const past7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Run all queries in parallel
  const [
    onboarding,
    upcomingEvents,
    recentEvents,
    openTasks,
    recentNotes,
    recentFiles,
    classHubs,
    workoutHubs,
    recentConversations,
    medications,
    reminders,
    groupMemberships,
  ] = await Promise.all([
    // Onboarding answers
    prisma.onboardingResponse.findUnique({
      where: { userId: user.id },
      select: { answers: true, updatedAt: true },
    }),

    // Upcoming events (next 14 days)
    prisma.scheduleBlock.findMany({
      where: {
        userId: user.id,
        startAt: { gte: now, lte: in14Days },
      },
      orderBy: { startAt: "asc" },
      include: {
        notes: { orderBy: { createdAt: "desc" }, take: 3 },
        tasks: {
          where: { completed: false },
          orderBy: { dueDate: "asc" },
          take: 10,
        },
        workoutLogs: { orderBy: { createdAt: "desc" }, take: 2 },
        files: { orderBy: { createdAt: "desc" }, take: 5 },
        classHub: { select: { id: true, name: true, courseCode: true } },
        workoutHub: { select: { id: true, name: true } },
      },
    }),

    // Recent events (past 7 days)
    prisma.scheduleBlock.findMany({
      where: {
        userId: user.id,
        startAt: { gte: past7Days, lt: now },
      },
      orderBy: { startAt: "desc" },
      include: {
        notes: { orderBy: { createdAt: "desc" }, take: 2 },
        tasks: { orderBy: { dueDate: "asc" }, take: 5 },
        workoutLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),

    // All open tasks (not completed)
    prisma.task.findMany({
      where: { userId: user.id, completed: false },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 50,
      include: {
        event: { select: { id: true, title: true, eventType: true, startAt: true } },
        classHub: { select: { id: true, name: true, courseCode: true } },
        group: { select: { id: true, name: true } },
      },
    }),

    // Recent notes (last 20)
    prisma.note.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        content: true,
        eventId: true,
        classHubId: true,
        groupId: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    // Recent files (last 20, excluding note-type)
    prisma.file.findMany({
      where: { userId: user.id, type: { not: "note" } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        type: true,
        url: true,
        category: true,
        eventId: true,
        classHubId: true,
        groupId: true,
        createdAt: true,
      },
    }),

    // Class hubs with recent tasks and notes
    prisma.classHub.findMany({
      where: { userId: user.id },
      include: {
        tasks: {
          where: { completed: false },
          orderBy: { dueDate: "asc" },
          take: 10,
        },
        notes: { orderBy: { updatedAt: "desc" }, take: 5 },
        events: {
          where: { startAt: { gte: now } },
          orderBy: { startAt: "asc" },
          take: 5,
          select: { id: true, title: true, startAt: true, endAt: true, location: true },
        },
      },
    }),

    // Workout hubs with recent logs
    prisma.workoutHub.findMany({
      where: { userId: user.id },
      include: {
        workoutLogs: { orderBy: { createdAt: "desc" }, take: 5 },
        events: {
          where: { startAt: { gte: now } },
          orderBy: { startAt: "asc" },
          take: 3,
          select: { id: true, title: true, startAt: true },
        },
      },
    }),

    // Recent AI conversations (last 5, trimmed)
    prisma.conversation.findMany({
      where: { userId: user.id, conversationType: "ai" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, role: true, content: true, createdAt: true },
        },
      },
    }),

    // Medications
    prisma.medication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    }),

    // Active reminders
    prisma.reminder.findMany({
      where: { userId: user.id, enabled: true },
      orderBy: { createdAt: "desc" },
    }),

    // Groups (via membership)
    prisma.groupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            tasks: { where: { completed: false }, take: 5 },
            notes: { orderBy: { updatedAt: "desc" }, take: 3 },
            files: { orderBy: { createdAt: "desc" }, take: 5 },
          },
        },
      },
    }),
  ]);

  // Reverse messages so they're chronological
  const conversations = recentConversations.map((c) => ({
    ...c,
    messages: [...c.messages].reverse(),
  }));

  const groups = groupMemberships.map((m) => ({
    ...m.group,
    memberRole: m.role,
    joinedAt: m.joinedAt,
  }));

  const context = {
    user,
    onboarding,
    upcomingEvents,
    recentEvents,
    openTasks,
    recentNotes,
    recentFiles,
    classHubs,
    workoutHubs,
    recentConversations: conversations,
    medications,
    reminders,
    groups,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({ success: true, data: context });
}
