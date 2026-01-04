export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// DELETE /api/medications/:id -> delete a med (must belong to logged-in user)
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  const { id } = await ctx.params;
  const medId = String(id || "").trim();
  if (!medId) return jsonError("Missing medication id", 400);

  const existing = await prisma.medication.findFirst({
    where: { id: medId, userId: dbUser.id },
    select: { id: true },
  });
  if (!existing) return jsonError("Medication not found", 404);

  await prisma.medication.delete({
    where: { id: medId },
  });

  return NextResponse.json({ ok: true });
}
