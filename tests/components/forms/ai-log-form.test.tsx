import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
import { AILogForm } from "../../../components/forms/ai-log-form";
import { createAILog } from "../../../lib/actions/ai-logs";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the action
jest.mock("../../../lib/actions/ai-logs", () => ({
  createAILog: jest.fn(),
}));

describe("AILogForm Component", () => {
  const mockRouterPush = jest.fn();
  const mockRouterRefresh = jest.fn();
  const mockRouterBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      refresh: mockRouterRefresh,
      back: mockRouterBack,
    });
  });

  const defaultProps = {
    assignmentId: "test-assign-1",
    assignmentName: "Assignment 1",
    courseName: "CS101",
  };

  it("renders the form with assignment info", () => {
    render(<AILogForm {...defaultProps} />);
    
    expect(screen.getByText(/Assignment 1/i)).toBeInTheDocument();
    expect(screen.getByText(/CS101/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/AI Tool Used/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purpose \/ Description/i)).toBeInTheDocument();
  });

  it("shows validation errors when fields are empty on submit", async () => {
    render(<AILogForm {...defaultProps} />);
    const submitButton = screen.getByRole("button", { name: /Submit AI Usage Log/i });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      // The Zod schema validation errors should appear in the document
      expect(screen.getByText(/AI tool name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Purpose description must be at least 10 characters/i)).toBeInTheDocument();
    });

    expect(createAILog).not.toHaveBeenCalled();
  });

  it("calls createAILog successfully and redirects", async () => {
    (createAILog as jest.Mock).mockResolvedValue({ success: true });
    render(<AILogForm {...defaultProps} />);
    
    const toolInput = screen.getByLabelText(/AI Tool Used/i);
    const purposeInput = screen.getByLabelText(/Purpose \/ Description/i);
    const submitButton = screen.getByRole("button", { name: /Submit AI Usage Log/i });

    await userEvent.type(toolInput, "ChatGPT");
    await userEvent.type(purposeInput, "Help with algorithms and logic");

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(createAILog).toHaveBeenCalledWith("test-assign-1", {
        toolName: "ChatGPT",
        purposeDescription: "Help with algorithms and logic",
      });
      expect(mockRouterPush).toHaveBeenCalledWith("/dashboard");
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  it("displays an error message when createAILog returns an error object", async () => {
    (createAILog as jest.Mock).mockResolvedValue({ error: "Submission failed due to enrollment" });
    render(<AILogForm {...defaultProps} />);

    const toolInput = screen.getByLabelText(/AI Tool Used/i);
    const purposeInput = screen.getByLabelText(/Purpose \/ Description/i);
    const submitButton = screen.getByRole("button", { name: /Submit AI Usage Log/i });

    await userEvent.type(toolInput, "Copilot");
    await userEvent.type(purposeInput, "Autocompleting some simple functions");

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Submission failed due to enrollment")).toBeInTheDocument();
    });
    
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("displays a fallback error message if the action throws an exception", async () => {
    (createAILog as jest.Mock).mockRejectedValue(new Error("Network Error"));
    render(<AILogForm {...defaultProps} />);

    const toolInput = screen.getByLabelText(/AI Tool Used/i);
    const purposeInput = screen.getByLabelText(/Purpose \/ Description/i);
    const submitButton = screen.getByRole("button", { name: /Submit AI Usage Log/i });

    await userEvent.type(toolInput, "Copilot");
    await userEvent.type(purposeInput, "Autocompleting some simple functions");

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred")).toBeInTheDocument();
    });
  });

  it("navigates back when cancel is clicked", () => {
    render(<AILogForm {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: /Cancel/i });
    
    fireEvent.click(cancelButton);
    expect(mockRouterBack).toHaveBeenCalled();
  });
});
