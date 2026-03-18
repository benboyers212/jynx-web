export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isValidTimezone } from "@/lib/timezones";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// POST /api/me/timezone - Update user's timezone
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found", 404);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const timezone = body?.timezone;
  if (!timezone || typeof timezone !== "string") {
    return jsonError("timezone must be a string", 400);
  }

  if (!isValidTimezone(timezone)) {
    return jsonError("Invalid timezone", 400);
  }

  await prisma.user.update({
    where: { id: dbUser.id },
    data: { timezone },
  });

  return NextResponse.json({ ok: true, timezone });
}
