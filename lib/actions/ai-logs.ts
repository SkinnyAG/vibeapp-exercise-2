"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db } from "../db";
import * as schema from "../db/schema";
import { getSession } from "../auth/permissions";
import { aiLogSchema, type AILogInput } from "../validations/ai-log";
import { eq, and } from "drizzle-orm";

export async function createAILog(assignmentId: string, data: AILogInput) {
  // Validate input
  const validationResult = aiLogSchema.safeParse(data);

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
    // Verify the assignment exists
    const [assignment] = await db
      .select()
      .from(schema.assignments)
      .where(eq(schema.assignments.id, assignmentId));

    if (!assignment) {
      return { error: "Assignment not found" };
    }

    // Verify user is enrolled in the course
    const [enrollment] = await db
      .select()
      .from(schema.courseEnrollments)
      .where(
        and(
          eq(schema.courseEnrollments.courseId, assignment.courseId),
          eq(schema.courseEnrollments.userId, session.user.id),
        ),
      );

    if (!enrollment) {
      return { error: "Access denied - not enrolled in course" };
    }

    // Create the AI usage log
    const [log] = await db
      .insert(schema.aiUsageLogs)
      .values({
        userId: session.user.id,
        assignmentId,
        toolName: validationResult.data.toolName,
        purposeDescription: validationResult.data.purposeDescription,
      })
      .returning();

    revalidatePath("/dashboard");

    return { success: true, log };
  } catch (error) {
    console.error("Error creating AI log:", error);
    return { error: "Failed to create AI usage log" };
  }
}
