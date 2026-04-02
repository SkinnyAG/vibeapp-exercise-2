import Home from "../../app/page";
import { getSession } from "@/lib/auth/permissions";
import { redirect } from "next/navigation";

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

jest.mock("@/lib/auth/permissions", () => ({
  getSession: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("Home page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("redirects authenticated users to dashboard", async () => {
    (getSession as jest.Mock).mockResolvedValue({ user: { id: "u1" } });

    await Home();

    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("redirects unauthenticated users to login", async () => {
    (getSession as jest.Mock).mockResolvedValue(null);

    await Home();

    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
