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
        select: { title: true, dueDate: true, priority: true, taskType: true },
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

  const lines: string[] = [
    `You are Jynx, a personal AI life assistant. You help ${user?.name ?? "the user"} manage their schedule, tasks, health, and goals.`,
    `Today is ${dateStr} at ${timeStr}.`,
    `Be concise, direct, and personalized. Use what you know about the user to give relevant, actionable advice.`,
    `When asked to create or modify schedule items, tasks, or reminders, describe the changes clearly so the user can confirm.`,
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
      lines.push(`- ${e.title} (${e.eventType}) ${start}–${end}${loc}`);
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
      lines.push(`- ${t.title}${due}${pri}`);
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
