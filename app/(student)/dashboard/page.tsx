import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's enrolled courses with assignments
  const enrollments = await db
    .select({
      id: schema.courseEnrollments.id,
      courseId: schema.courses.id,
      courseName: schema.courses.name,
      courseCode: schema.courses.code,
    })
    .from(schema.courseEnrollments)
    .innerJoin(
      schema.courses,
      eq(schema.courseEnrollments.courseId, schema.courses.id),
    )
    .where(eq(schema.courseEnrollments.userId, session.user.id));

  // Get all assignments for enrolled courses
  const courseIds = enrollments.map((e) => e.courseId);

  const assignments =
    courseIds.length > 0
      ? await db
          .select()
          .from(schema.assignments)
          .where(
            eq(
              schema.assignments.courseId,
              courseIds.length === 1
                ? courseIds[0]
                : schema.assignments.courseId,
            ),
          )
          .orderBy(schema.assignments.dueDate)
      : [];

  // Get AI usage logs for these assignments
  const assignmentIds = assignments.map((a) => a.id);
  const userLogs =
    assignmentIds.length > 0
      ? await db
          .select()
          .from(schema.aiUsageLogs)
          .where(
            and(
              eq(schema.aiUsageLogs.userId, session.user.id),
              assignmentIds.length === 1
                ? eq(schema.aiUsageLogs.assignmentId, assignmentIds[0])
                : eq(
                    schema.aiUsageLogs.assignmentId,
                    schema.aiUsageLogs.assignmentId,
                  ),
            ),
          )
      : [];

  // Combine data
  const allAssignments = assignments.map((assignment) => {
    const enrollment = enrollments.find(
      (e) => e.courseId === assignment.courseId,
    );
    const logs = userLogs.filter((log) => log.assignmentId === assignment.id);

    return {
      ...assignment,
      courseName: enrollment?.courseName || "",
      courseCode: enrollment?.courseCode || "",
      aiUsageLogs: logs,
    };
  });

  // Get total AI usage logs count
  const [totalLogsResult] = await db
    .select({ count: count() })
    .from(schema.aiUsageLogs)
    .where(eq(schema.aiUsageLogs.userId, session.user.id));

  const totalLogs = totalLogsResult.count;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Track your assignments and AI usage logs
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Courses
          </div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {enrollments.length}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Total Assignments
          </div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {allAssignments.length}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            AI Usage Logs
          </div>
          <div className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            {totalLogs}
          </div>
        </div>
      </div>

      {/* Assignments list */}
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Your Assignments
        </h2>
        <div className="mt-4 space-y-4">
          {allAssignments.length === 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-zinc-500 dark:text-zinc-400">
                No assignments found. Enroll in a course to get started.
              </p>
            </div>
          ) : (
            allAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {assignment.name}
                      </h3>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {assignment.courseCode}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {assignment.courseName}
                    </p>
                    {assignment.description && (
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {assignment.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center space-x-4 text-sm">
                      <div className="flex items-center text-zinc-500 dark:text-zinc-400">
                        <span>
                          Due:{" "}
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-zinc-500 dark:text-zinc-400">
                        <span>
                          {assignment.aiUsageLogs.length}{" "}
                          {assignment.aiUsageLogs.length === 1 ? "log" : "logs"}{" "}
                          submitted
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex space-x-2">
                    <Link
                      href={`/courses/${assignment.courseId}/assignments/${assignment.id}/logs/new`}
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      Log AI Usage
                    </Link>
                    <Link
                      href={`/courses/${assignment.courseId}/guidelines`}
                      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      View Guidelines
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
