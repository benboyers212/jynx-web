export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
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

  const answers = body?.answers;
  if (answers == null || typeof answers !== "object") {
    return jsonError("answers must be an object", 400);
  }

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
