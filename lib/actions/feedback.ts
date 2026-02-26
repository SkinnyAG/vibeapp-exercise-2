"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "../db";
import * as schema from "../db/schema";
import { getSession } from "../auth/permissions";
import { feedbackSchema, type FeedbackInput } from "../validations/feedback";
import { eq, and } from "drizzle-orm";

export async function submitFeedback(courseId: string, data: FeedbackInput) {
  // Validate input
  const validationResult = feedbackSchema.safeParse(data);

  if (!validationResult.success) {
    return {
      error: validationResult.error.issues[0].message,
    };
  }

  // Get session
  const session = await getSession(await headers());

  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify the course exists and user is enrolled
    const [enrollment] = await db
      .select()
      .from(schema.courseEnrollments)
      .where(
        and(
          eq(schema.courseEnrollments.userId, session.user.id),
          eq(schema.courseEnrollments.courseId, courseId),
        ),
      );

    if (!enrollment) {
      return { error: "Course not found or access denied" };
    }

    // Create the feedback
    const [feedback] = await db
      .insert(schema.guidelineFeedbacks)
      .values({
        userId: session.user.id,
        courseId,
        feedbackText: validationResult.data.feedbackText,
        isAnonymous: validationResult.data.isAnonymous,
      })
      .returning();

    // Revalidate the feedback page
    revalidatePath(`/courses/${courseId}/feedback`);

    return { success: true, feedbackId: feedback.id };
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return { error: "Failed to submit feedback" };
  }
}
