import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { AILogForm } from "@/components/forms/ai-log-form";
import Link from "next/link";

export default async function NewAILogPage({
  params,
}: {
  params: Promise<{ courseId: string; assignmentId: string }>;
}) {
  const { courseId, assignmentId } = await params;
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect("/login");
  }

  // Verify student is enrolled and get assignment details
  const result = await db
    .select({
      assignmentId: schema.assignments.id,
      assignmentName: schema.assignments.name,
      assignmentCourseId: schema.assignments.courseId,
      courseId: schema.courses.id,
      courseCode: schema.courses.code,
      courseName: schema.courses.name,
      enrollmentId: schema.courseEnrollments.id,
    })
    .from(schema.assignments)
    .innerJoin(
      schema.courses,
      eq(schema.assignments.courseId, schema.courses.id),
    )
    .leftJoin(
      schema.courseEnrollments,
      and(
        eq(schema.courseEnrollments.courseId, schema.courses.id),
        eq(schema.courseEnrollments.userId, session.user.id),
      ),
    )
    .where(eq(schema.assignments.id, assignmentId));

  const [data] = result;

  if (!data || !data.enrollmentId || data.assignmentCourseId !== courseId) {
    notFound();
  }

  const assignment = {
    id: data.assignmentId,
    name: data.assignmentName,
    courseId: data.assignmentCourseId,
    course: {
      id: data.courseId,
      code: data.courseCode,
      name: data.courseName,
    },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Log AI Usage
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Document how you used AI tools for this assignment in compliance with
          course guidelines.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <AILogForm
          assignmentId={assignmentId}
          assignmentName={assignment.name}
          courseName={`${assignment.course.code} - ${assignment.course.name}`}
        />
      </div>

      {/* Guidelines reminder */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
        <div className="flex">
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <strong>Reminder:</strong> Make sure your AI usage complies with the{" "}
            <Link
              href={`/courses/${courseId}/guidelines`}
              className="font-medium underline hover:no-underline"
            >
              course AI guidelines
            </Link>
            . Improper use of AI tools may violate academic integrity policies.
          </div>
        </div>
      </div>
    </div>
  );
}
