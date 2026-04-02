import { assignDefaultInstitution } from "../../lib/actions/onboarding";
import { db } from "../../lib/db";
import { eq } from "drizzle-orm"; // just real import

jest.mock("../../lib/db", () => {
  const mDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn(),
    limit: jest.fn(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn(),
  };
  return { db: mDb };
});

describe("assignDefaultInstitution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const userId = "user-123";

  it("should fail when default institution is not found", async () => {
    (db.where as jest.Mock).mockReturnValueOnce({ limit: db.limit });
    (db.limit as jest.Mock).mockResolvedValueOnce([]);

    const result = await assignDefaultInstitution(userId);

    expect(result).toEqual({ success: false, error: "No institution available" });
    expect(db.update).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should assign institution but not enroll if no courses exist", async () => {
    const institution = { id: "inst-123", domain: "university.edu" };
    
    (db.where as jest.Mock)
      .mockReturnValueOnce({ limit: db.limit }) // 1. for finding institution
      .mockResolvedValueOnce([])                // 2. for updating user
      .mockResolvedValueOnce([]);               // 3. for finding courses

    (db.limit as jest.Mock).mockResolvedValueOnce([institution]);
    
    const result = await assignDefaultInstitution(userId);

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, coursesEnrolled: 0 });
  });

  it("should assign institution and enroll user in available courses", async () => {
    const institution = { id: "inst-123" };
    const courses = [{ id: "c-1" }, { id: "c-2" }];

    (db.where as jest.Mock)
      .mockReturnValueOnce({ limit: db.limit }) // 1. for finding institution
      .mockResolvedValueOnce([])                // 2. for updating user
      .mockResolvedValueOnce(courses);          // 3. for finding courses

    (db.limit as jest.Mock).mockResolvedValueOnce([institution]);
    (db.values as jest.Mock).mockResolvedValueOnce([]);

    const result = await assignDefaultInstitution(userId);

    expect(db.update).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(db.values).toHaveBeenCalledWith([
      { userId, courseId: "c-1" },
      { userId, courseId: "c-2" }
    ]);
    expect(result).toEqual({ success: true, coursesEnrolled: 2 });
  });

  it("should handle error gracefully during database operations", async () => {
    (db.select as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Database connection failed");
    });

    const result = await assignDefaultInstitution(userId);

    expect(result).toEqual({ success: false, error: "Failed to assign institution" });
    expect(db.update).not.toHaveBeenCalled();
  });
});
