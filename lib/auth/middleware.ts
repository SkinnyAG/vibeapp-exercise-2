import { NextRequest, NextResponse } from "next/server";
import { auth } from "./config";
import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/signup", "/"];

// Role-based route prefixes
const studentRoutes = ["/dashboard", "/courses"];
const lecturerRoutes = ["/lecturer"];
const adminRoutes = ["/admin"];

export async function authMiddleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow public routes and API routes
  if (
    publicRoutes.some((route) => pathname === route) ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // Get session from auth - pass the full request
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  // Redirect to login if not authenticated
  if (!session?.user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get full user data including role
  const [user] = await db
    .select({ role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id));

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userRole = user.role;

  if (studentRoutes.some((route) => pathname.startsWith(route))) {
    // Student routes - allow students and higher roles
    if (
      !["STUDENT", "LECTURER", "INSTITUTIONAL_ADMIN", "SYSTEM_ADMIN"].includes(
        userRole,
      )
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (lecturerRoutes.some((route) => pathname.startsWith(route))) {
    // Lecturer routes - only lecturers and admins
    if (
      !["LECTURER", "INSTITUTIONAL_ADMIN", "SYSTEM_ADMIN"].includes(userRole)
    ) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    // Admin routes - only admins
    if (!["INSTITUTIONAL_ADMIN", "SYSTEM_ADMIN"].includes(userRole)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}
