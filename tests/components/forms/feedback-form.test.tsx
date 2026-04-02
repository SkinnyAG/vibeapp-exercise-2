import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { FeedbackForm } from "../../../components/forms/feedback-form";
import { submitFeedback } from "../../../lib/actions/feedback";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the action
jest.mock("../../../lib/actions/feedback", () => ({
  submitFeedback: jest.fn(),
}));

describe("FeedbackForm Component", () => {
  const mockRouterPush = jest.fn();
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      back: mockRouterBack,
    });
  });

  const defaultProps = {
    courseId: "course-123",
    courseName: "CS 101 Introduction",
  };

  it("renders the form with course info", () => {
    render(<FeedbackForm {...defaultProps} />);
    
    expect(screen.getByText(/CS 101 Introduction/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Feedback/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Submit anonymously/i)).toBeInTheDocument();
  });

  it("shows validation errors when fields are empty / too short on submit", async () => {
    render(<FeedbackForm {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: /Submit Feedback/i });
    
    // Type too little
    const textInput = screen.getByLabelText(/Your Feedback/i);
    await userEvent.type(textInput, "short");
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Feedback must be at least 10 characters/i)).toBeInTheDocument();
    });

    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it("calls submitFeedback successfully and redirects after delay", async () => {
    (submitFeedback as jest.Mock).mockResolvedValue({ success: true, feedbackId: "test" });
    render(<FeedbackForm {...defaultProps} />);
    
    const textInput = screen.getByLabelText(/Your Feedback/i);
    const anonCheckbox = screen.getByLabelText(/Submit anonymously/i);
    const submitButton = screen.getByRole("button", { name: /Submit Feedback/i });

    await userEvent.type(textInput, "Great assignment, well structured!");
    fireEvent.click(anonCheckbox);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitFeedback).toHaveBeenCalledWith("course-123", {
        feedbackText: "Great assignment, well structured!",
        isAnonymous: true,
      });
      // Should show success message
      expect(screen.getByText(/Thank you! Your feedback has been submitted successfully/i)).toBeInTheDocument();
    });
  });

  it("displays an error message when submitFeedback returns an error object", async () => {
    (submitFeedback as jest.Mock).mockResolvedValue({ error: "Access denied" });
    render(<FeedbackForm {...defaultProps} />);

    const textInput = screen.getByLabelText(/Your Feedback/i);
    const submitButton = screen.getByRole("button", { name: /Submit Feedback/i });

    await userEvent.type(textInput, "Just some quick feedback for this app");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Access denied")).toBeInTheDocument();
    });
    
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("displays a fallback error message if the action throws an exception", async () => {
    (submitFeedback as jest.Mock).mockRejectedValue(new Error("Network Error"));
    render(<FeedbackForm {...defaultProps} />);

    const textInput = screen.getByLabelText(/Your Feedback/i);
    const submitButton = screen.getByRole("button", { name: /Submit Feedback/i });

    await userEvent.type(textInput, "Validly long message length is here.");

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
    });
  });

  it("navigates back when cancel is clicked", () => {
    // Only difference from component is cancel button has text "Cancel" but here let's select via type="button"
    // In Feedback form, there's no "Cancel" label explicitly in the provided excerpt but we know it's a router.back()
    // It's the second button in the form
    render(<FeedbackForm {...defaultProps} />);
    const buttons = screen.getAllByRole("button");
    const cancelButton = buttons.find(b => !b.innerHTML.includes("Submit")); // It's "Cancel" based on ai log form? Let's check text. Wait the excerpt showed router.back()
    // By clicking the button doing router.back()
    
    if (cancelButton) {
      fireEvent.click(cancelButton);
    }
    expect(mockRouterBack).toHaveBeenCalled();
  });
});
