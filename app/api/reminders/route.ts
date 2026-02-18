export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserIdOrCreate() {
  const { userId } = await auth();
  if (!userId) return null;

  const existing = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { clerkUserId: userId },
    select: { id: true },
  });

  return created.id;
}

export async function GET() {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const reminders = await prisma.reminder.findMany({
    where: { userId: dbUserId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, reminders });
}

export async function POST(req: Request) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const title = String(body?.title || "").trim();
  if (!title) {
    return NextResponse.json(
      { ok: false, error: "Title is required" },
      { status: 400 }
    );
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId: dbUserId,
      title,
      notes: body?.notes ? String(body.notes) : null,
      enabled: body?.enabled ?? true,
      schedule: String(body?.schedule || "daily"),
      timeOfDay: body?.timeOfDay ? String(body.timeOfDay) : null,
      daysOfWeek: body?.daysOfWeek ? JSON.stringify(body.daysOfWeek) : null,

      // ✅ new fields
      date: body?.date ? String(body.date) : null,
      location: body?.location ? String(body.location) : null,
    },
  });

  return NextResponse.json({ ok: true, reminder });
}
