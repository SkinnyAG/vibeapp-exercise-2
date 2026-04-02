import NewAILogPage from "../../app/(student)/courses/[courseId]/assignments/[assignmentId]/logs/new/page";
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

jest.mock("@/components/forms/ai-log-form", () => ({
  AILogForm: () => <div>AI Log Form</div>,
}));

jest.mock("@/lib/db", () => ({
  db: {
    select: jest.fn(),
    from: jest.fn(),
    innerJoin: jest.fn(),
    leftJoin: jest.fn(),
    where: jest.fn(),
  },
}));

const mockDb = db as unknown as {
  select: jest.Mock;
  from: jest.Mock;
  innerJoin: jest.Mock;
  leftJoin: jest.Mock;
  where: jest.Mock;
};

describe("New AI log page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.innerJoin.mockReturnValue(mockDb);
    mockDb.leftJoin.mockReturnValue(mockDb);
  });

  it("redirects unauthenticated users", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(
      NewAILogPage({
        params: Promise.resolve({ courseId: "c1", assignmentId: "a1" }),
      }),
    ).rejects.toThrow("REDIRECT:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns notFound when assignment is inaccessible", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([]);

    await expect(
      NewAILogPage({
        params: Promise.resolve({ courseId: "c1", assignmentId: "a1" }),
      }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
