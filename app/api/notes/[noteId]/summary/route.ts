import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type RouteContext = {
  params: Promise<{ noteId: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { noteId } = await context.params;

    // Fetch the note
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    });

    if (!note) {
      return NextResponse.json({ ok: false, error: "Note not found" }, { status: 404 });
    }

    // Strip HTML tags for cleaner analysis (simple approach)
    const plainTextContent = note.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Generate summary using Claude
    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Please provide a concise summary and key insights from the following note:

Title: ${note.title || "Untitled"}

Content:
${plainTextContent}

Provide:
1. A brief summary (2-3 sentences)
2. Key points or takeaways (bullet points)
3. Any important dates, tasks, or action items mentioned

Keep the response clear and actionable.`,
        },
      ],
    });

    const summaryText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n\n");

    return NextResponse.json({ ok: true, summary: summaryText });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}
