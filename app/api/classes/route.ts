export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { clerkUserId: userId }, select: { id: true } });
  return user?.id ?? null;
}

// GET /api/classes — list all ClassHubs for the current user
export async function GET() {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const hubs = await prisma.classHub.findMany({
    where: { userId: dbUserId },
    include: {
      tasks: { where: { completed: false }, orderBy: { dueDate: "asc" }, take: 10 },
      notes: { orderBy: { updatedAt: "desc" }, take: 5 },
      files: { orderBy: { createdAt: "desc" }, take: 5 },
      events: { orderBy: { startAt: "asc" }, take: 10 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: hubs });
}

// POST /api/classes — create a ClassHub
export async function POST(req: NextRequest) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const name = String(body?.name || "").trim();
  if (!name) return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });

  const hub = await prisma.classHub.create({
    data: {
      userId: dbUserId,
      name,
      courseCode: body?.courseCode ? String(body.courseCode) : null,
      instructor: body?.instructor ? String(body.instructor) : null,
      department: body?.department ? String(body.department) : null,
      semester: body?.semester ? String(body.semester) : null,
      description: body?.description ? String(body.description) : null,
    },
  });

  return NextResponse.json({ success: true, data: hub }, { status: 201 });
}
