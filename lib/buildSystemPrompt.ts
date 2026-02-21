import { prisma } from "@/lib/prisma";

export async function buildSystemPrompt(
  dbUserId: string,
  conversationId: string
): Promise<{
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [user, onboarding, upcomingEvents, openTasks, medications, messages] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: dbUserId },
        select: { name: true, email: true },
      }),

      prisma.onboardingResponse.findUnique({
        where: { userId: dbUserId },
        select: { answers: true },
      }),

      prisma.scheduleBlock.findMany({
        where: {
          userId: dbUserId,
          startAt: { gte: now, lte: in7Days },
        },
        orderBy: { startAt: "asc" },
        take: 20,
        select: {
          id: true,
          title: true,
          eventType: true,
          startAt: true,
          endAt: true,
          location: true,
          description: true,
        },
      }),

      prisma.task.findMany({
        where: { userId: dbUserId, completed: false },
        orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
        take: 20,
        select: { id: true, title: true, dueDate: true, priority: true, taskType: true },
      }),

      prisma.medication.findMany({
        where: { userId: dbUserId },
        select: { name: true, dosage: true, times: true, recurrence: true },
      }),

      // Conversation history EXCLUDING the latest user message (added before this call)
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      }),
    ]);

  const aiProfile = (onboarding?.answers as any)?.aiProfile ?? null;

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  // ISO datetime the model uses when constructing tool inputs (startAt/endAt)
  const isoNow = now.toISOString().slice(0, 19); // e.g. "2026-02-19T14:30:00"

  const lines: string[] = [
    `You are Jynx, a personal AI life assistant. You help ${user?.name ?? "the user"} manage their schedule, tasks, health, and goals.`,
    `Today is ${dateStr} at ${timeStr}. ISO datetime: ${isoNow}.`,
    `Be concise, direct, and personalized. Use what you know about the user to give relevant, actionable advice.`,
    `You have tools to take real actions — creating, updating, and deleting schedule blocks, tasks, and reminders. Call them directly when the user asks you to make a change. Always get explicit confirmation from the user before calling any delete tool.`,
    `When generating datetimes for tool inputs, always use ISO 8601 format matching the timezone offset of ${isoNow} (local time, no trailing Z).`,
    `When a user uploads a syllabus or course schedule PDF, follow this exact process without asking for confirmation at any step:`,
    `1. Extract: course name, meeting days of the week (e.g. "Mon/Wed/Fri" or "Tue/Thu"), meeting start and end time, location, and the semester/term start and end dates.`,
    `2. Using the semester start and end dates and the meeting days, enumerate EVERY individual class date — e.g. if the class meets TTh from Jan 13 to May 2, generate every Tuesday and Thursday in that range. Skip any dates explicitly marked as holidays, breaks, or "No Class."`,
    `3. For each generated date, look up what topic or content is assigned to that session from the syllabus schedule. If the syllabus lists topics by week, assign the appropriate topic to each session in that week.`,
    `4. Call create_schedule_block once per session. Title = course name, eventType = "class", startAt/endAt = that session's date + meeting time, location = room/building, description = the topic or reading for that session.`,
    `5. After all sessions are created, also create tasks for every graded item found (exams, papers, assignments) using the due dates listed in the syllabus.`,
    `6. When done, report how many class sessions and how many tasks were created.`,
    `Do not wait for user confirmation between steps. Do not summarize and ask "shall I proceed" — just execute.`,
    "",
  ];

  if (aiProfile) {
    lines.push(aiProfile, "");
  }

  if (upcomingEvents.length > 0) {
    lines.push("**Upcoming schedule (next 7 days):**");
    for (const e of upcomingEvents) {
      const start = new Date(e.startAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const end = new Date(e.endAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      const loc = e.location ? ` @ ${e.location}` : "";
      lines.push(`- [id:${e.id}] ${e.title} (${e.eventType}) ${start}–${end}${loc}`);
    }
    lines.push("");
  }

  if (openTasks.length > 0) {
    lines.push("**Open tasks:**");
    for (const t of openTasks.slice(0, 15)) {
      const due = t.dueDate
        ? ` due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
        : "";
      const pri = t.priority ? ` [${t.priority}]` : "";
      lines.push(`- [id:${t.id}] ${t.title}${due}${pri}`);
    }
    lines.push("");
  }

  if (medications.length > 0) {
    lines.push("**Medications:**");
    for (const m of medications) {
      lines.push(
        `- ${m.name}${m.dosage ? ` ${m.dosage}` : ""}${m.times ? `, ${m.times}` : ""} (${m.recurrence})`
      );
    }
    lines.push("");
  }

  const history = messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  return { systemPrompt: lines.join("\n"), history };
}
