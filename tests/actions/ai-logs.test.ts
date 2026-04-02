import { createAILog } from "../../lib/actions/ai-logs";
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

describe("createAILog action", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validData = {
    toolName: "Copilot",
    purposeDescription: "Valid description here",
  };
  const assignmentId = "assign-1";

  it("should fail validation if data is invalid", async () => {
    const invalidData = { toolName: "", purposeDescription: "" };
    const result = await createAILog(assignmentId, invalidData);

    expect(result).toHaveProperty("error");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("should fail if unauthorized (no session)", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce(null);

    const result = await createAILog(assignmentId, validData);

    expect(result).toEqual({ error: "Unauthorized" });
  });

  it("should fail if assignment is not found", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    (db.where as jest.Mock).mockResolvedValueOnce([]); // Assignment not found

    const result = await createAILog(assignmentId, validData);

    expect(result).toEqual({ error: "Assignment not found" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should fail if user is not enrolled in the course", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    
    (db.where as jest.Mock)
      .mockResolvedValueOnce([{ id: "assign-1", courseId: "course-123" }]) // Assignment found
      .mockResolvedValueOnce([]); // Enrollment not found

    const result = await createAILog(assignmentId, validData);

    expect(result).toEqual({ error: "Access denied - not enrolled in course" });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should create AI log on successful validation and enrollment", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    
    (db.where as jest.Mock)
      .mockResolvedValueOnce([{ id: "assign-1", courseId: "course-123" }]) // Assignment
      .mockResolvedValueOnce([{ id: "enroll-1" }]); // Enrollment returns truthy

    const logOutput = { id: "log-1", ...validData };
    (db.returning as jest.Mock).mockResolvedValueOnce([logOutput]); // Insert return

    const result = await createAILog(assignmentId, validData);

    expect(db.insert).toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/dashboard");
    expect(result).toEqual({ success: true, log: logOutput });
  });

  it("should handle error gracefully during database operations", async () => {
    (getSession as jest.Mock).mockResolvedValueOnce({ user: { id: "user-123" } });
    
    (db.select as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Database crashed");
    });

    const result = await createAILog(assignmentId, validData);

    expect(result).toEqual({ error: "Failed to create AI usage log" });
  });
});
