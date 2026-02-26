"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { aiLogSchema, type AILogInput } from "@/lib/validations/ai-log";
import { createAILog } from "@/lib/actions/ai-logs";

interface AILogFormProps {
  assignmentId: string;
  assignmentName: string;
  courseName: string;
}

export function AILogForm({
  assignmentId,
  assignmentName,
  courseName,
}: AILogFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AILogInput>({
    resolver: zodResolver(aiLogSchema),
  });

  const onSubmit = async (data: AILogInput) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createAILog(assignmentId, data);

      if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
        return;
      }

      // Redirect to dashboard on success
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Assignment info */}
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Logging AI usage for:
        </div>
        <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
          {assignmentName}
        </div>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          {courseName}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* AI Tool Name */}
      <div>
        <label
          htmlFor="toolName"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          AI Tool Used <span className="text-red-500">*</span>
        </label>
        <input
          id="toolName"
          type="text"
          {...register("toolName")}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          placeholder="e.g., ChatGPT, GitHub Copilot, Claude"
        />
        {errors.toolName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.toolName.message}
          </p>
        )}
      </div>

      {/* Purpose Description */}
      <div>
        <label
          htmlFor="purposeDescription"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Purpose / Description <span className="text-red-500">*</span>
        </label>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Describe what you asked the AI to help with and how you used its
          output.
        </p>
        <textarea
          id="purposeDescription"
          rows={6}
          {...register("purposeDescription")}
          className="mt-2 block w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
          placeholder="Example: I asked ChatGPT to explain the concept of binary search trees and help me understand how to implement one in Python. I used its explanation to write my own implementation and made modifications based on the assignment requirements."
        />
        {errors.purposeDescription && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.purposeDescription.message}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          {isSubmitting ? "Submitting..." : "Submit AI Usage Log"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>

      {/* Info note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
        <div className="flex">
          <div className="text-sm text-blue-700 dark:text-blue-400">
            <strong>Note:</strong> According to NFR-02, this form requires only
            3 interactions:
            <ol className="ml-4 mt-2 list-decimal">
              <li>Fill in AI tool name</li>
              <li>Fill in purpose description</li>
              <li>Click submit</li>
            </ol>
          </div>
        </div>
      </div>
    </form>
  );
}
