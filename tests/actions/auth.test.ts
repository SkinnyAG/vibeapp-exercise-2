import { signOutAction } from "../../lib/actions/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";

jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn().mockResolvedValue({}) }));
jest.mock("@/lib/auth/config", () => ({
  auth: {
    api: {
      signOut: jest.fn().mockResolvedValue({}),
    },
  },
}));

describe("signOutAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call auth.api.signOut and redirect to /login", async () => {
    await signOutAction();
    
    expect(headers).toHaveBeenCalled();
    expect(auth.api.signOut).toHaveBeenCalledWith({ headers: {} });
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
