import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export type EventMatch = {
  id: string;
  title: string;
  type: "scheduleBlock" | "classHub" | "workoutHub";
  confidence: "high" | "medium" | "low";
  reason: string;
};

export type MatchResult = {
  matches: EventMatch[];
  needsDisambiguation: boolean;
  suggestedMatch?: EventMatch;
};

/**
 * Find matching events or hubs for a given title using AI reasoning.
 * This helps recognize when "F365" and "Personal Financial Planning F365" refer to the same class.
 */
export async function findMatchingEvents(
  userId: string,
  title: string,
  eventType?: string,
  startAt?: Date,
  location?: string
): Promise<MatchResult> {
  // Query existing ClassHubs and recent ScheduleBlocks
  const [classHubs, scheduleBlocks] = await Promise.all([
    prisma.classHub.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        courseCode: true,
        instructor: true,
        semester: true,
      },
      take: 50,
    }),
    prisma.scheduleBlock.findMany({
      where: {
        userId,
        eventType: eventType || { in: ["class", "work"] },
        ...(startAt && {
          startAt: {
            gte: new Date(startAt.getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          },
        }),
      },
      select: {
        id: true,
        title: true,
        eventType: true,
        classHubId: true,
        workoutHubId: true,
        startAt: true,
        location: true,
      },
      take: 50,
      orderBy: { startAt: "desc" },
    }),
  ]);

  // If no existing events, no matches needed
  if (classHubs.length === 0 && scheduleBlocks.length === 0) {
    return {
      matches: [],
      needsDisambiguation: false,
    };
  }

  // Calculate day of week and time if startAt provided
  let dayOfWeek: string | undefined;
  let timeOfDay: string | undefined;
  if (startAt) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    dayOfWeek = days[startAt.getDay()];
    timeOfDay = startAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  // Use AI to determine matches
  const prompt = `You are helping match event/class titles to existing records in a user's schedule.

NEW TITLE TO MATCH: "${title}"
${eventType ? `EVENT TYPE: ${eventType}` : ""}
${dayOfWeek ? `DAY OF WEEK: ${dayOfWeek}` : ""}
${timeOfDay ? `TIME: ${timeOfDay}` : ""}
${location ? `LOCATION: ${location}` : ""}

EXISTING CLASS HUBS:
${classHubs.map((h) => `- ID: ${h.id}, Name: "${h.name}"${h.courseCode ? `, Code: ${h.courseCode}` : ""}${h.instructor ? `, Instructor: ${h.instructor}` : ""}`).join("\n")}

EXISTING SCHEDULE BLOCKS (recent):
${scheduleBlocks.map((e) => {
  const eDayOfWeek = e.startAt ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(e.startAt).getDay()] : "";
  const eTime = e.startAt ? new Date(e.startAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";
  return `- ID: ${e.id}, Title: "${e.title}", Type: ${e.eventType}${e.location ? `, Location: ${e.location}` : ""}${eDayOfWeek ? `, ${eDayOfWeek}` : ""}${eTime ? ` ${eTime}` : ""}${e.classHubId ? `, ClassHub: ${e.classHubId}` : ""}`;
}).join("\n")}

TASK:
Analyze the new event and determine if it matches any existing class hubs or schedule blocks. Consider:
- Course codes (e.g., "F365" matches "Personal Financial Planning F365")
- Abbreviations vs full names
- Common variations in naming
- Context clues from event type
- VERY IMPORTANT: Recurring patterns - if day of week, time, and/or location match exactly, this is a STRONG indicator of the same event
  - Example: "F365" on Tuesday at 2:00 PM matches "Personal Financial Planning" on Tuesday at 2:00 PM → HIGH confidence
  - Same location is also a strong signal

Return your analysis as a JSON array of matches, ordered by confidence (highest first).

For each match, provide:
- "id": The ID of the matching record
- "type": Either "classHub" or "scheduleBlock"
- "confidence": "high", "medium", or "low"
- "reason": Brief explanation of why this matches

Return ONLY the JSON array, no other text. If no matches, return empty array [].

Example response:
[
  {
    "id": "clx123",
    "type": "classHub",
    "confidence": "high",
    "reason": "F365 is the course code for Personal Financial Planning F365"
  }
]`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("");

    // Parse AI response
    const aiMatches = JSON.parse(textContent) as Array<{
      id: string;
      type: "classHub" | "scheduleBlock";
      confidence: "high" | "medium" | "low";
      reason: string;
    }>;

    // Convert to EventMatch format
    const matches: EventMatch[] = aiMatches.map((m) => {
      if (m.type === "classHub") {
        const hub = classHubs.find((h) => h.id === m.id);
        return {
          id: m.id,
          title: hub?.name || "Unknown",
          type: "classHub" as const,
          confidence: m.confidence,
          reason: m.reason,
        };
      } else {
        const block = scheduleBlocks.find((b) => b.id === m.id);
        return {
          id: m.id,
          title: block?.title || "Unknown",
          type: "scheduleBlock" as const,
          confidence: m.confidence,
          reason: m.reason,
        };
      }
    });

    // Determine if disambiguation is needed
    const highConfidenceMatches = matches.filter((m) => m.confidence === "high");
    const needsDisambiguation =
      matches.length > 1 ||
      (matches.length === 1 && matches[0].confidence !== "high");

    return {
      matches,
      needsDisambiguation,
      suggestedMatch: highConfidenceMatches[0] || matches[0],
    };
  } catch (error) {
    console.error("Error in AI event matching:", error);
    // Fallback: simple string matching
    const simpleMatches: EventMatch[] = [];

    // Check ClassHubs for exact or partial matches
    for (const hub of classHubs) {
      const lowerTitle = title.toLowerCase();
      const lowerHub = hub.name.toLowerCase();
      const lowerCode = hub.courseCode?.toLowerCase() || "";

      if (lowerHub === lowerTitle || lowerCode === lowerTitle) {
        simpleMatches.push({
          id: hub.id,
          title: hub.name,
          type: "classHub",
          confidence: "high",
          reason: "Exact match",
        });
      } else if (lowerHub.includes(lowerTitle) || lowerTitle.includes(lowerHub)) {
        simpleMatches.push({
          id: hub.id,
          title: hub.name,
          type: "classHub",
          confidence: "medium",
          reason: "Partial match",
        });
      } else if (lowerCode && (lowerHub.includes(lowerCode) || lowerTitle.includes(lowerCode))) {
        simpleMatches.push({
          id: hub.id,
          title: hub.name,
          type: "classHub",
          confidence: "medium",
          reason: "Course code match",
        });
      }
    }

    return {
      matches: simpleMatches.slice(0, 5),
      needsDisambiguation: simpleMatches.length > 1,
      suggestedMatch: simpleMatches[0],
    };
  }
}

/**
 * Create or find a ClassHub for the given event title.
 * If matches exist, returns the best match. Otherwise creates a new hub.
 */
export async function getOrCreateClassHub(
  userId: string,
  title: string,
  courseCode?: string,
  instructor?: string
): Promise<string> {
  const matchResult = await findMatchingEvents(userId, title, "class");

  // If high confidence match to a ClassHub, return it
  if (matchResult.suggestedMatch?.type === "classHub" && matchResult.suggestedMatch.confidence === "high") {
    return matchResult.suggestedMatch.id;
  }

  // Otherwise, create new ClassHub
  const newHub = await prisma.classHub.create({
    data: {
      userId,
      name: title,
      courseCode: courseCode || null,
      instructor: instructor || null,
    },
  });

  return newHub.id;
}
