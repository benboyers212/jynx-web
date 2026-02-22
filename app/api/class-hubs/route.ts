export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

async function getDbUserId() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  return user?.id ?? null;
}

// GET /api/class-hubs - List all user's class hubs
export async function GET(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const classHubs = await prisma.classHub.findMany({
    where: { userId: dbUserId },
    include: {
      files: { select: { id: true } },
      notes: { select: { id: true } },
      tasks: { select: { id: true } },
      events: { select: { id: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, data: classHubs });
}

// POST /api/class-hubs - Create a new class hub
export async function POST(req: Request) {
  const dbUserId = await getDbUserId();
  if (!dbUserId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const name = String(body?.name || "").trim();
  if (!name) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  const classHub = await prisma.classHub.create({
    data: {
      userId: dbUserId,
      name,
      courseCode: body?.courseCode ? String(body.courseCode) : null,
      category: body?.category ? String(body.category) : null,
      instructor: body?.instructor ? String(body.instructor) : null,
      department: body?.department ? String(body.department) : null,
      semester: body?.semester ? String(body.semester) : null,
      description: body?.description ? String(body.description) : null,
    },
  });

  return NextResponse.json({ success: true, data: classHub }, { status: 201 });
}
