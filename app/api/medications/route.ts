import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// GET /api/medications -> list meds for logged-in user
export async function GET() {
  const { userId } = await auth();
  if (!userId) return jsonError("Unauthorized", 401);

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });
  if (!dbUser) return jsonError("User not found in DB", 404);

  const meds = await prisma.medication.findMany({
    where: { userId: dbUser.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, meds });
}

// POST /api/medications -> create a med for logged-in user
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

  const name = String(body?.name ?? "").trim();
  if (!name) return jsonError("Medication name is required", 400);

  const dosage = body?.dosage != null ? String(body.dosage).trim() : null;
  const recurrence =
    body?.recurrence != null ? String(body.recurrence).trim() : "Daily";
  const times = body?.times != null ? String(body.times).trim() : null;
  const pharmacy = body?.pharmacy != null ? String(body.pharmacy).trim() : null;

  const qty =
    body?.qty === "" || body?.qty == null
      ? null
      : Number.isFinite(Number(body.qty))
      ? Number(body.qty)
      : null;

  const refills =
    body?.refills === "" || body?.refills == null
      ? null
      : Number.isFinite(Number(body.refills))
      ? Number(body.refills)
      : null;

  const notes = body?.notes != null ? String(body.notes).trim() : null;

  const med = await prisma.medication.create({
    data: {
      userId: dbUser.id,
      name,
      dosage: dosage || null,
      recurrence: recurrence || "Daily",
      times: times || null,
      pharmacy: pharmacy || null,
      qty,
      refills,
      notes: notes || null,
    },
  });

  return NextResponse.json({ ok: true, med }, { status: 201 });
}
