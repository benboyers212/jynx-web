export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

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

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const reminder = await prisma.reminder.findFirst({
    where: { id, userId: dbUserId },
  });

  if (!reminder) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, reminder });
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.reminder.findFirst({
    where: { id, userId: dbUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  const data: any = {};
  if (body.title !== undefined) data.title = String(body.title);
  if (body.notes !== undefined) data.notes = body.notes === null ? null : String(body.notes);
  if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);
  if (body.schedule !== undefined) data.schedule = String(body.schedule);
  if (body.timeOfDay !== undefined) data.timeOfDay = body.timeOfDay === null ? null : String(body.timeOfDay);
  if (body.date !== undefined) data.date = body.date === null ? null : String(body.date);
  if (body.location !== undefined) data.location = body.location === null ? null : String(body.location);
  if (body.daysOfWeek !== undefined) data.daysOfWeek = body.daysOfWeek === null ? null : String(body.daysOfWeek);

  const reminder = await prisma.reminder.update({
    where: { id },
    data,
  });

  return NextResponse.json({ ok: true, reminder });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const dbUserId = await getDbUserIdOrCreate();
  if (!dbUserId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;

  const existing = await prisma.reminder.findFirst({
    where: { id, userId: dbUserId },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  await prisma.reminder.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
