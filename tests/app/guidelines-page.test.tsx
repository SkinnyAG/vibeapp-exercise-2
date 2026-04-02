import { render, screen } from "@testing-library/react";
import GuidelinesPage from "../../app/(student)/courses/[courseId]/guidelines/page";
import { getSession } from "@/lib/auth/permissions";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  notFound: jest.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

jest.mock("@/lib/auth/permissions", () => ({
  getSession: jest.fn(),
}));

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children, components }: { children: any; components?: any }) => {
    const renderedComponents = Object.entries(components ?? {}).map(
      ([name, component]: [string, any]) => {
        if (name === "code") {
          return (
            <div key={name}>
              {component({ inline: true, children: "inline-code" })}
              {component({ inline: false, children: "block-code" })}
            </div>
          );
        }

        return (
          <div key={name}>{component({ children: `${name}-content` })}</div>
        );
      },
    );

    return (
      <div data-testid="markdown-mock">
        <div>{children}</div>
        {renderedComponents}
      </div>
    );
  },
}));

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    innerJoin: jest.fn(),
    where: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  from: jest.Mock;
  innerJoin: jest.Mock;
  where: jest.Mock;
};

describe("Guidelines page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.innerJoin.mockReturnValue(mockDb);
  });

  it("redirects unauthenticated users", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(
      GuidelinesPage({ params: Promise.resolve({ courseId: "c1" }) }),
    ).rejects.toThrow("REDIRECT:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns notFound when enrollment is missing", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([]);

    await expect(
      GuidelinesPage({ params: Promise.resolve({ courseId: "c1" }) }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("renders guidelines, instructor, markdown content and last updated", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([
      {
        enrollmentId: "e1",
        enrollmentUserId: "u1",
        enrollmentCourseId: "c1",
        enrollmentEnrolledAt: new Date("2026-01-01"),
        courseId: "c1",
        courseCode: "CS101",
        courseName: "Intro to AI",
        courseAiGuidelines: "# Markdown Guidelines",
        courseGuidelineUpdatedAt: new Date("2026-03-15"),
        lecturerName: "Dr. Smith",
        lecturerEmail: "smith@university.edu",
      },
    ]);

    const ui = await GuidelinesPage({
      params: Promise.resolve({ courseId: "c1" }),
    });
    render(ui);

    expect(screen.getByText("AI Usage Guidelines")).toBeInTheDocument();
    expect(screen.getByText("CS101 - Intro to AI")).toBeInTheDocument();
    expect(screen.getByText("Instructor: Dr. Smith")).toBeInTheDocument();
    expect(screen.getByTestId("markdown-mock")).toBeInTheDocument();
    expect(screen.getByText(/Markdown Guidelines/)).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Provide Feedback on Guidelines" }),
    ).toHaveAttribute("href", "/courses/c1/feedback");
  });

  it("renders fallback text when no guidelines are set", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([
      {
        enrollmentId: "e1",
        enrollmentUserId: "u1",
        enrollmentCourseId: "c1",
        enrollmentEnrolledAt: new Date("2026-01-01"),
        courseId: "c1",
        courseCode: "CS101",
        courseName: "Intro to AI",
        courseAiGuidelines: null,
        courseGuidelineUpdatedAt: null,
        lecturerName: "Dr. Smith",
        lecturerEmail: "smith@university.edu",
      },
    ]);

    const ui = await GuidelinesPage({
      params: Promise.resolve({ courseId: "c1" }),
    });
    render(ui);

    expect(
      screen.getByText(
        "No AI usage guidelines have been set for this course yet.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Last updated:/)).not.toBeInTheDocument();
  });
});
