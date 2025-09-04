/* @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
import "@testing-library/jest-dom";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Mocks
 * - Keep mocks isolated to this file; they won't affect other tests.
 * - We implement a minimal Controller-backed FormField so RHF state works.
 */
vi.mock("@/components/ui/form", () => {
  const React = require("react");
  const { Controller } = require("react-hook-form");
  const Form = ({ children }: any) => React.createElement(React.Fragment, null, children);
  const FormField = ({ control, name, render }: any) =>
    React.createElement(Controller, { control, name, render });
  return { Form, FormField };
});

vi.mock("@/components/ui/button", () => {
  const React = require("react");
  const Button = React.forwardRef<HTMLButtonElement, any>((props, ref) =>
    React.createElement("button", { ref, ...props }, props.children)
  );
  Button.displayName = "Button";
  return { Button };
});

vi.mock("lucide-react", () => {
  const React = require("react");
  return {
    ArrowUpIcon: (props: any) => React.createElement("svg", { "data-testid": "arrow-icon", ...props }),
    Loader2Icon: (props: any) => React.createElement("svg", { "data-testid": "loader-icon", ...props }),
  };
});

vi.mock("react-textarea-autosize", () => {
  const React = require("react");
  return {
    default: React.forwardRef<HTMLTextAreaElement, any>((props, ref) =>
      React.createElement("textarea", { ref, ...props })
    ),
  };
});

vi.mock("sonner", () => {
  const error = vi.fn();
  const success = vi.fn();
  return { toast: { error, success }, __mockSonner: { error, success } };
});

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Sophisticated trpc mock with controls exposed via __mockTrpc
vi.mock("@/trpc/client", () => {
  const { vi } = require("vitest");
  let isPending = false;
  let shouldResolve = true;
  let resolveValue: any = { id: "msg-1" };
  let rejectError: any = new Error("Request failed");
  let lastInput: any = null;

  const invalidate = vi.fn();

  const useUtils = () => ({
    messages: { getMany: { invalidate } },
  });

  const mutateAsyncSpy = vi.fn(async (_input: any) => {});

  const useMutation = (opts?: any) => {
    return {
      isPending,
      mutateAsync: vi.fn(async (input: any) => {
        lastInput = input;
        mutateAsyncSpy(input);
        if (shouldResolve) {
          opts?.onSuccess?.(resolveValue);
          return resolveValue;
        } else {
          opts?.onError?.(rejectError);
          throw rejectError;
        }
      }),
    };
  };

  return {
    trpc: { useUtils, messages: { create: { useMutation } } },
    __mockTrpc: {
      setPending: (v: boolean) => { isPending = v; },
      setSuccess: (v: boolean) => { shouldResolve = v; },
      setResolveValue: (v: any) => { resolveValue = v; },
      setRejectError: (e: any) => { rejectError = e; },
      getLastInput: () => lastInput,
      clearLastInput: () => { lastInput = null; },
      invalidate,
      mutateAsyncSpy,
    },
  };
});

// Import component under test AFTER mocks
import { MessageForm } from "./message-form";
import * as trpcClient from "@/trpc/client";
import { toast } from "sonner";

const getTrpcMock = () => (trpcClient as any).__mockTrpc;

describe("MessageForm component", () => {
  beforeEach(() => {
    const mock = getTrpcMock();
    mock.setPending(false);
    mock.setSuccess(true);
    mock.setResolveValue({ id: "ok" });
    mock.setRejectError(new Error("Request failed"));
    mock.clearLastInput();
    mock.invalidate.mockClear();
    mock.mutateAsyncSpy.mockClear();
    (toast.error as any).mockClear?.();
    (toast as any).success?.mockClear?.();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders textarea and shows disabled submit button initially", () => {
    render(<MessageForm projectId="proj-123" />);

    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    // Not pending initially; arrow icon visible, loader hidden
    expect(screen.getByTestId("arrow-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
  });

  it("submits message via Cmd+Enter, calls mutate and invalidates cache, then clears input", async () => {
    const user = userEvent.setup();
    const mock = getTrpcMock();

    render(<MessageForm projectId="proj-123" />);

    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;
    await user.type(textarea, "Hello world");
    expect(textarea.value).toBe("Hello world");

    // Focus then send Meta+Enter
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

    await waitFor(() => {
      expect(mock.mutateAsyncSpy).toHaveBeenCalledTimes(1);
    });

    expect(mock.getLastInput()).toEqual({ value: "Hello world", projectId: "proj-123" });
    expect(mock.invalidate).toHaveBeenCalledWith({ projectId: "proj-123" });

    // Input should reset after success
    expect((screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement).value).toBe("");
  });

  it("submits message via Ctrl+Enter as well", async () => {
    const user = userEvent.setup();
    const mock = getTrpcMock();

    render(<MessageForm projectId="p-1" />);
    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;

    await user.type(textarea, "Second path");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Enter", ctrlKey: true });

    await waitFor(() => {
      expect(mock.mutateAsyncSpy).toHaveBeenCalledTimes(1);
    });

    expect(mock.getLastInput()).toEqual({ value: "Second path", projectId: "p-1" });
  });

  it("does not submit on plain Enter without modifiers", async () => {
    const user = userEvent.setup();
    const mock = getTrpcMock();

    render(<MessageForm projectId="p-plain" />);
    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;

    await user.type(textarea, "No submit");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Enter" }); // No ctrl/meta

    await waitFor(() => {
      // Give the event loop a tick; ensure mutate not called
      expect(mock.mutateAsyncSpy).toHaveBeenCalledTimes(0);
    });
  });

  it("shows loader and disables input while pending", () => {
    const mock = getTrpcMock();
    mock.setPending(true);

    render(<MessageForm projectId="p-pending" />);

    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;
    const button = screen.getByRole("button");

    expect(textarea).toBeDisabled();
    expect(button).toBeDisabled();
    expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("arrow-icon")).not.toBeInTheDocument();
  });

  it("handles mutation error by showing toast and retaining input value", async () => {
    const user = userEvent.setup();
    const mock = getTrpcMock();
    mock.setSuccess(false);
    mock.setRejectError(new Error("Boom"));

    render(<MessageForm projectId="p-error" />);

    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;
    await user.type(textarea, "Will fail");
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

    await waitFor(() => {
      expect((toast.error as any)).toHaveBeenCalledWith("Boom");
    });

    // Value should not be cleared on error
    expect(textarea.value).toBe("Will fail");
    expect(mock.invalidate).not.toHaveBeenCalled();
  });

  it("prevents submission when value is empty (validation)", async () => {
    const mock = getTrpcMock();

    render(<MessageForm projectId="p-empty" />);

    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

    await waitFor(() => {
      expect(mock.mutateAsyncSpy).toHaveBeenCalledTimes(0);
    });
  });

  it("prevents submission when value exceeds 1000 characters", async () => {
    const user = userEvent.setup();
    const mock = getTrpcMock();

    render(<MessageForm projectId="p-long" />);
    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;

    const longText = "x".repeat(1001);
    await user.type(textarea, longText);
    textarea.focus();
    fireEvent.keyDown(textarea, { key: "Enter", metaKey: true });

    await waitFor(() => {
      expect(mock.mutateAsyncSpy).toHaveBeenCalledTimes(0);
    });
  });

  it("adds and removes shadow class on focus/blur", async () => {
    const user = userEvent.setup();
    render(<MessageForm projectId="p-focus" />);

    const formEl = document.querySelector("form") as HTMLFormElement;
    const textarea = screen.getByPlaceholderText("What would you like to build") as HTMLTextAreaElement;

    // Initially no shadow
    expect(formEl.className).not.toContain("shadow-xs");

    // Focus adds shadow
    await user.click(textarea);
    expect(formEl.className).toContain("shadow-xs");

    // Blur removes shadow
    textarea.blur();
    expect(formEl.className).not.toContain("shadow-xs");
  });
});