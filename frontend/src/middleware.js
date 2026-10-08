import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getServerUserRole } from "@/lib/serverRoleAuth";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
const isPlaceholderKey =
  !publishableKey ||
  publishableKey.includes("ZXhhbXBsZS") ||
  publishableKey.includes("example") ||
  !publishableKey.startsWith("pk_");

const isPrincipalRoute = createRouteMatcher([
  "/principal",
  "/principal/(.*)",
]);

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

      // 1. Protect Teacher & Executive APIs server-side
      if (isTeacherApi(request)) {
        if (!userId) {
          return NextResponse.json(
            { error: "Unauthorized: Sign in required" },
            { status: 401 }
          );
        }
        const userDoc = await getServerUserRole(userId);
        const role = userDoc?.role;
        const allowedRoles = ["teacher", "admin", "principal", "higher_body"];
        if (!role || !allowedRoles.includes(role)) {
          return NextResponse.json(
            { error: "Forbidden: Faculty or executive privileges required" },
            { status: 403 }
          );
        }
        return NextResponse.next();
      }

      // 2. Unauthenticated user handling for protected pages
      if (!userId) {
        if (
          isPrincipalRoute(request) ||
          isTeacherRoute(request) ||
          isStudentRoute(request) ||
          isRoleSelectRoute(request)
        ) {
          const signInUrl = new URL("/sign-in", request.url);
          signInUrl.searchParams.set("redirect_url", request.url);
          return NextResponse.redirect(signInUrl);
        }
        return NextResponse.next();
      }

      // 3. User is authenticated with Clerk - fetch their source-of-truth role from user_roles
      let userDoc = await getServerUserRole(userId);
      let role = userDoc?.role || "unassigned";

      // If database returned unassigned, check for immediate client cookie and try a force-fresh fetch
      const cookieRole = request.cookies.get("gyan_user_role")?.value;
      if (role === "unassigned" && cookieRole && cookieRole !== "unassigned") {
        userDoc = await getServerUserRole(userId, { forceFresh: true });
        role = userDoc?.role || cookieRole;
      }

      // 4. If visiting root "/" or auth pages while logged in: redirect to their role dashboard
      if (pathname === "/" || isAuthRoute(request)) {
        if (role === "student") {
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "teacher") {
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        if (["principal", "higher_body", "admin"].includes(role)) {
          return NextResponse.redirect(new URL("/principal", request.url));
        }
        if (role === "unassigned") {
          return NextResponse.redirect(new URL("/role-select", request.url));
        }
      }

      // 5. If user is visiting /role-select but already has an assigned role: redirect to their dashboard
      if (isRoleSelectRoute(request)) {
        if (
          request.nextUrl.searchParams.get("edit") === "true" ||
          request.nextUrl.searchParams.get("change") === "true"
        ) {
          return NextResponse.next();
        }
        if (role === "student") {
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "teacher") {
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        if (["principal", "higher_body", "admin"].includes(role)) {
          return NextResponse.redirect(new URL("/principal", request.url));
        }
        return NextResponse.next();
      }

      // 6. Protect Principal & Executive routes (/principal/*)
      if (isPrincipalRoute(request)) {
        if (role === "student") {
          // Block students from accessing principal routes
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "teacher") {
          // Block teachers from accessing exclusive principal command center
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        if (role === "unassigned") {
          return NextResponse.redirect(new URL("/role-select", request.url));
        }
        if (["principal", "higher_body", "admin"].includes(role)) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/student/dashboard", request.url));
      }

      // 7. Protect Teacher routes (/teacher/*)
      if (isTeacherRoute(request)) {
        if (role === "student") {
          // Reject student attempting to access teacher routes and redirect to student dashboard
          return NextResponse.redirect(new URL("/student/dashboard", request.url));
        }
        if (role === "unassigned") {
          return NextResponse.redirect(new URL("/role-select", request.url));
        }
        if (["teacher", "principal", "higher_body", "admin"].includes(role)) {
          return NextResponse.next();
        }
        // Fallback safety
        return NextResponse.redirect(new URL("/student/dashboard", request.url));
      }

      // 8. Protect Student routes (/student/*)
      if (isStudentRoute(request)) {
        if (role === "teacher") {
          return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
        }
        if (["principal", "higher_body"].includes(role)) {
          return NextResponse.redirect(new URL("/principal", request.url));
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
