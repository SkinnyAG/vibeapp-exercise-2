import { z } from "zod";

export const feedbackSchema = z.object({
  feedbackText: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(2000, "Feedback is too long"),
  isAnonymous: z.boolean(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
