import { prisma } from "@/lib/prisma";

type ScheduleInsight = {
  type: "conflict" | "overload" | "missing_prep" | "no_breaks" | "imbalance" | "opportunity";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  affectedEvents?: Array<{ id: string; title: string; startAt: Date }>;
  suggestions?: string[];
};

type ScheduleAnalysis = {
  insights: ScheduleInsight[];
  summary: string;
  score: number; // 0-100, health score
};

export async function analyzeScheduleHealth(
  userId: string,
  daysAhead: number = 14,
  focus: string = "all"
): Promise<ScheduleAnalysis> {
  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  // Fetch schedule and related data
  const [events, tasks, memories] = await Promise.all([
    prisma.scheduleBlock.findMany({
      where: {
        userId,
        startAt: { gte: now, lte: endDate },
      },
      orderBy: { startAt: "asc" },
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
      where: {
        userId,
        completed: false,
        dueDate: { gte: now, lte: endDate },
        taskType: "assignment",
      },
      orderBy: { dueDate: "asc" },
      select: {
        id: true,
        title: true,
        dueDate: true,
        taskType: true,
      },
    }),
    prisma.userMemory.findMany({
      where: {
        userId,
        isActive: true,
        category: { in: ["preference", "constraint"] },
      },
      select: {
        content: true,
        category: true,
      },
    }),
  ]);

  const insights: ScheduleInsight[] = [];

  // 1. Detect time conflicts
  if (focus === "all" || focus === "conflicts") {
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      if (current.endAt > next.startAt) {
        insights.push({
          type: "conflict",
          severity: "high",
          title: "Schedule Conflict Detected",
          description: `"${current.title}" overlaps with "${next.title}" on ${next.startAt.toLocaleDateString()}`,
          affectedEvents: [
            { id: current.id, title: current.title, startAt: current.startAt },
            { id: next.id, title: next.title, startAt: next.startAt },
          ],
          suggestions: [
            "Reschedule one of these events",
            "Check if one can be attended remotely",
          ],
        });
      }
    }
  }

  // 2. Detect overload days (too many events in one day)
  if (focus === "all" || focus === "workload") {
    const eventsByDay = new Map<string, typeof events>();
    events.forEach((event) => {
      const dateKey = event.startAt.toISOString().split("T")[0];
      if (!eventsByDay.has(dateKey)) {
        eventsByDay.set(dateKey, []);
      }
      eventsByDay.get(dateKey)!.push(event);
    });

    eventsByDay.forEach((dayEvents, date) => {
      if (dayEvents.length >= 6) {
        const totalMinutes = dayEvents.reduce((sum, e) => {
          return sum + (e.endAt.getTime() - e.startAt.getTime()) / (1000 * 60);
        }, 0);

        const nonClassEvents = dayEvents.filter((e) => e.eventType !== "class");
        const classEvents = dayEvents.filter((e) => e.eventType === "class");

        const suggestions = [];
        if (nonClassEvents.length > 0) {
          suggestions.push(
            "Consider rescheduling optional meetings, study sessions, or workouts to lighter days",
            "Identify which events are truly necessary for this day"
          );
        }
        suggestions.push(
          "Schedule breaks and downtime",
          "Prep meals and essentials the night before"
        );

        insights.push({
          type: "overload",
          severity: totalMinutes > 480 ? "high" : "medium",
          title: "Heavy Day Detected",
          description: `${dayEvents.length} events scheduled on ${new Date(date).toLocaleDateString()} (${Math.round(totalMinutes / 60)} hours total)${classEvents.length > 0 ? `. ${classEvents.length} are classes (fixed schedule)` : ""}`,
          affectedEvents: dayEvents.map((e) => ({ id: e.id, title: e.title, startAt: e.startAt })),
          suggestions,
        });
      }
    });
  }

  // 3. Detect missing prep time before exams/assignments
  if (focus === "all" || focus === "exams") {
    tasks.forEach((task) => {
      if (!task.dueDate) return;

      const dueDate = task.dueDate; // Store for TypeScript type narrowing
      const daysBefore = 3; // Look for study time in 3 days before
      const prepWindowStart = new Date(dueDate.getTime() - daysBefore * 24 * 60 * 60 * 1000);

      const prepEvents = events.filter((e) => {
        return (
          e.startAt >= prepWindowStart &&
          e.startAt < dueDate &&
          (e.eventType === "study" || e.title.toLowerCase().includes("study"))
        );
      });

      if (prepEvents.length === 0) {
        insights.push({
          type: "missing_prep",
          severity: "medium",
          title: "No Study Time Scheduled",
          description: `"${task.title}" is due ${dueDate.toLocaleDateString()} but no study time is scheduled`,
          suggestions: [
            `Schedule study sessions in the ${daysBefore} days before the deadline`,
            "Block out 2-3 hour study periods",
            "Review class notes and materials in advance",
          ],
        });
      }
    });
  }

  // 4. Detect lack of breaks (back-to-back events - only for non-class events)
  if (focus === "all" || focus === "balance") {
    const eventsByDay = new Map<string, typeof events>();
    events.forEach((event) => {
      const dateKey = event.startAt.toISOString().split("T")[0];
      if (!eventsByDay.has(dateKey)) {
        eventsByDay.set(dateKey, []);
      }
      eventsByDay.get(dateKey)!.push(event);
    });

    eventsByDay.forEach((dayEvents, date) => {
      if (dayEvents.length < 3) return; // Only check busy days

      // Count back-to-back events, but only flag if they include non-class events
      let backToBackCount = 0;
      let controllableBackToBack = 0;
      const backToBackPairs: typeof events = [];

      for (let i = 0; i < dayEvents.length - 1; i++) {
        const current = dayEvents[i];
        const next = dayEvents[i + 1];
        const gap = next.startAt.getTime() - current.endAt.getTime();
        const gapMinutes = gap / (1000 * 60);

        if (gapMinutes < 15) {
          backToBackCount++;
          // Only count as "controllable" if at least one event is NOT a class
          if (current.eventType !== "class" || next.eventType !== "class") {
            controllableBackToBack++;
            backToBackPairs.push(current, next);
          }
        }
      }

      // Only flag if there are controllable back-to-back events
      if (controllableBackToBack >= 2) {
        insights.push({
          type: "no_breaks",
          severity: "medium",
          title: "Insufficient Break Time",
          description: `${controllableBackToBack} back-to-back non-class events on ${new Date(date).toLocaleDateString()} with minimal breaks`,
          suggestions: [
            "Add 15-30 minute buffers between meetings/study sessions",
            "Schedule lunch or rest breaks between optional events",
            "Consider rescheduling study time or meetings to create gaps",
          ],
        });
      } else if (backToBackCount >= 3 && controllableBackToBack === 0) {
        // All back-to-back events are classes - just note it as context, not a problem
        insights.push({
          type: "opportunity",
          severity: "low",
          title: "Back-to-Back Classes",
          description: `You have ${backToBackCount} back-to-back classes on ${new Date(date).toLocaleDateString()}. Class schedules are fixed, but you can plan around them.`,
          suggestions: [
            "Bring snacks or eat before your first class",
            "Pack everything you need to avoid rushing between buildings",
            "Use any small gaps for quick mental breaks",
          ],
        });
      }
    });
  }

  // 5. Check against user preferences/constraints (be smart about what's controllable)
  memories.forEach((memory) => {
    const contentLower = memory.content.toLowerCase();

    // Check for violated preferences - but only flag controllable events
    if (contentLower.includes("hate back-to-back") || contentLower.includes("no back-to-back")) {
      // Count back-to-back events that are NOT all classes (which can't be changed)
      let controllableViolations = 0;
      const violatingPairs: string[] = [];

      for (let i = 0; i < events.length - 1; i++) {
        const current = events[i];
        const next = events[i + 1];
        const gap = next.startAt.getTime() - current.endAt.getTime();

        if (gap < 15 * 60 * 1000) {
          // Only count if at least one isn't a class (those are controllable)
          if (current.eventType !== "class" || next.eventType !== "class") {
            controllableViolations++;
            violatingPairs.push(`${current.title} → ${next.title}`);
          }
        }
      }

      if (controllableViolations > 0) {
        insights.push({
          type: "imbalance",
          severity: "low",
          title: "Preference Note",
          description: `You have ${controllableViolations} back-to-back non-class events. You mentioned you prefer to avoid this when possible.`,
          suggestions: [
            "Reschedule meetings or study sessions to add buffer time",
            "Move optional events to different time slots",
            "Note: Class schedules are fixed and can't be changed",
          ],
        });
      }
    }

    // Check for other preferences that might be violated
    if (contentLower.includes("prefer morning") && contentLower.includes("workout")) {
      const afternoonWorkouts = events.filter(
        (e) =>
          e.eventType === "health" &&
          new Date(e.startAt).getHours() >= 12
      );

      if (afternoonWorkouts.length > 0) {
        insights.push({
          type: "imbalance",
          severity: "low",
          title: "Workout Timing Preference",
          description: `You have ${afternoonWorkouts.length} workouts scheduled in the afternoon, but you prefer morning workouts`,
          suggestions: ["Consider moving workouts to earlier time slots when possible"],
        });
      }
    }
  });

  // 6. Identify opportunities
  const classEvents = events.filter((e) => e.eventType === "class");
  const studyEvents = events.filter((e) => e.eventType === "study");

  if (classEvents.length > 0 && studyEvents.length === 0 && tasks.length > 0) {
    insights.push({
      type: "opportunity",
      severity: "low",
      title: "Study Time Opportunity",
      description: `You have ${tasks.length} pending assignments but no dedicated study time scheduled`,
      suggestions: [
        "Schedule regular study blocks for each class",
        "Use gaps in your schedule for focused study",
      ],
    });
  }

  // Calculate health score
  const criticalIssues = insights.filter((i) => i.severity === "high").length;
  const moderateIssues = insights.filter((i) => i.severity === "medium").length;
  const minorIssues = insights.filter((i) => i.severity === "low").length;

  let score = 100;
  score -= criticalIssues * 20;
  score -= moderateIssues * 10;
  score -= minorIssues * 5;
  score = Math.max(0, Math.min(100, score));

  // Generate summary
  let summary = "";
  if (score >= 90) {
    summary = "Your schedule looks great! Well-balanced with good time management.";
  } else if (score >= 70) {
    summary = `Your schedule is mostly healthy, but there are ${insights.length} areas for improvement.`;
  } else if (score >= 50) {
    summary = `Your schedule needs attention. Found ${criticalIssues + moderateIssues} significant issues.`;
  } else {
    summary = `Your schedule has serious problems that need immediate attention.`;
  }

  return {
    insights,
    summary,
    score,
  };
}
