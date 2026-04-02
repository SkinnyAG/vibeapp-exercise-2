import { render, screen } from "@testing-library/react";
import AuthLayout from "../../app/(auth)/layout";
import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";

jest.mock("next/server", () => ({
  NextResponse: {
    next: jest.fn(() => ({ ok: true })),
  },
}));

jest.mock("better-auth/next-js", () => ({
  toNextJsHandler: jest.fn(() => ({
    GET: jest.fn(),
    POST: jest.fn(),
  })),
}));

jest.mock("@/lib/auth/config", () => ({
  auth: { name: "mock-auth" },
}));

describe("App layouts", () => {
  it("renders auth layout children", () => {
    render(
      <AuthLayout>
        <div>Auth Child</div>
      </AuthLayout>,
    );
    expect(screen.getByText("Auth Child")).toBeInTheDocument();
  });
});

describe("App middleware and auth API route", () => {
  it("returns NextResponse.next from middleware", async () => {
    const { middleware, config } = await import("../../middleware");

    const result = await middleware({} as any);

    expect(result).toEqual({ ok: true });
    expect(NextResponse.next as jest.Mock).toHaveBeenCalled();
    expect(config.matcher[0]).toContain("_next/static");
  });

  it("binds BetterAuth handler and exports node runtime", async () => {
    const routeModule = await import("../../app/api/auth/[...all]/route");

    expect(routeModule.runtime).toBe("nodejs");
    expect(toNextJsHandler).toHaveBeenCalled();
    expect(routeModule.GET).toBeDefined();
    expect(routeModule.POST).toBeDefined();
  });
});
