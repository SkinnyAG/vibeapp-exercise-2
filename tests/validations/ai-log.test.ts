import { aiLogSchema } from "../../lib/validations/ai-log";

describe("aiLogSchema Validation", () => {
  it("should validate a correct payload", () => {
    const validData = {
      toolName: "GitHub Copilot",
      purposeDescription: "Used to generate unit tests and documentation",
    };
    
    const result = aiLogSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  describe("toolName branch coverage & edge cases", () => {
    it("should fail when toolName is empty", () => {
      const data = { toolName: "", purposeDescription: "Valid description!" };
      const result = aiLogSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("AI tool name is required");
      }
    });

    it("should fail when toolName is missing", () => {
      const data = { purposeDescription: "Valid description!" };
      const result = aiLogSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("expected string");
      }
    });

    it("should fail when toolName is too long (> 100 chars)", () => {
      const data = {
        toolName: "a".repeat(101),
        purposeDescription: "Valid description here.",
      };
      const result = aiLogSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Tool name is too long");
      }
    });
  });

  describe("purposeDescription branch coverage & edge cases", () => {
    it("should fail when purposeDescription is too short (< 10 chars)", () => {
      const data = { toolName: "Copilot", purposeDescription: "Short" };
      const result = aiLogSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Purpose description must be at least 10 characters");
      }
    });

    it("should fail when purposeDescription is missing", () => {
      const data = { toolName: "Copilot" };
      const result = aiLogSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("expected string");
      }
    });

    it("should fail when purposeDescription is too long (> 1000 chars)", () => {
      const data = {
        toolName: "Copilot",
        purposeDescription: "a".repeat(1001),
      };
      const result = aiLogSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Purpose description is too long");
      }
    });
  });
});
