import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default async function GuidelinesPage({
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
      courseAiGuidelines: schema.courses.aiGuidelines,
      courseGuidelineUpdatedAt: schema.courses.guidelineUpdatedAt,
      lecturerName: schema.users.name,
      lecturerEmail: schema.users.email,
    })
    .from(schema.courseEnrollments)
    .innerJoin(
      schema.courses,
      eq(schema.courseEnrollments.courseId, schema.courses.id),
    )
    .innerJoin(schema.users, eq(schema.courses.lecturerId, schema.users.id))
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
      aiGuidelines: data.courseAiGuidelines,
      guidelineUpdatedAt: data.courseGuidelineUpdatedAt,
      lecturer: {
        name: data.lecturerName,
        email: data.lecturerEmail,
      },
    },
  };

  const course = enrollment.course;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          AI Usage Guidelines
        </h1>
        <div className="mt-2 flex items-center space-x-2">
          <span className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
            {course.code} - {course.name}
          </span>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Instructor: {course.lecturer.name}
        </p>
      </div>

      {/* Guidelines content */}
      <div className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        {course.aiGuidelines ? (
          <div className="prose max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1
                    className="text-4xl font-bold mb-4 mt-0 text-zinc-900 dark:text-zinc-50"
                    {...props}
                  />
                ),
                h2: ({ node, ...props }) => (
                  <h2
                    className="text-2xl font-bold mb-3 mt-8 text-zinc-900 dark:text-zinc-50"
                    {...props}
                  />
                ),
                h3: ({ node, ...props }) => (
                  <h3
                    className="text-xl font-semibold mb-2 mt-6 text-zinc-900 dark:text-zinc-50"
                    {...props}
                  />
                ),
                p: ({ node, ...props }) => (
                  <p
                    className="mb-4 leading-7 text-zinc-700 dark:text-zinc-300"
                    {...props}
                  />
                ),
                ul: ({ node, ...props }) => (
                  <ul
                    className="list-disc list-inside mb-4 space-y-2 text-zinc-700 dark:text-zinc-300"
                    {...props}
                  />
                ),
                ol: ({ node, ...props }) => (
                  <ol
                    className="list-decimal list-inside mb-4 space-y-2 text-zinc-700 dark:text-zinc-300"
                    {...props}
                  />
                ),
                li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                code: ({ node, inline, ...props }: any) =>
                  inline ? (
                    <code
                      className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono text-zinc-900 dark:text-zinc-100"
                      {...props}
                    />
                  ) : (
                    <code
                      className="block bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 rounded-md overflow-x-auto font-mono text-sm"
                      {...props}
                    />
                  ),
                pre: ({ node, ...props }) => (
                  <pre className="mb-4 mt-4" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong
                    className="font-semibold text-zinc-900 dark:text-zinc-50"
                    {...props}
                  />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote
                    className="border-l-4 border-zinc-300 dark:border-zinc-600 pl-4 italic text-zinc-600 dark:text-zinc-400 my-4"
                    {...props}
                  />
                ),
                a: ({ node, ...props }) => (
                  <a
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    {...props}
                  />
                ),
              }}
            >
              {course.aiGuidelines}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <p>No AI usage guidelines have been set for this course yet.</p>
            <p className="mt-2 text-sm">
              Please contact your instructor for clarification on AI tool usage
              policies.
            </p>
          </div>
        )}
      </div>

      {/* Last updated */}
      {course.guidelineUpdatedAt && (
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          Last updated: {course.guidelineUpdatedAt.toLocaleDateString()}
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <Link
          href={`/courses/${courseId}/feedback`}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Provide Feedback on Guidelines
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Back to Assignments
        </Link>
      </div>
    </div>
  );
}
