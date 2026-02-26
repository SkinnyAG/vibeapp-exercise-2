"use server";

import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";

/**
 * Assigns the default institution to a newly registered user
 * and enrolls them in all available courses at that institution.
 * Called after successful signup.
 */
export async function assignDefaultInstitution(userId: string) {
  try {
    // Get the default institution
    const [defaultInstitution] = await db
      .select()
      .from(schema.institutions)
      .where(eq(schema.institutions.domain, "university.edu"))
      .limit(1);

    if (!defaultInstitution) {
      console.error("No default institution found");
      return { success: false, error: "No institution available" };
    }

    // Update the user with the institution
    await db
      .update(schema.users)
      .set({
        institutionId: defaultInstitution.id,
        emailVerified: true,
      })
      .where(eq(schema.users.id, userId));

    // Get all courses at this institution
    const courses = await db
      .select()
      .from(schema.courses)
      .where(eq(schema.courses.institutionId, defaultInstitution.id));

    // Enroll the student in all courses at their institution
    if (courses.length > 0) {
      const enrollments = courses.map((course) => ({
        userId,
        courseId: course.id,
      }));

      await db.insert(schema.courseEnrollments).values(enrollments);

      console.log(`✅ Enrolled user ${userId} in ${courses.length} courses`);
    }

    return { success: true, coursesEnrolled: courses.length };
  } catch (error) {
    console.error("Failed to assign institution:", error);
    return { success: false, error: "Failed to assign institution" };
  }
}
