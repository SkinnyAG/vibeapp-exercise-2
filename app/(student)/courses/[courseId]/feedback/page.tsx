import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { FeedbackForm } from "@/components/forms/feedback-form";
import Link from "next/link";

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getSession(await headers());

  if (!session?.user) {
    redirect("/login");
  }

  // Verify student is enrolled in the course
  const result = await db
    .select({
      enrollmentId: schema.courseEnrollments.id,
      enrollmentUserId: schema.courseEnrollments.userId,
      enrollmentCourseId: schema.courseEnrollments.courseId,
      enrollmentEnrolledAt: schema.courseEnrollments.enrolledAt,
      courseId: schema.courses.id,
      courseCode: schema.courses.code,
      courseName: schema.courses.name,
    })
    .from(schema.courseEnrollments)
    .innerJoin(
      schema.courses,
      eq(schema.courseEnrollments.courseId, schema.courses.id),
    )
    .where(
      and(
        eq(schema.courseEnrollments.userId, session.user.id),
        eq(schema.courseEnrollments.courseId, courseId),
      ),
    );

  const [data] = result;

  if (!data) {
    notFound();
  }

  const enrollment = {
    id: data.enrollmentId,
    userId: data.enrollmentUserId,
    courseId: data.enrollmentCourseId,
    enrolledAt: data.enrollmentEnrolledAt,
    course: {
      id: data.courseId,
      code: data.courseCode,
      name: data.courseName,
    },
  };

  const course = enrollment.course;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href={`/courses/${courseId}/guidelines`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Guidelines
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Provide Feedback on AI Guidelines
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Help improve the course by sharing your feedback on the AI usage
          guidelines.
        </p>
      </div>

      {/* Form */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <FeedbackForm
          courseId={courseId}
          courseName={`${course.code} - ${course.name}`}
        />
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
        <div className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Note:</strong> Your feedback will be reviewed by the course
          instructor to help improve the AI usage guidelines. While there is
          currently no direct response mechanism, your input is valuable for
          continuous course improvement.
        </div>
      </div>
    </div>
  );
}
