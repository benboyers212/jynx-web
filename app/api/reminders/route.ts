export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const reminders = await prisma.reminder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, reminders });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
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
      userId,
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
