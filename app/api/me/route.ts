import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ensureUserRecord } from "@/lib/ensureUser";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await ensureUserRecord();
  return NextResponse.json({ ok: true, userId, dbUser });
}
