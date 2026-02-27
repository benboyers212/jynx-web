import { prisma } from "@/lib/prisma";
import { getLocalISOString } from "@/lib/timezones";

export async function buildSystemPrompt(
  dbUserId: string,
  conversationId: string
): Promise<{
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}> {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [user, onboarding, upcomingEvents, openTasks, medications, memories, messages, completions] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: dbUserId },
        select: { name: true, email: true, createdAt: true, timezone: true },
      }),

      prisma.onboardingResponse.findUnique({
        where: { userId: dbUserId },
        select: { answers: true, createdAt: true },
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

      prisma.userMemory.findMany({
        where: { userId: dbUserId, isActive: true },
        orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
        take: 30,
        select: { content: true, category: true, importance: true, createdAt: true },
      }),

      // Conversation history EXCLUDING the latest user message (added before this call)
      prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        select: { role: true, content: true },
      }),

      // Event completion feedback (last 30 days for pattern learning)
      prisma.eventCompletion.findMany({
        where: {
          userId: dbUserId,
          completedAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { completedAt: "desc" },
        take: 50,
        select: {
          scheduledDuration: true,
          actualDuration: true,
          variance: true,
          notes: true,
          completedAt: true,
          event: {
            select: {
              title: true,
              eventType: true,
            },
          },
        },
      }),
    ]);

  const aiProfile = (onboarding?.answers as any)?.aiProfile ?? null;

  // Use user's timezone or default to America/New_York
  const userTimezone = user?.timezone || "America/New_York";

  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: userTimezone,
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: userTimezone,
  });
  // ISO datetime the model uses when constructing tool inputs (startAt/endAt)
  // Uses user's timezone so AI creates events in the correct local time
  const isoNow = getLocalISOString(now, userTimezone); // e.g. "2026-02-19T14:30:00"

  const lines: string[] = [
    `You are Jynx, a personal AI life assistant. You help ${user?.name ?? "the user"} manage their schedule, tasks, health, and goals.`,
    `Today is ${dateStr} at ${timeStr}. ISO datetime: ${isoNow}. User timezone: ${userTimezone}.`,
    `Be concise, direct, and personalized. Use what you know about the user to give relevant, actionable advice.`,
    `You have tools to take real actions — creating, updating, and deleting schedule blocks, tasks, and reminders. Call them directly when the user asks you to make a change. Always get explicit confirmation from the user before calling any delete tool.`,
    "",
    `**TIMEZONE & DATETIME HANDLING:**`,
    `The user is in the ${userTimezone} timezone. When creating events:`,
    `- Always use ISO 8601 format WITHOUT the 'Z' suffix: YYYY-MM-DDTHH:MM:SS`,
    `- Times provided by the user are in their local timezone (${userTimezone})`,
    `- "3pm" means 15:00 in ${userTimezone}, NOT UTC`,
    `- "Tomorrow at 9:30am" means the next calendar day at 09:30 in ${userTimezone}`,
    `- The current time in ${userTimezone} is ${timeStr}. Use ${isoNow} as your reference.`,
    `- NEVER add 'Z' or timezone offsets to datetime strings - the system will interpret them as local time`,
    "",
    `**FOLLOW-UP QUESTIONS:**`,
    `When you need to ask the user follow-up questions to clarify their request, ALWAYS use the 'ask_structured_questions' tool instead of asking questions in plain text.`,
    `Prefer structured input types (choice, date, time, yesno) over text type to minimize typing for the user. An 'Other' option is automatically added to all choice questions.`,
    `Examples:`,
    `  • Asking for event duration → use choice type with options: ["30 minutes", "1 hour", "2 hours", "3 hours"]`,
    `  • Asking for specific time → use time type (shows time picker)`,
    `  • Asking for date → use date type (shows date picker)`,
    `  • Asking yes/no questions → use yesno type (dropdown with Yes/No)`,
    `  • Asking for recurring pattern → use recurring type (Once/Daily/Weekdays/Custom)`,
    `  • Multiple related questions → ask them all at once in a single tool call`,
    `Never ask questions in your text response when you could use the structured questions tool instead.`,
    "",
    `**MEMORY & LEARNING:**`,
    `You have a 'remember' tool to store important information about the user for future conversations. Use it proactively when the user:`,
    `- Expresses a preference ("I prefer...", "I like...", "I hate...")`,
    `- States a goal ("I'm trying to...", "I want to...")`,
    `- Mentions a habit ("I usually...", "I always...", "I never...")`,
    `- Describes a constraint ("I can't...", "I need to avoid...", "I have to...")`,
    `- Corrects you ("Actually...", "No, that's...", "It's really...")`,
    `- Shares insight about themselves ("I've noticed that...", "I tend to...")`,
    `When you remember something, acknowledge it briefly: "Got it, I'll remember that." or "Noted for next time."`,
    `Track how the user evolves from their onboarding responses. If they mention changes in behavior, goals, or preferences, note the evolution.`,
    `Use 'analyze_schedule_health' proactively when appropriate to provide insights and catch problems before they ask.`,
    "",
    `**IMPORTANT - What's Controllable vs Fixed:**`,
    `- CLASS events: Fixed schedules, can't be rescheduled. Don't suggest moving them.`,
    `- STUDY, PREP, MEETING, WORK, HEALTH, LIFE events: Usually flexible, can be rescheduled.`,
    `When analyzing schedule issues (conflicts, back-to-back events, heavy days), distinguish between:`,
    `  • Fixed constraints (classes) - acknowledge them, suggest coping strategies`,
    `  • Flexible events (everything else) - suggest rescheduling or adjustments`,
    `Example: "You have 3 back-to-back classes on Tuesday (fixed schedule), but you could move your study session to create a break" vs "Move your classes" (wrong)`,
    `When a user uploads a syllabus or course schedule PDF, follow this exact process without asking for confirmation at any step:`,
    `1. Extract: course name, course code (if provided), instructor name, meeting days of the week (e.g. "Mon/Wed/Fri" or "Tue/Thu"), meeting start and end time, location, and the semester/term start and end dates.`,
    `2. FIRST, call create_or_find_class_hub with the extracted course name, course code, instructor, and semester. This creates or finds the ClassHub that all events for this class will link to. Save the returned classHub.id for the next steps.`,
    `3. Using the semester start and end dates and the meeting days, enumerate EVERY individual class date — e.g. if the class meets TTh from Jan 13 to May 2, generate every Tuesday and Thursday in that range. Skip any dates explicitly marked as holidays, breaks, or "No Class."`,
    `4. For each generated date, look up what topic or content is assigned to that session from the syllabus schedule. If the syllabus lists topics by week, assign the appropriate topic to each session in that week.`,
    `5. Call create_schedule_block once per session with: title = course name, eventType = "class", startAt/endAt = that session's date + meeting time, location = room/building, description = the topic or reading for that session, and IMPORTANTLY classHubId = the ID from step 2. This links all class events to the same ClassHub.`,
    `6. After all sessions are created, also create tasks for every graded item found (exams, papers, assignments) using the due dates listed in the syllabus.`,
    `7. When done, report how many class sessions and how many tasks were created.`,
    `Do not wait for user confirmation between steps. Do not summarize and ask "shall I proceed" — just execute.`,
    `IMPORTANT: When creating class events, ALWAYS use create_or_find_class_hub first to get a classHubId, then pass that ID to every create_schedule_block call. This ensures all instances of the same class (even with slight name variations) are properly grouped together.`,
    "",
    `**DUPLICATE PREVENTION:**`,
    `Before creating any event, check the "Upcoming schedule" section above for existing events:`,
    `1. If the user asks to add an event that already exists at the same time/day, DO NOT create a duplicate`,
    `2. Instead, acknowledge the existing event and ask if they want to modify it`,
    `3. When the user provides multiple items to add (e.g., "add my classes: CS401 on MWF at 9am, MATH200 on TTh at 2pm"), create each one ONCE`,
    `4. If you're unsure whether an event already exists, ask the user before creating`,
    `5. When creating recurring events (e.g., class sessions for a semester), use a single create_or_find_class_hub call first, then create each session with that hub ID`,
    "",
    `**LINKING TASKS & ASSIGNMENTS TO CLASSES:**`,
    `When the user mentions an assignment, homework, project, quiz, or exam for a specific class:`,
    `1. First check if a ClassHub exists for that class (look at the existing schedule or use list_class_hubs)`,
    `2. If found, create the task with classHubId set to that ClassHub's ID`,
    `3. Common patterns to recognize and link:`,
    `   - "homework for CS401" → link to CS401 ClassHub`,
    `   - "F365 exam on Friday" → link to the F365/Personal Financial Planning ClassHub`,
    `   - "assignment due for Operating Systems" → find and link to Operating Systems ClassHub`,
    `4. If the class doesn't exist as a ClassHub yet, create it first with create_or_find_class_hub`,
    `5. This ensures assignments appear under their class when viewing event details`,
    "",
  ];

  if (aiProfile) {
    lines.push("**AI personality from onboarding:**", aiProfile, "");
  }

  // Add user evolution context
  if (user?.createdAt && onboarding?.createdAt) {
    const daysSinceOnboarding = Math.floor(
      (now.getTime() - new Date(onboarding.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceOnboarding > 30) {
      lines.push(
        `**User evolution:** ${user.name ?? "User"} completed onboarding ${daysSinceOnboarding} days ago. Their habits and preferences may have evolved since then. Pay attention to changes they mention.`,
        ""
      );
    }
  }

  // Add stored memories
  if (memories.length > 0) {
    lines.push("**What you know about the user (from past conversations):**");

    const byCategory = {
      preference: memories.filter((m) => m.category === "preference"),
      goal: memories.filter((m) => m.category === "goal"),
      habit: memories.filter((m) => m.category === "habit"),
      constraint: memories.filter((m) => m.category === "constraint"),
      correction: memories.filter((m) => m.category === "correction"),
      insight: memories.filter((m) => m.category === "insight"),
    };

    if (byCategory.preference.length > 0) {
      lines.push("Preferences:");
      byCategory.preference.slice(0, 10).forEach((m) => lines.push(`  • ${m.content}`));
    }
    if (byCategory.goal.length > 0) {
      lines.push("Goals:");
      byCategory.goal.slice(0, 5).forEach((m) => lines.push(`  • ${m.content}`));
    }
    if (byCategory.habit.length > 0) {
      lines.push("Habits:");
      byCategory.habit.slice(0, 5).forEach((m) => lines.push(`  • ${m.content}`));
    }
    if (byCategory.constraint.length > 0) {
      lines.push("Constraints:");
      byCategory.constraint.slice(0, 5).forEach((m) => lines.push(`  • ${m.content}`));
    }
    if (byCategory.correction.length > 0) {
      lines.push("Important corrections:");
      byCategory.correction.slice(0, 5).forEach((m) => lines.push(`  • ${m.content}`));
    }
    if (byCategory.insight.length > 0) {
      lines.push("Observed patterns:");
      byCategory.insight.slice(0, 5).forEach((m) => lines.push(`  • ${m.content}`));
    }

    lines.push("");
  }

  // Add event completion patterns for AI learning
  if (completions.length > 0) {
    lines.push("**Event completion patterns (last 30 days):**");
    lines.push("Learn from these patterns when scheduling similar events:");

    // Aggregate by event type
    const byEventType: Record<string, {
      count: number;
      totalScheduled: number;
      totalActual: number;
      shorter: number;
      justRight: number;
      longer: number;
      notableNotes: string[];
    }> = {};

    for (const c of completions) {
      const type = c.event?.eventType || "unknown";
      if (!byEventType[type]) {
        byEventType[type] = {
          count: 0,
          totalScheduled: 0,
          totalActual: 0,
          shorter: 0,
          justRight: 0,
          longer: 0,
          notableNotes: [],
        };
      }

      const stats = byEventType[type];
      stats.count++;
      stats.totalScheduled += c.scheduledDuration;
      stats.totalActual += c.actualDuration;

      if (c.variance === "shorter") stats.shorter++;
      else if (c.variance === "just_right") stats.justRight++;
      else if (c.variance === "longer") stats.longer++;

      if (c.notes && c.notes.trim() && stats.notableNotes.length < 3) {
        stats.notableNotes.push(c.notes.trim());
      }
    }

    // Display aggregated insights
    for (const [eventType, stats] of Object.entries(byEventType)) {
      if (stats.count < 2) continue; // Need at least 2 data points

      const avgScheduled = Math.round(stats.totalScheduled / stats.count);
      const avgActual = Math.round(stats.totalActual / stats.count);
      const diff = avgActual - avgScheduled;
      const diffPercent = Math.round((diff / avgScheduled) * 100);

      let pattern = "";
      if (stats.longer > stats.count * 0.6) {
        pattern = `usually take longer than scheduled (avg +${Math.abs(diffPercent)}%)`;
      } else if (stats.shorter > stats.count * 0.6) {
        pattern = `usually finish faster than scheduled (avg ${diffPercent}%)`;
      } else if (stats.justRight > stats.count * 0.6) {
        pattern = "timing is usually accurate";
      } else {
        pattern = `mixed timing (${stats.shorter} shorter, ${stats.justRight} just right, ${stats.longer} longer)`;
      }

      lines.push(`  • ${eventType.toUpperCase()}: ${pattern} (${stats.count} completions)`);

      if (stats.notableNotes.length > 0) {
        stats.notableNotes.forEach((note) => {
          lines.push(`    - Feedback: "${note}"`);
        });
      }
    }

    lines.push("");
    lines.push("**Use this data to:**");
    lines.push("  • Suggest more realistic durations when creating similar events");
    lines.push("  • Warn the user if they're consistently under/over-estimating certain event types");
    lines.push("  • Adjust time blocks based on actual completion patterns");
    lines.push("");
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
        timeZone: userTimezone,
      });
      const end = new Date(e.endAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZone: userTimezone,
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
        ? ` due ${new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: userTimezone })}`
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
