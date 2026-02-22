import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function GET(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    // Fetch recent events (last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const [recentEvents, goals, memories] = await Promise.all([
      prisma.scheduleBlock.findMany({
        where: {
          userId: user.id,
          startAt: { gte: threeDaysAgo },
        },
        orderBy: { startAt: "desc" },
        take: 20,
        select: {
          title: true,
          eventType: true,
          startAt: true,
          endAt: true,
        },
      }),
      prisma.userMemory.findMany({
        where: {
          userId: user.id,
          isActive: true,
          category: "goal",
        },
        orderBy: { importance: "desc" },
        take: 5,
        select: {
          content: true,
        },
      }),
      prisma.userMemory.findMany({
        where: {
          userId: user.id,
          isActive: true,
          category: { in: ["habit", "preference"] },
        },
        orderBy: { importance: "desc" },
        take: 10,
        select: {
          content: true,
          category: true,
        },
      }),
    ]);

    // If no recent activity, no need to ask questions
    if (recentEvents.length === 0) {
      return NextResponse.json({ questions: [] });
    }

    // Build minimal prompt for AI
    const prompt = `You are helping generate a single, relevant check-in question for a student based on their recent activity.

RECENT EVENTS (last 3 days):
${recentEvents.map((e) => `- ${e.title} (${e.eventType}) on ${e.startAt.toLocaleDateString()}`).join("\n")}

${goals.length > 0 ? `USER GOALS:\n${goals.map((g) => `- ${g.content}`).join("\n")}\n` : ""}
${memories.length > 0 ? `USER PREFERENCES/HABITS:\n${memories.map((m) => `- ${m.content}`).join("\n")}\n` : ""}

TASK:
Analyze the recent activity and determine if there's ONE meaningful question worth asking.

Good reasons to ask:
- They had important exams/assignments recently (follow up on how it went)
- They had workout/health events (check in on consistency or how they felt)
- Pattern of late-night study sessions (check if sleep/energy is okay)
- Lots of social/meeting events (check if they're feeling balanced)
- They mentioned a goal that relates to recent events

Do NOT ask if:
- Nothing particularly notable happened
- Too generic or could apply to anyone
- Just routine class attendance with no special context

If you have a good question, respond with JSON:
{
  "question": "Your specific, contextual question here",
  "type": "yesno" or "text",
  "reason": "Brief explanation of why this is worth asking"
}

If you don't have a meaningful question, respond with:
{ "question": null }

Respond ONLY with JSON, no other text.`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
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

    // Strip markdown code fences if present (```json ... ```)
    const cleanedText = textContent.replace(/```json\s*/g, "").replace(/```\s*$/g, "").trim();

    const result = JSON.parse(cleanedText);

    if (!result.question) {
      return NextResponse.json({ questions: [] });
    }

    // Format question for frontend
    const question = {
      id: `q-${Date.now()}`,
      prompt: result.question,
      type: result.type || "yesno",
    };

    return NextResponse.json({ questions: [question] });
  } catch (error) {
    console.error("Error generating check-in question:", error);
    return NextResponse.json({ questions: [] });
  }
}
