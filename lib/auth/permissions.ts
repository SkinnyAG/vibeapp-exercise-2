import { auth } from "./config";
import { type Role } from "../db/schema";

export type { Session } from "./config";

/**
 * Get session from request headers (for server components and server actions)
 */
export async function getSession(headers: Headers) {
  return await auth.api.getSession({ headers });
}

/**
 * Check if user has required role
 */
export function hasRole(
  session: { user?: { role?: string } } | null,
  requiredRole: Role,
): boolean {
  if (!session?.user?.role) return false;

  const roleHierarchy: Record<Role, number> = {
    STUDENT: 1,
    LECTURER: 2,
    INSTITUTIONAL_ADMIN: 3,
    SYSTEM_ADMIN: 4,
  };

  const userRoleLevel = roleHierarchy[session.user.role as Role] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
}

/**
 * Get current user from session
 */
export function getCurrentUser(session: { user?: any } | null) {
  return session?.user || null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(session: { user?: any } | null): boolean {
  return !!session?.user;
}
