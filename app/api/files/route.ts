export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
  return user?.id ?? null;
}

// GET /api/files
// Query params: eventId, classHubId, groupId, type, pinned
export async function GET(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const classHubId = searchParams.get("classHubId");
  const groupId = searchParams.get("groupId");
  const type = searchParams.get("type");
  const pinnedParam = searchParams.get("pinned");

  const where: any = { userId: dbUserId };
  if (eventId) where.eventId = eventId;
  if (classHubId) where.classHubId = classHubId;
  if (groupId) where.groupId = groupId;
  if (type) where.type = type;
  if (pinnedParam !== null) where.pinned = pinnedParam === "true";

  const files = await prisma.file.findMany({
    where,
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      noteContent: { select: { id: true, title: true, content: true } },
      event: { select: { id: true, title: true, eventType: true } },
      classHub: { select: { id: true, name: true, courseCode: true } },
      group: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ success: true, data: files });
}

// POST /api/files
export async function POST(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const name = String(body?.name || "").trim();
  if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

  const type = String(body?.type || "link");

  const file = await prisma.file.create({
    data: {
      userId: dbUserId,
      name,
      type,
      url: body?.url ? String(body.url) : null,
      size: body?.size ? Number(body.size) : null,
      category: body?.category ? String(body.category) : null,
      eventId: body?.eventId || null,
      classHubId: body?.classHubId || null,
      workoutHubId: body?.workoutHubId || null,
      groupId: body?.groupId || null,
      pinned: Boolean(body?.pinned ?? false),
      notes: body?.notes ? String(body.notes) : null,
    },
    include: {
      event: { select: { id: true, title: true, eventType: true } },
    },
  });

  return NextResponse.json({ success: true, data: file }, { status: 201 });
}
