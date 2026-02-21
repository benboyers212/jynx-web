import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkUserId } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const { id: eventId } = await context.params;

    // Verify event exists and belongs to user
    const event = await prisma.scheduleBlock.findFirst({
      where: { id: eventId, userId: user.id },
    });

    if (!event) {
      return NextResponse.json({ ok: false, error: "Event not found" }, { status: 404 });
    }

    // Parse request body
    const body = await req.json();
    const { variance, actualDuration, notes } = body as {
      variance: "just_right" | "shorter" | "longer";
      actualDuration?: number;
      notes?: string;
    };

    // Validate variance
    if (!["just_right", "shorter", "longer"].includes(variance)) {
      return NextResponse.json({ ok: false, error: "Invalid variance" }, { status: 400 });
    }

    // Calculate scheduled duration
    const scheduledDuration = Math.round(
      (new Date(event.endAt).getTime() - new Date(event.startAt).getTime()) / (1000 * 60)
    );

    // Determine actual duration
    let finalActualDuration: number;
    if (variance === "just_right") {
      finalActualDuration = scheduledDuration;
    } else {
      if (!actualDuration || actualDuration <= 0) {
        return NextResponse.json(
          { ok: false, error: "actualDuration required when variance is not just_right" },
          { status: 400 }
        );
      }
      finalActualDuration = actualDuration;
    }

    // Create completion record
    const completion = await prisma.eventCompletion.create({
      data: {
        eventId: event.id,
        userId: user.id,
        scheduledDuration,
        actualDuration: finalActualDuration,
        variance,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ ok: true, completion });
  } catch (error) {
    console.error("Error marking event complete:", error);
    return NextResponse.json(
      { ok: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
