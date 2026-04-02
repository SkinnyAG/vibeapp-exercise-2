import { render, screen } from "@testing-library/react";
import DashboardPage from "../../app/(student)/dashboard/page";
import { getSession } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const enrollmentsQuery = {
  from: jest.fn(),
  innerJoin: jest.fn(),
  where: jest.fn(),
};

const assignmentsQuery = {
  from: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
};

const logsQuery = {
  from: jest.fn(),
  where: jest.fn(),
};

const countQuery = {
  from: jest.fn(),
  where: jest.fn(),
};

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

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
};

describe("Dashboard page", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    enrollmentsQuery.from.mockReturnValue(enrollmentsQuery);
    enrollmentsQuery.innerJoin.mockReturnValue(enrollmentsQuery);
    assignmentsQuery.from.mockReturnValue(assignmentsQuery);
    assignmentsQuery.where.mockReturnValue(assignmentsQuery);
    logsQuery.from.mockReturnValue(logsQuery);

    countQuery.from.mockReturnValue(countQuery);
  });

  it("redirects unauthenticated users", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(DashboardPage()).rejects.toThrow("REDIRECT:/login");
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("renders empty state when no enrollments exist", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.select
      .mockReturnValueOnce(enrollmentsQuery)
      .mockReturnValueOnce(countQuery);
    enrollmentsQuery.where.mockResolvedValue([]);
    countQuery.where.mockResolvedValue([{ count: 0 }]);

    const ui = await DashboardPage();
    render(ui);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No assignments found. Enroll in a course to get started.",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("0").length).toBeGreaterThan(0);
  });

  it("renders populated dashboard with singular log label and links", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });

    mockDb.select
      .mockReturnValueOnce(enrollmentsQuery)
      .mockReturnValueOnce(assignmentsQuery)
      .mockReturnValueOnce(logsQuery)
      .mockReturnValueOnce(countQuery);

    enrollmentsQuery.where.mockResolvedValue([
      {
        id: "e1",
        courseId: "c1",
        courseName: "Intro to AI",
        courseCode: "CS101",
      },
    ]);
    assignmentsQuery.orderBy.mockResolvedValue([
      {
        id: "a1",
        courseId: "c1",
        name: "Assignment 1",
        description: "Build a model",
        dueDate: "2026-05-01",
      },
    ]);
    logsQuery.where.mockResolvedValue([
      { id: "l1", assignmentId: "a1", userId: "u1" },
    ]);
    countQuery.where.mockResolvedValue([{ count: 1 }]);

    const ui = await DashboardPage();
    render(ui);

    expect(screen.getByText("Assignment 1")).toBeInTheDocument();
    expect(screen.getByText("Build a model")).toBeInTheDocument();
    expect(screen.getByText("1 log submitted")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log AI Usage" })).toHaveAttribute(
      "href",
      "/courses/c1/assignments/a1/logs/new",
    );
    expect(
      screen.getByRole("link", { name: "View Guidelines" }),
    ).toHaveAttribute("href", "/courses/c1/guidelines");
  });

  it("renders plural logs label for multiple assignments", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });

    mockDb.select
      .mockReturnValueOnce(enrollmentsQuery)
      .mockReturnValueOnce(assignmentsQuery)
      .mockReturnValueOnce(logsQuery)
      .mockReturnValueOnce(countQuery);

    enrollmentsQuery.where.mockResolvedValue([
      {
        id: "e1",
        courseId: "c1",
        courseName: "Intro to AI",
        courseCode: "CS101",
      },
      { id: "e2", courseId: "c2", courseName: "Ethics", courseCode: "CS201" },
    ]);
    assignmentsQuery.orderBy.mockResolvedValue([
      {
        id: "a1",
        courseId: "c1",
        name: "Assignment 1",
        description: null,
        dueDate: "2026-05-01",
      },
      {
        id: "a2",
        courseId: "c2",
        name: "Assignment 2",
        description: null,
        dueDate: "2026-05-07",
      },
    ]);
    logsQuery.where.mockResolvedValue([
      { id: "l1", assignmentId: "a2", userId: "u1" },
      { id: "l2", assignmentId: "a2", userId: "u1" },
    ]);
    countQuery.where.mockResolvedValue([{ count: 2 }]);

    const ui = await DashboardPage();
    render(ui);

    expect(screen.getByText("2 logs submitted")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Log AI Usage" })).toHaveLength(
      2,
    );
  });
});
