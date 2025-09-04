/**
 * Tests for MessagesContainer
 * Framework/Libraries: React Testing Library + (Vitest preferred; Jest compatible with minor aliasing)
 */
import React, { Suspense } from "react";
import { render, screen, within } from "@testing-library/react";

const isVitest = typeof vi !== "undefined";
// Provide a no-op vi for Jest environments if not already aliased in setup.
const testDbl = isVitest ? vi : (global as any).vi;

jest?.spyOn?.bind?.(jest); // no-op in Vitest

// --- Mocks for child components and trpc client ---
let __messagesData: any[] = [];
let __useSuspenseQuerySpy: any;

const MessageCardMock = ({ content, role, fragment, createdAt, isActiveFragment, type }: any) => (
  <div data-testid="message-card"
       data-role={role}
       data-type={type}
       data-active={String(!!isActiveFragment)}>
    <span>{String(content)}</span>
    <span>{createdAt instanceof Date ? createdAt.toISOString() : String(createdAt)}</span>
    <span>{fragment ? "has-fragment" : "no-fragment"}</span>
  </div>
);

const MessageFormMock = ({ projectId }: any) => (
  <div data-testid="message-form">MessageForm projectId: {projectId}</div>
);

// Prefer vi.mock; fall back to jest.mock if necessary
const doMock = (mod: string, factory: any) => {
  if (isVitest) {
    vi.mock(mod, factory);
  } else if (typeof jest !== "undefined") {
    jest.mock(mod, factory);
  }
};

// Mock children
doMock("./message-card", () => ({ default: MessageCardMock }));
doMock("./message-form", () => ({ MessageForm: MessageFormMock }));

// Dynamic mock for trpc hook that returns the current __messagesData array
doMock("@/trpc/client", () => ({
  trpc: {
    messages: {
      getMany: {
        useSuspenseQuery: (...args: any[]) => {
          (__useSuspenseQuerySpy || (isVitest ? vi.fn() : jest.fn()))(args);
          return [__messagesData];
        },
      },
    },
  },
}));

// After mocks, import the component under test
// eslint-disable-next-line import/first
import MessagesContainer from "./messages-container";

const setupScrollSpy = () => {
  const fn = (isVitest ? vi.fn() : jest.fn()).mockName("scrollIntoView");
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    writable: true,
    value: fn,
  });
  return fn;
};

const renderUI = (projectId = "proj-1") =>
  render(
    <Suspense fallback={<div data-testid="fallback">loading...</div>}>
      <MessagesContainer projectId={projectId} />
    </Suspense>
  );

describe("MessagesContainer", () => {
  beforeEach(() => {
    __messagesData = [];
    if (isVitest) {
      vi.resetModules?.();
      vi.clearAllMocks?.();
    } else {
      jest.resetModules?.();
      jest.clearAllMocks?.();
    }
  });

  it("renders MessageForm with provided projectId", () => {
    __messagesData = [];
    renderUI("project-xyz");
    expect(screen.getByTestId("message-form")).toHaveTextContent("project-xyz");
  });

  it("renders a MessageCard for each message", () => {
    __messagesData = [
      { id: "m1", content: "Hello", role: "USER", Fragment: null, createdAt: new Date("2025-01-01T00:00:00Z"), type: "TEXT" },
      { id: "m2", content: "Hi there!", role: "ASSISTANT", Fragment: { id: "f1" }, createdAt: new Date("2025-01-02T00:00:00Z"), type: "TEXT" },
    ];
    renderUI();

    const cards = screen.queryAllByTestId("message-card");
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText("Hello")).toBeInTheDocument();
    expect(within(cards[1]).getByText("Hi there!")).toBeInTheDocument();
    expect(cards[0]).toHaveAttribute("data-role", "USER");
    expect(cards[1]).toHaveAttribute("data-role", "ASSISTANT");
    expect(cards[0]).toHaveTextContent("no-fragment");
    expect(cards[1]).toHaveTextContent("has-fragment");
  });

  it("calls scrollIntoView on initial render (even with empty messages)", () => {
    const scrollSpy = setupScrollSpy();
    __messagesData = [];
    renderUI();
    expect(scrollSpy).toHaveBeenCalledTimes(1);
  });

  it("calls scrollIntoView when messages length changes", () => {
    const scrollSpy = setupScrollSpy();

    __messagesData = [{ id: "a", content: "one", role: "USER", Fragment: null, createdAt: new Date(), type: "TEXT" }];
    const { rerender } = render(
      <Suspense fallback={<div />}><MessagesContainer projectId="p" /></Suspense>
    );
    expect(scrollSpy).toHaveBeenCalledTimes(1);

    // Grow the list and re-render; hook reads latest __messagesData
    __messagesData = [
      { id: "a", content: "one", role: "USER", Fragment: null, createdAt: new Date(), type: "TEXT" },
      { id: "b", content: "two", role: "ASSISTANT", Fragment: null, createdAt: new Date(), type: "TEXT" },
    ];
    rerender(<Suspense fallback={<div />}><MessagesContainer projectId="p" /></Suspense>);
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it("passes through createdAt and type props to MessageCard", () => {
    const created = new Date("2025-02-03T04:05:06Z");
    __messagesData = [{ id: "x", content: "check", role: "ASSISTANT", Fragment: null, createdAt: created, type: "SYSTEM" }];
    renderUI();

    const card = screen.getByTestId("message-card");
    expect(card).toHaveAttribute("data-type", "SYSTEM");
    expect(card).toHaveTextContent(created.toISOString());
  });
});