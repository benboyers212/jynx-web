import { prisma } from "@/lib/prisma";

export type ToolResult =
  | { success: true; data: unknown }
  | { success: false; error: string };

export async function executeToolCall(
  toolName: string,
  toolInput: any,
  dbUserId: string
): Promise<ToolResult> {
  try {
    switch (toolName) {
      // ── Schedule ──────────────────────────────────────────────────────────
      case "create_schedule_block": {
        const block = await prisma.scheduleBlock.create({
          data: {
            userId: dbUserId,
            title: toolInput.title,
            eventType: toolInput.eventType,
            category: toolInput.eventType,
            startAt: new Date(toolInput.startAt),
            endAt: new Date(toolInput.endAt),
            location: toolInput.location ?? null,
            description: toolInput.description ?? null,
          },
          select: {
            id: true,
            title: true,
            eventType: true,
            startAt: true,
            endAt: true,
            location: true,
          },
        });
        return { success: true, data: { created: block } };
      }

      case "update_schedule_block": {
        const existing = await prisma.scheduleBlock.findFirst({
          where: { id: toolInput.id, userId: dbUserId },
          select: { id: true },
        });
        if (!existing) return { success: false, error: "Event not found or access denied" };

        const updated = await prisma.scheduleBlock.update({
          where: { id: toolInput.id },
          data: {
            ...(toolInput.title !== undefined && { title: toolInput.title }),
            ...(toolInput.eventType !== undefined && {
              eventType: toolInput.eventType,
              category: toolInput.eventType,
            }),
            ...(toolInput.startAt !== undefined && { startAt: new Date(toolInput.startAt) }),
            ...(toolInput.endAt !== undefined && { endAt: new Date(toolInput.endAt) }),
            ...(toolInput.location !== undefined && { location: toolInput.location }),
            ...(toolInput.description !== undefined && { description: toolInput.description }),
          },
          select: { id: true, title: true, startAt: true, endAt: true },
        });
        return { success: true, data: { updated } };
      }

      case "delete_schedule_block": {
        const existing = await prisma.scheduleBlock.findFirst({
          where: { id: toolInput.id, userId: dbUserId },
          select: { id: true, title: true },
        });
        if (!existing) return { success: false, error: "Event not found or access denied" };
        await prisma.scheduleBlock.delete({ where: { id: toolInput.id } });
        return { success: true, data: { deleted: existing } };
      }

      case "list_schedule_blocks": {
        const blocks = await prisma.scheduleBlock.findMany({
          where: {
            userId: dbUserId,
            startAt: {
              gte: new Date(toolInput.startDate + "T00:00:00"),
              lte: new Date(toolInput.endDate + "T23:59:59"),
            },
          },
          orderBy: { startAt: "asc" },
          take: 50,
          select: {
            id: true,
            title: true,
            eventType: true,
            startAt: true,
            endAt: true,
            location: true,
          },
        });
        return { success: true, data: { blocks, count: blocks.length } };
      }

      // ── Tasks ─────────────────────────────────────────────────────────────
      case "create_task": {
        const task = await prisma.task.create({
          data: {
            userId: dbUserId,
            title: toolInput.title,
            description: toolInput.description ?? null,
            dueDate: toolInput.dueDate ? new Date(toolInput.dueDate) : null,
            priority: toolInput.priority ?? null,
            taskType: toolInput.taskType ?? "task",
          },
          select: { id: true, title: true, dueDate: true, priority: true, taskType: true },
        });
        return { success: true, data: { created: task } };
      }

      case "complete_task": {
        const existing = await prisma.task.findFirst({
          where: { id: toolInput.id, userId: dbUserId },
          select: { id: true },
        });
        if (!existing) return { success: false, error: "Task not found or access denied" };
        const updated = await prisma.task.update({
          where: { id: toolInput.id },
          data: { completed: true },
          select: { id: true, title: true },
        });
        return { success: true, data: { completed: updated } };
      }

      case "update_task": {
        const existing = await prisma.task.findFirst({
          where: { id: toolInput.id, userId: dbUserId },
          select: { id: true },
        });
        if (!existing) return { success: false, error: "Task not found or access denied" };
        const updated = await prisma.task.update({
          where: { id: toolInput.id },
          data: {
            ...(toolInput.title !== undefined && { title: toolInput.title }),
            ...(toolInput.description !== undefined && { description: toolInput.description }),
            ...(toolInput.dueDate !== undefined && {
              dueDate: toolInput.dueDate ? new Date(toolInput.dueDate) : null,
            }),
            ...(toolInput.priority !== undefined && { priority: toolInput.priority }),
          },
          select: { id: true, title: true, dueDate: true, priority: true },
        });
        return { success: true, data: { updated } };
      }

      case "delete_task": {
        const existing = await prisma.task.findFirst({
          where: { id: toolInput.id, userId: dbUserId },
          select: { id: true, title: true },
        });
        if (!existing) return { success: false, error: "Task not found or access denied" };
        await prisma.task.delete({ where: { id: toolInput.id } });
        return { success: true, data: { deleted: existing } };
      }

      // ── Reminders ─────────────────────────────────────────────────────────
      case "create_reminder": {
        const reminder = await prisma.reminder.create({
          data: {
            userId: dbUserId,
            title: toolInput.title,
            notes: toolInput.notes ?? null,
            schedule: toolInput.schedule,
            timeOfDay: toolInput.timeOfDay ?? null,
            date: toolInput.date ?? null,
          },
          select: { id: true, title: true, schedule: true, timeOfDay: true, date: true },
        });
        return { success: true, data: { created: reminder } };
      }

      case "delete_reminder": {
        const existing = await prisma.reminder.findFirst({
          where: { id: toolInput.id, userId: dbUserId },
          select: { id: true, title: true },
        });
        if (!existing) return { success: false, error: "Reminder not found or access denied" };
        await prisma.reminder.delete({ where: { id: toolInput.id } });
        return { success: true, data: { deleted: existing } };
      }

      // ── Structured Questions ──────────────────────────────────────────────
      case "ask_structured_questions": {
        // This tool doesn't execute any database action - it just returns
        // the questions data which the frontend will render as UI components
        return {
          success: true,
          data: {
            type: "structured_questions",
            questions: toolInput.questions,
          },
        };
      }

      // ── Event Disambiguation ──────────────────────────────────────────────
      case "disambiguate_event": {
        // Import the matching function
        const { findMatchingEvents } = await import("@/lib/ai/eventMatching");

        const matchResult = await findMatchingEvents(
          dbUserId,
          toolInput.title,
          toolInput.eventType,
        );

        // Return the matches for the frontend to display as a selection UI
        return {
          success: true,
          data: {
            type: "event_disambiguation",
            title: toolInput.title,
            context: toolInput.context,
            matches: matchResult.matches,
            needsDisambiguation: matchResult.needsDisambiguation,
            suggestedMatch: matchResult.suggestedMatch,
          },
        };
      }

      // ── ClassHub Management ───────────────────────────────────────────────
      case "create_or_find_class_hub": {
        const { getOrCreateClassHub } = await import("@/lib/ai/eventMatching");

        const classHubId = await getOrCreateClassHub(
          dbUserId,
          toolInput.name,
          toolInput.courseCode,
          toolInput.instructor
        );

        // Update with additional fields if provided
        if (toolInput.semester || toolInput.department) {
          await prisma.classHub.update({
            where: { id: classHubId },
            data: {
              ...(toolInput.semester && { semester: toolInput.semester }),
              ...(toolInput.department && { department: toolInput.department }),
            },
          });
        }

        const classHub = await prisma.classHub.findUnique({
          where: { id: classHubId },
          select: {
            id: true,
            name: true,
            courseCode: true,
            instructor: true,
            semester: true,
            department: true,
          },
        });

        return { success: true, data: { classHub } };
      }

      case "list_class_hubs": {
        const classHubs = await prisma.classHub.findMany({
          where: { userId: dbUserId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            courseCode: true,
            instructor: true,
            semester: true,
            department: true,
            _count: {
              select: {
                events: true,
                notes: true,
                files: true,
              },
            },
          },
        });

        return { success: true, data: { classHubs, count: classHubs.length } };
      }

      // ── User Memory & Preferences ─────────────────────────────────────────
      case "remember": {
        const memory = await prisma.userMemory.create({
          data: {
            userId: dbUserId,
            content: toolInput.content,
            category: toolInput.category,
            importance: toolInput.importance || 5,
            source: "conversation",
            isActive: true,
          },
          select: {
            id: true,
            content: true,
            category: true,
            importance: true,
            createdAt: true,
          },
        });

        return { success: true, data: { memory, message: "Remembered" } };
      }

      case "recall_memories": {
        const where: any = { userId: dbUserId, isActive: true };
        if (toolInput.category && toolInput.category !== "all") {
          where.category = toolInput.category;
        }

        const memories = await prisma.userMemory.findMany({
          where,
          orderBy: [
            { importance: "desc" },
            { createdAt: "desc" },
          ],
          take: toolInput.limit || 20,
          select: {
            id: true,
            content: true,
            category: true,
            importance: true,
            createdAt: true,
          },
        });

        return { success: true, data: { memories, count: memories.length } };
      }

      case "analyze_schedule_health": {
        const { analyzeScheduleHealth } = await import("@/lib/ai/scheduleAnalysis");
        const analysis = await analyzeScheduleHealth(
          dbUserId,
          toolInput.daysAhead || 14,
          toolInput.focus || "all"
        );

        return { success: true, data: analysis };
      }

      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
