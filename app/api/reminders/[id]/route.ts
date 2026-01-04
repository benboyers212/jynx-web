import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;

  const existing = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  await prisma.reminder.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  const body = await req.json();

  const existing = await prisma.reminder.findFirst({ where: { id, userId } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.reminder.update({
    where: { id },
    data: {
      title: body?.title !== undefined ? String(body.title).trim() : undefined,
      notes: body?.notes !== undefined ? (body.notes ? String(body.notes) : null) : undefined,
      enabled: body?.enabled !== undefined ? Boolean(body.enabled) : undefined,
      schedule: body?.schedule !== undefined ? String(body.schedule) : undefined,
      timeOfDay:
        body?.timeOfDay !== undefined ? (body.timeOfDay ? String(body.timeOfDay) : null) : undefined,
      daysOfWeek:
        body?.daysOfWeek !== undefined ? (body.daysOfWeek ? JSON.stringify(body.daysOfWeek) : null) : undefined,
    },
  });

  return NextResponse.json({ ok: true, reminder: updated });
}
