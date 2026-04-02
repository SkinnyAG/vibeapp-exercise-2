import { render, screen } from "@testing-library/react";
import StudentLayout from "../../app/(student)/layout";
import { getSession } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

jest.mock("@/lib/auth/permissions", () => ({
  getSession: jest.fn(),
}));

jest.mock("@/lib/actions/auth", () => ({
  signOutAction: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
};

describe("Student layout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
  });

  it("redirects when user is not authenticated", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(StudentLayout({ children: <div>Child</div> })).rejects.toThrow(
      "REDIRECT:/login",
    );

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects when session exists but user is missing from DB", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([]);

    await expect(StudentLayout({ children: <div>Child</div> })).rejects.toThrow(
      "REDIRECT:/login",
    );

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders header and children for authenticated users", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([
      { name: "Alice", email: "a@example.com", role: "STUDENT" },
    ]);

    const ui = await StudentLayout({ children: <div>Child Content</div> });
    render(ui);

    expect(screen.getByText("AI Guidebook")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("STUDENT")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });
});
