import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { id: noteId } = await context.params;

    // Fetch the note
    const note = await prisma.note.findFirst({
      where: { id: noteId, userId: user.id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Strip HTML tags for cleaner analysis (simple approach)
    const plainTextContent = note.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Generate summary using Claude
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Format this note using strict Markdown structure.

Title: ${note.title || "Untitled"}
Content: ${plainTextContent}

Do NOT rewrite, paraphrase, expand, or shorten the content.
You are ONLY formatting the content using strict Markdown structure.

REQUIRED FORMAT:

Use level-2 markdown headers (##) for sections:
## What You Wrote
## AI Insight

Headers must be on their own line.
There must be one blank line after each header.
Content under each section must be formatted as bullet points using - (dash + space).
Each bullet must be on its own line.
No inline sentences after headers.
No merged text.
No paragraphs longer than one line.

STRUCTURE:

## What You Wrote
- Direct reflection of the user's note content
- Concise, 1-2 lines maximum

## AI Insight
- Brief AI clarification or expansion on the topic
- Max 1-2 lines per bullet
- No long text blocks

CONSTRAINTS:
- Do NOT merge sections
- Do NOT output a single paragraph
- Do NOT combine sections into a single sentence
- Do NOT add commentary or explanation

This is a formatting task only. Return only the formatted markdown.`,
        },
      ],
    });

    const summaryText = message.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n\n");

    return NextResponse.json({ summary: summaryText });
  } catch (error) {
    console.error("Error generating summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate summary";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
