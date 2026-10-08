import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerUserRole } from "@/lib/serverRoleAuth";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey =
  !publishableKey ||
  publishableKey.includes("ZXhhbXBsZS") ||
  publishableKey.includes("example") ||
  !publishableKey.startsWith("pk_");

const isTeacherRoute = createRouteMatcher([
  "/teacher",
  "/teacher/(.*)",
]);

const isStudentRoute = createRouteMatcher([
  "/student",
  "/student/(.*)",
]);

const isTeacherApi = createRouteMatcher([
  "/api/teacher/(.*)",
  "/api/teacher",
]);

const isRoleSelectRoute = createRouteMatcher([
  "/role-select",
  "/role-select/(.*)",
]);

const isAuthRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default isPlaceholderKey
  ? function middleware() {
      return NextResponse.next();
    }
  : clerkMiddleware(async (auth, request) => {
      const { userId } = await auth();
      const pathname = request.nextUrl.pathname;

      // 1. Protect Teacher APIs server-side
      if (isTeacherApi(request)) {
        if (!userId) {
          return NextResponse.json(
            { error: "Unauthorized: Sign in required" },
            { status: 401 }
          );
        }
        const userDoc = await getServerUserRole(userId);
        const role = userDoc?.role;
        if (!role || (role !== "teacher" && role !== "admin")) {
          return NextResponse.json(
            { error: "Forbidden: Teacher privileges required" },
            { status: 403 }
          );
        }
        return NextResponse.next();
      }

      // 2. Unauthenticated user handling for protected pages
      if (!userId) {
        if (isTeacherRoute(request) || isStudentRoute(request) || isRoleSelectRoute(request)) {
          const signInUrl = new URL("/sign-in", request.url);
          signInUrl.searchParams.set("redirect_url", request.url);
          return NextResponse.redirect(signInUrl);
        }
        return NextResponse.next();
      }

      // 3. User is authenticated with Clerk - fetch their source-of-truth role from user_roles
      const userDoc = await getServerUserRole(userId);
      const role = userDoc?.role || "unassigned";

      // 4. If visiting root "/" or auth pages while logged in: redirect to their role dashboard
      if (pathname === "/" || isAuthRoute(request)) {
        if (role === "student") {
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "teacher" || role === "admin") {
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        if (role === "unassigned") {
          return NextResponse.redirect(new URL("/role-select", request.url));
        }
      }

      // 5. If user is visiting /role-select but already has an assigned role: redirect to their dashboard
      if (isRoleSelectRoute(request)) {
        if (role === "student") {
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "teacher" || role === "admin") {
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        return NextResponse.next();
      }

      // 6. Protect Teacher routes (/teacher/*)
      if (isTeacherRoute(request)) {
        if (role === "student") {
          // Reject student attempting to access teacher routes and redirect to student dashboard
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "unassigned") {
          return NextResponse.redirect(new URL("/role-select", request.url));
        }
        if (role === "teacher" || role === "admin") {
          return NextResponse.next();
        }
        // Fallback safety
        return NextResponse.redirect(new URL("/student/dashboard", request.url));
      }

      // 7. Protect Student routes (/student/*)
      if (isStudentRoute(request)) {
        if (role === "teacher") {
          // Redirect teacher to teacher dashboard
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        if (role === "unassigned") {
          return NextResponse.redirect(new URL("/role-select", request.url));
        }
        if (role === "student" || role === "admin") {
          return NextResponse.next();
        }
        // Fallback safety
        return NextResponse.redirect(new URL("/role-select", request.url));
      }

      return NextResponse.next();
    });

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
