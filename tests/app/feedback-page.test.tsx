import FeedbackPage from "../../app/(student)/courses/[courseId]/feedback/page";
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

jest.mock("@/components/forms/feedback-form", () => ({
  FeedbackForm: () => <div>Feedback Form</div>,
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

describe("Feedback page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.select.mockReturnValue(mockDb);
    mockDb.from.mockReturnValue(mockDb);
    mockDb.innerJoin.mockReturnValue(mockDb);
  });

  it("redirects unauthenticated users", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await expect(
      FeedbackPage({ params: Promise.resolve({ courseId: "c1" }) }),
    ).rejects.toThrow("REDIRECT:/login");

    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("returns notFound when enrollment is missing", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });
    mockDb.where.mockResolvedValue([]);

    await expect(
      FeedbackPage({ params: Promise.resolve({ courseId: "c1" }) }),
    ).rejects.toThrow("NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });
});
