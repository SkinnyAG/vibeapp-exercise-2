import { feedbackSchema } from "../../lib/validations/feedback";

describe("feedbackSchema Validation", () => {
  it("should validate a correct payload", () => {
    const validData = {
      feedbackText: "This is some constructive feedback that is long enough.",
      isAnonymous: true,
    };
    
    const result = feedbackSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("feedbackText branch coverage & edge cases", () => {
    it("should fail when feedbackText is empty", () => {
      const data = { feedbackText: "", isAnonymous: false };
      const result = feedbackSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Feedback must be at least 10 characters");
      }
    });

    it("should fail when feedbackText is too short (< 10 chars)", () => {
      const data = { feedbackText: "Too short", isAnonymous: false };
      const result = feedbackSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Feedback must be at least 10 characters");
      }
    });

    it("should fail when feedbackText is missing", () => {
      const data = { isAnonymous: false };
      const result = feedbackSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("expected string");
      }
    });

    it("should fail when feedbackText is too long (> 2000 chars)", () => {
      const data = {
        feedbackText: "a".repeat(2001),
        isAnonymous: true,
      };
      const result = feedbackSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Feedback is too long");
      }
    });
  });

  describe("isAnonymous field", () => {
    it("should fail when isAnonymous is missing", () => {
      const data = { feedbackText: "This is long enough feedback." };
      const result = feedbackSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("expected boolean");
      }
    });

    it("should format valid input when isAnonymous is false", () => {
      const data = { feedbackText: "This is long enough feedback.", isAnonymous: false };
      const result = feedbackSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
