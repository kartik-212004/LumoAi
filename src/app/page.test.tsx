/**
 * Tests for Page component
 * Testing library/framework: Vitest + @testing-library/react (preferred); compatible with Jest if project uses Jest.
 * These tests focus on the PR-diffed Page component behavior: mutation invocation, success/error handlers, and UI states.
 */

import React from "react";

// Prefer Vitest. Fall back to Jest types if running under Jest.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock Next.js router
vi.mock("next/navigation", () => {
  const push = vi.fn();
  return {
    useRouter: () => ({ push }),
  };
});

// Capture the mocked router to assert later
const getMockedRouter = () => {
  const mod = require("next/navigation");
  return mod.useRouter();
};

// Mock toast from "sonner"
vi.mock("sonner", () => {
  return {
    toast: {
      error: vi.fn(),
    },
  };
});
const getMockedToast = () => {
  const mod = require("sonner");
  return mod.toast;
};

// Mock tRPC client hook
// We implement a factory that we can control per test via global flags.
type MutateArgs = { value: string };
let mockIsPending = false;
let mockBehavior: "success" | "error" | "noop" = "noop";
let successPayload: any = { id: "p_123" };
let errorPayload: Error = new Error("Something went wrong");
let capturedOnSuccess: ((data: any, variables: MutateArgs, ctx: unknown) => void) | undefined;
let capturedOnError: ((err: Error) => void) | undefined;
let lastMutateArgs: MutateArgs | undefined;

vi.mock("@/trpc/client", () => {
  return {
    trpc: {
      projects: {
        create: {
          useMutation: (opts: {
            onError?: (err: Error) => void;
            onSuccess?: (data: any, variables: MutateArgs, ctx: unknown) => void;
          }) => {
            capturedOnError = opts?.onError;
            capturedOnSuccess = opts?.onSuccess;
            return {
              isPending: mockIsPending,
              mutate: (args: MutateArgs) => {
                lastMutateArgs = args;
                if (mockBehavior === "success" && capturedOnSuccess) {
                  capturedOnSuccess(successPayload, args, undefined);
                } else if (mockBehavior === "error" && capturedOnError) {
                  capturedOnError(errorPayload);
                }
              },
            };
          },
        },
      },
    },
  };
});

// Import component under test after mocks
import Page from "./page";

function resetMocks() {
  mockIsPending = false;
  mockBehavior = "noop";
  successPayload = { id: "p_123" };
  errorPayload = new Error("Something went wrong");
  capturedOnError = undefined;
  capturedOnSuccess = undefined;
  lastMutateArgs = undefined;

  // Clear spy histories
  const router = getMockedRouter();
  router.push.mockClear();
  const toast = getMockedToast();
  toast.error.mockClear();
}

describe("Page component", () => {
  beforeEach(() => {
    resetMocks();
  });

  it("renders input and submit button", () => {
    render(<Page />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("updates input value on change", () => {
    render(<Page />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { value: "My Project" } });
    expect(input.value).toBe("My Project");
  });

  it("invokes createProject.mutate with the typed value on click", () => {
    render(<Page />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Value A" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(lastMutateArgs).toEqual({ value: "Value A" });
  });

  it("navigates to the new project page on success", () => {
    mockBehavior = "success";
    successPayload = { id: "proj_999" };
    render(<Page />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Proj Name" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    const router = getMockedRouter();
    expect(router.push).toHaveBeenCalledWith("/projects/proj_999");
  });

  it("shows a toast error when mutation fails", () => {
    mockBehavior = "error";
    errorPayload = new Error("Duplicate project");
    render(<Page />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "X" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));

    const toast = getMockedToast();
    expect(toast.error).toHaveBeenCalledWith("Duplicate project");
  });

  it("disables the button while mutation is pending", () => {
    mockIsPending = true;
    render(<Page />);
    const btn = screen.getByRole("button", { name: /submit/i }) as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it("allows submitting empty and whitespace-only values (current behavior)", () => {
    render(<Page />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(lastMutateArgs).toEqual({ value: "   " });

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(lastMutateArgs).toEqual({ value: "" });
  });
});