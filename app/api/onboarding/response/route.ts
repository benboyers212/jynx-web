export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// Generates a plain-text AI profile from the structured survey answers.
// This string is injected directly into AI system prompts as user context.
function buildAiProfile(a: any): string {
  const b = a?.behavioral ?? {};
  const id = a?.identity ?? {};
  const t = a?.timeReality ?? {};
  const ta = a?.taste ?? {};
  const c = a?.context ?? {};

  const structureLabel: Record<string, string> = {
    strong_structure: "strongly prefers structure",
    lean_structure: "leans toward structure",
    neutral: "neutral on structure vs flexibility",
    lean_flexibility: "leans toward flexibility",
    strong_flexibility: "strongly prefers flexibility",
  };

  const freeTimeLabel: Record<string, string> = {
    very_little: "very little (maximize productivity)",
    some: "some",
    balanced: "a healthy balance",
    a_lot: "a lot (protect unscheduled time)",
  };

  const occupationLabel: Record<string, string> = {
    student: "student",
    working_full_time: "working full-time",
    working_part_time: "working part-time",
    between_things: "currently between things",
    other: "other",
  };

  const adjectives: string[] = Array.isArray(id.adjectives) ? id.adjectives : [];
  const activities: string[] = Array.isArray(ta.preferredActivities) ? ta.preferredActivities : [];
  const genres: string[] = Array.isArray(ta.entertainmentGenres) ? ta.entertainmentGenres : [];

  const lines = [
    "## User Profile (onboarding survey)",
    "",
    "**Behavioral traits (scale 1–10):**",
    `- Consistency: ${b.consistency ?? "?"}`,
    `- Motivation: ${b.motivation ?? "?"}`,
    `- Openness to change: ${b.opennessToChange ?? "?"}`,
    `- Follow-through under friction: ${b.followThroughUnderFriction ?? "?"}`,
    `- Structure preference: ${structureLabel[b.structurePreference] ?? b.structurePreference ?? "?"}`,
    "",
    "**Identity:**",
    `- Describes self as: ${adjectives.length > 0 ? adjectives.join(", ") : "not specified"}`,
    "",
    "**Time reality:**",
    `- Sleep: ${t.sleepHours ?? "?"} hours/night`,
    `- Free time desire: ${freeTimeLabel[t.freeTimeDesire] ?? t.freeTimeDesire ?? "?"}`,
    `- Occupation: ${occupationLabel[t.occupation] ?? t.occupation ?? "?"}`,
    "",
    "**Preferences & taste:**",
    `- Enjoys: ${activities.length > 0 ? activities.join(", ") : "not specified"}`,
    `- Entertainment: ${genres.length > 0 ? genres.join(", ") : "not specified"}`,
    "",
    "**Context:**",
    `- Age range: ${c.ageRange ?? "?"}`,
    ...(c.location ? [`- Location: ${c.location}`] : []),
  ];

  return lines.join("\n");
}

// GET /api/onboarding/response -> fetch current answers
export async function GET() {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  const record = await prisma.onboardingResponse.findUnique({
    where: { userId: dbUser.id },
    select: { answers: true },
  });

  return NextResponse.json({ ok: true, answers: record?.answers ?? {} });
}

// POST /api/onboarding/response -> upsert survey answers + mark complete
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const rawAnswers = body?.answers;
  if (rawAnswers == null || typeof rawAnswers !== "object") {
    return jsonError("answers must be an object", 400);
  }

  // Augment with AI-ready profile text — AI uses this as system context
  const answers = {
    ...rawAnswers,
    aiProfile: buildAiProfile(rawAnswers),
  };

  await prisma.onboardingResponse.upsert({
    where: { userId: dbUser.id },
    update: { answers },
    create: { userId: dbUser.id, answers },
  });

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({ ok: true });
}
