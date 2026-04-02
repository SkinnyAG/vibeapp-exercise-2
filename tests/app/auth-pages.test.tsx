import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "../../app/(auth)/login/page";
import SignupPage from "../../app/(auth)/signup/page";
import { authClient } from "@/lib/auth/client";
import { assignDefaultInstitution } from "@/lib/actions/onboarding";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn(() => null) })),
}));

jest.mock("@/lib/auth/client", () => ({
  authClient: {
    signIn: {
      email: jest.fn(),
    },
    signUp: {
      email: jest.fn(),
    },
  },
}));

jest.mock("@/lib/actions/onboarding", () => ({
  assignDefaultInstitution: jest.fn(),
}));

describe("Login page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows auth error when sign-in fails", async () => {
    (authClient.signIn.email as jest.Mock).mockResolvedValue({
      error: { message: "Invalid email or password" },
    });

    render(<LoginPage />);

    await userEvent.type(screen.getByLabelText("Email"), "student@test.edu");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });
});

describe("Signup page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const fillSignupForm = async (
    password: string,
    confirmPassword: string = password,
  ) => {
    await userEvent.type(screen.getByPlaceholderText("Full Name"), "Jane");
    await userEvent.type(
      screen.getByPlaceholderText("Email address"),
      "jane@test.edu",
    );
    await userEvent.type(
      screen.getByPlaceholderText("Password (min 8 characters)"),
      password,
    );
    await userEvent.type(
      screen.getByPlaceholderText("Confirm Password"),
      confirmPassword,
    );
  };

  it("shows validation error when passwords do not match", async () => {
    render(<SignupPage />);

    await fillSignupForm("password123", "different123");

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    });

    expect(authClient.signUp.email).not.toHaveBeenCalled();
    expect(assignDefaultInstitution).not.toHaveBeenCalled();
  });

  it("shows validation error when password is shorter than 8 characters", async () => {
    render(<SignupPage />);

    await fillSignupForm("short");

    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(
        screen.getByText("Password must be at least 8 characters"),
      ).toBeInTheDocument();
    });

    expect(authClient.signUp.email).not.toHaveBeenCalled();
  });

  it("shows sign-up API error message", async () => {
    (authClient.signUp.email as jest.Mock).mockResolvedValue({
      error: { message: "Email already in use" },
    });

    render(<SignupPage />);
    await fillSignupForm("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });

    expect(assignDefaultInstitution).not.toHaveBeenCalled();
  });

  it("shows onboarding error when institution assignment fails", async () => {
    (authClient.signUp.email as jest.Mock).mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    (assignDefaultInstitution as jest.Mock).mockResolvedValue({
      success: false,
      error: "Failed to complete registration",
    });

    render(<SignupPage />);
    await fillSignupForm("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to complete registration"),
      ).toBeInTheDocument();
    });
  });

  it("shows fallback error from catch when signup throws without message", async () => {
    (authClient.signUp.email as jest.Mock).mockRejectedValue({});

    render(<SignupPage />);
    await fillSignupForm("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(
        screen.getByText("An error occurred during signup"),
      ).toBeInTheDocument();
    });
  });

  it("completes successful signup and onboarding", async () => {
    (authClient.signUp.email as jest.Mock).mockResolvedValue({
      data: { user: { id: "u1" } },
    });
    (assignDefaultInstitution as jest.Mock).mockResolvedValue({
      success: true,
      coursesEnrolled: 2,
    });

    render(<SignupPage />);
    await fillSignupForm("password123");
    fireEvent.click(screen.getByRole("button", { name: "Sign up" }));

    await waitFor(() => {
      expect(authClient.signUp.email).toHaveBeenCalledWith({
        name: "Jane",
        email: "jane@test.edu",
        password: "password123",
      });
      expect(assignDefaultInstitution).toHaveBeenCalledWith("u1");
    });
  });
});
