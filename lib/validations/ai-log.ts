import { z } from "zod";

export const aiLogSchema = z.object({
  toolName: z
    .string()
    .min(1, "AI tool name is required")
    .max(100, "Tool name is too long"),
  purposeDescription: z
    .string()
    .min(10, "Purpose description must be at least 10 characters")
    .max(1000, "Purpose description is too long"),
});

export type AILogInput = z.infer<typeof aiLogSchema>;
