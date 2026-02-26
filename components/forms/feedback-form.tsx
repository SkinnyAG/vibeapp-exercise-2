"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { feedbackSchema, type FeedbackInput } from "@/lib/validations/feedback";
import { submitFeedback } from "@/lib/actions/feedback";

interface FeedbackFormProps {
  courseId: string;
  courseName: string;
}

export function FeedbackForm({ courseId, courseName }: FeedbackFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FeedbackInput>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedbackText: "",
      isAnonymous: false,
    },
  });

  const onSubmit: SubmitHandler<FeedbackInput> = async (data) => {
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const result = await submitFeedback(courseId, data);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Show success message
      setSuccess(true);
      reset();
      setIsSubmitting(false);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(`/courses/${courseId}/guidelines`);
      }, 2000);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Course info */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Providing feedback for:
        </div>
        <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
          {courseName}
        </div>
      </div>

      {/* Success message */}
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
          Thank you! Your feedback has been submitted successfully.
          Redirecting...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Feedback Text */}
      <div>
        <label
          htmlFor="feedbackText"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Your Feedback <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Share your thoughts on the AI usage guidelines for this course. Your
          input helps improve the course for everyone.
        </p>
        <textarea
          id="feedbackText"
          rows={6}
          {...register("feedbackText")}
          className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          placeholder="Example: The guidelines are helpful and clear. It would be great to have more specific examples for when to document AI usage in debugging versus code generation."
        />
        {errors.feedbackText && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.feedbackText.message}
          </p>
        )}
      </div>

      {/* Anonymous checkbox */}
      <div className="flex items-start">
        <div className="flex h-5 items-center">
          <input
            id="isAnonymous"
            type="checkbox"
            {...register("isAnonymous")}
            className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800"
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor="isAnonymous"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Submit anonymously
          </label>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your instructor will not see your name with this feedback
          </p>
        </div>
      </div>

      {/* Submit button */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isSubmitting || success}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
