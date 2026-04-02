import { submitFeedback } from "../../lib/actions/feedback";
import { db } from "../../lib/db";
import { getSession } from "../../lib/auth/permissions";
import { revalidatePath } from "next/cache";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue({}) }));
jest.mock("../../lib/auth/permissions", () => ({ getSession: jest.fn() }));

jest.mock("../../lib/db", () => {
  const mDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };
  return { db: mDb };
});

jest.mock("drizzle-orm", () => ({
  ...jest.requireActual("drizzle-orm"),
  eq: jest.fn(),
  and: jest.fn(),
}));

describe("submitFeedback action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validData = {
    feedbackText: "This feedback is sufficiently long.",
    isAnonymous: true,
  };
  const courseId = "course-123";

  it("should fail validation if data is invalid", async () => {
    const invalidData = { feedbackText: "short", isAnonymous: true };
    const result = await submitFeedback(courseId, invalidData);

    expect(result).toHaveProperty("error");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("should fail if unauthorized (no session)", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce(null);

    const result = await submitFeedback(courseId, validData);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should fail if user is not enrolled / course not found", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    (db.where as jest.Mock).mockResolvedValueOnce([]); // Enrollment not found

    const result = await submitFeedback(courseId, validData);

    expect(result).toEqual({ error: "Course not found or access denied" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should create feedback on successful validation and enrollment", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    
    (db.where as jest.Mock).mockResolvedValueOnce([{ id: "enroll-1" }]); // Enrollment found
    (db.returning as jest.Mock).mockResolvedValueOnce([{ id: "feedback-1" }]); // Insert returns feedback

    const result = await submitFeedback(courseId, validData);

    expect(db.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith(`/courses/${courseId}/feedback`);
    expect(result).toEqual({ success: true, feedbackId: "feedback-1" });
  });

  it("should handle error gracefully during database operations", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    
    (db.select as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Database crashed");
    });

    const result = await submitFeedback(courseId, validData);

    expect(result).toEqual({ error: "Failed to submit feedback" });
  });
});
