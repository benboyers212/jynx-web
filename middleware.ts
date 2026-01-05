import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/login(.*)",
  "/signup(.*)",
  "/",
]);

const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // 1) Public pages are always allowed
  if (isPublicRoute(req)) return NextResponse.next();

  const { userId } = await auth();

  // 2) Not signed in → redirect (or 401 for API)
  if (!userId) {
    if (isApiRoute(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // 3) Signed in: allow API routes (IMPORTANT so middleware can call /api/me safely)
  if (isApiRoute(req)) return NextResponse.next();

  // 4) Signed in: allow onboarding pages (no redirect loop)
  if (isOnboardingRoute(req)) return NextResponse.next();

  // 5) Signed in: check onboardingCompleted via /api/me
  try {
    const meUrl = new URL("/api/me", req.url);
    const res = await fetch(meUrl, {
      method: "GET",
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
    });

    if (!res.ok) return NextResponse.next();

    const data = await res.json().catch(() => null);
    const completed = Boolean(data?.dbUser?.onboardingCompleted);

    if (!completed) {
      const url = new URL("/onboarding", req.url);
      url.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  } catch {
    // If anything fails, don't brick the app — just allow.
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
