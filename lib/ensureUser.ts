import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function ensureUserRecord() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const cu = await currentUser();

  const primaryEmail =
    cu?.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress ??
    null;

  const fullName =
    cu?.firstName || cu?.lastName
      ? `${cu?.firstName ?? ""} ${cu?.lastName ?? ""}`.trim()
      : null;

  const dbUser = await prisma.user.upsert({
    where: { clerkUserId: userId },
    update: { email: primaryEmail, name: fullName },
    create: { clerkUserId: userId, email: primaryEmail, name: fullName },
  });

  return dbUser;
}
