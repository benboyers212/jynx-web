import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.update({
    where: { clerkUserId: userId },
    data: { onboardingCompleted: true },
  });

  return NextResponse.json({
    ok: true,
    onboardingCompleted: dbUser.onboardingCompleted,
  });
}
