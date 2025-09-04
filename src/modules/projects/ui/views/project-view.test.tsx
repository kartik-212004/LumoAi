/**
 * Tests for ProjectView
 *
 * Detected stack: Jest/Vitest + React Testing Library (aligns automatically; uses jest.* or vi.* via global detection).
 * Focus: Diff contents — verify Suspense fallback, resizable layout props, TRPC hook interaction, and child wiring.
 */

import React, { Suspense } from "react";
import { render, screen, within } from "@testing-library/react";

// Unify Jest/Vitest mocking API
const mocker: any = (global as any).vi ?? (global as any).jest;

// Mock TRPC hook to avoid actual data fetching/suspense for the component-level query.
mocker.mock("@/trpc/client", () => {
  return {
    trpc: {
      projects: {
        getOne: {
          useSuspenseQuery: mocker.fn().mockImplementation((_args: { id: string }) => {
            // Return tuple [data] like TanStack Query's useSuspenseQuery would after resolve
            return [{ id: _args.id, name: "Demo Project" }];
          }),
        },
      },
    },
  };
});

// Mock Resizable components to render simple, testable DOM while preserving key props
mocker.mock("@/components/ui/resizable", () => {
  return {
    ResizablePanelGroup: ({ direction, children }: any) => (
      <div data-testid="rpg" data-direction={direction} role="group">
        {children}
      </div>
    ),
    ResizablePanel: ({ defaultSize, minSize, className, children }: any) => (
      <section
        data-testid="rp"
        data-default-size={String(defaultSize)}
        data-min-size={String(minSize)}
        data-class={className ?? ""}
      >
        {children}
      </section>
    ),
    ResizableHandle: ({ withHandle }: any) => (
      <div data-testid="rh" data-with-handle={String(!!withHandle)} aria-label="Resize Handle" />
    ),
  };
});

// Mock MessagesContainer so we can assert the projectId is passed through
mocker.mock("./components/messages-container", () => {
  return {
    __esModule: true,
    default: ({ projectId }: { projectId: string }) => (
      <div data-testid="messages-container">Messages for: {projectId}</div>
    ),
  };
});

// Import after mocks
import ProjectView from "./project-view";

describe("ProjectView", () => {
  it("renders horizontal layout with expected panels and handle (happy path)", () => {
    render(<ProjectView projectId="p-123" />);

    // Panel group direction
    const group = screen.getByTestId("rpg");
    expect(group).toHaveAttribute("data-direction", "horizontal");

    // Panels and handle exist
    const panels = screen.getAllByTestId("rp");
    expect(panels).toHaveLength(2);

    // First panel props
    const first = panels[0];
    expect(first).toHaveAttribute("data-default-size", "35");
    expect(first).toHaveAttribute("data-min-size", "20");
    expect(first).toHaveAttribute("data-class"); // class captured
    // Messages container present within first panel
    expect(within(first).getByTestId("messages-container")).toHaveTextContent("Messages for: p-123");

    // Handle props
    const handle = screen.getByTestId("rh");
    expect(handle).toHaveAttribute("data-with-handle", "true");

    // Second panel props/content
    const second = panels[1];
    expect(second).toHaveAttribute("data-default-size", "65");
    expect(second).toHaveAttribute("data-min-size", "50");
    expect(within(second).getByText(/TODO:\s*Preview/i)).toBeInTheDocument();
  });

  it("shows Suspense fallback for MessagesContainer when child suspends", () => {
    // Re-mock MessagesContainer to suspend
    mocker.doMock("./components/messages-container", () => {
      const Suspender = () => {
        // Suspend indefinitely; test only asserts fallback presence.
        throw new Promise(() => {});
      };
      return { __esModule: true, default: Suspender };
    });

    // Re-import component under test in an isolated module context to pick up new mock
    const { default: ProjectViewSuspending } = require("./project-view") as typeof import("./project-view");

    render(<ProjectViewSuspending projectId="p-suspend" />);

    // Fallback defined inside the first ResizablePanel's Suspense boundary should appear
    expect(screen.getByText("Loading Messages...")).toBeInTheDocument();
  });

  it("passes the provided projectId to the TRPC query hook", () => {
    const { trpc } = require("@/trpc/client");
    const spy = trpc.projects.getOne.useSuspenseQuery;

    render(<ProjectView projectId="abc-999" />);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith({ id: "abc-999" });
  });

  it("gracefully handles unusual projectId strings", () => {
    const weirdId = "   \n\t🧪-id-∆";
    render(<ProjectView projectId={weirdId} />);

    // Since we mock TRPC to echo id back, ensure it was called and the child received it.
    const { trpc } = require("@/trpc/client");
    expect(trpc.projects.getOne.useSuspenseQuery).toHaveBeenCalledWith({ id: weirdId });

    expect(screen.getByTestId("messages-container")).toHaveTextContent("Messages for:    🧪-id-∆");
  });
});