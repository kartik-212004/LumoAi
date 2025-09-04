/**
 * Tests for MessageCard component.
 *
 * Assumptions:
 * - React Testing Library is available (common in Next.js projects).
 * - JSDOM test environment is configured by the project's chosen runner (Jest or Vitest).
 *
 * Note on testing library and framework:
 * - These tests use @testing-library/react (queries/assertions) and @testing-library/user-event for interactions.
 * - They should run under either Jest or Vitest when jsdom and DOM matchers are set up (e.g., via jest-dom).
 */

import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// The component under test is the default export `MessageCard`
import MessageCard from "./message-card"; // same folder as test in provided path

// Mock next/image to avoid Next.js image optimization errors in jsdom
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

// Mock "@/components/ui/card" to a simple div wrapper for test stability
jest.mock("@/components/ui/card", () => ({
  Card: ({ className, children }: any) => (
    <div data-testid="ui-card" className={className}>
      {children}
    </div>
  ),
}));

// Mock cn to just join truthy classes (keeps class presence testable)
jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

// Provide types compatible with prisma enums used by component
type MessageRole = "USER" | "ASSISTANT" | "SYSTEM" | (string & {});
type MessageType = "RESULT" | "ERROR" | "THOUGHT" | (string & {});
type Fragment = {
  id: string;
  title: string;
};

const makeDate = (iso?: string) => (iso ? new Date(iso) : new Date("2025-01-02T03:04:05.000Z"));

describe("MessageCard", () => {
  test("renders UserMessage when role is not ASSISTANT", () => {
    render(
      <MessageCard
        content="Hello from user"
        role={"USER" as MessageRole}
        fragment={null}
        createdAt={makeDate()}
        isActiveFragment={false}
        onFragmentClick={jest.fn()}
        type={"THOUGHT" as MessageType}
      />
    );

    // User bubble rendered to the right with Card wrapper
    expect(screen.getByTestId("ui-card")).toBeInTheDocument();
    expect(screen.getByText("Hello from user")).toBeInTheDocument();
    // Should not render assistant header text 'Lumo'
    expect(screen.queryByText("Lumo")).not.toBeInTheDocument();
  });

  test("renders AssistantMessage when role is ASSISTANT with header and logo", () => {
    const date = makeDate("2025-09-04T19:45:00.000Z");
    render(
      <MessageCard
        content="Assistant says hi"
        role={"ASSISTANT" as MessageRole}
        fragment={null}
        createdAt={date}
        isActiveFragment={false}
        onFragmentClick={jest.fn()}
        type={"THOUGHT" as MessageType}
      />
    );

    // Header shows brand and logo image
    expect(screen.getByText("Lumo")).toBeInTheDocument();

    // Date text exists in DOM (CSS visibility doesn't affect text query)
    // Expected format: HH:mm 'on' MM dd, yyyy (24-hour)
    // 19:45 UTC on 09 04, 2025
    expect(screen.getByText(/19:45 on 09 04, 2025/)).toBeInTheDocument();

    // Content visible
    expect(screen.getByText("Assistant says hi")).toBeInTheDocument();
  });

  test("shows FragmentCard only when fragment provided AND type === 'RESULT'", async () => {
    const user = userEvent.setup();
    const fragment: Fragment = { id: "frag-1", title: "Build Output" };
    const onFragmentClick = jest.fn();

    render(
      <MessageCard
        content="Here is your result"
        role={"ASSISTANT" as MessageRole}
        fragment={fragment}
        createdAt={makeDate()}
        isActiveFragment={false}
        onFragmentClick={onFragmentClick}
        type={"RESULT" as MessageType}
      />
    );

    // Fragment card should be visible with title and "Preview"
    const button = screen.getByRole("button", { name: /build output/i });
    const utils = within(button);
    expect(utils.getByText("Build Output")).toBeInTheDocument();
    expect(utils.getByText("Preview")).toBeInTheDocument();

    // Click triggers callback with fragment
    await user.click(button);
    expect(onFragmentClick).toHaveBeenCalledTimes(1);
    expect(onFragmentClick).toHaveBeenCalledWith(fragment);
  });

  test("does NOT show FragmentCard if fragment is null even when type === 'RESULT'", () => {
    render(
      <MessageCard
        content="No fragment available"
        role={"ASSISTANT" as MessageRole}
        fragment={null}
        createdAt={makeDate()}
        isActiveFragment={false}
        onFragmentClick={jest.fn()}
        type={"RESULT" as MessageType}
      />
    );

    // No button with fragment title/preview
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("No fragment available")).toBeInTheDocument();
  });

  test("does NOT show FragmentCard if type !== 'RESULT' even when fragment exists", () => {
    const fragment: Fragment = { id: "frag-2", title: "Chunk A" };

    render(
      <MessageCard
        content="Non-result message"
        role={"ASSISTANT" as MessageRole}
        fragment={fragment}
        createdAt={makeDate()}
        isActiveFragment={false}
        onFragmentClick={jest.fn()}
        type={"THOUGHT" as MessageType}
      />
    );

    expect(screen.queryByRole("button", { name: /chunk a/i })).not.toBeInTheDocument();
    expect(screen.getByText("Non-result message")).toBeInTheDocument();
  });

  test("applies error styling when type === 'ERROR'", () => {
    const { container } = render(
      <MessageCard
        content="Something went wrong"
        role={"ASSISTANT" as MessageRole}
        fragment={null}
        createdAt={makeDate()}
        isActiveFragment={false}
        onFragmentClick={jest.fn()}
        type={"ERROR" as MessageType}
      />
    );

    // The root wrapper toggles red text classes in error state; assert class presence
    const root = container.querySelector(".group");
    expect(root).toBeTruthy();
    expect(root!.className).toMatch(/text-red-700/);
  });

  test("FragmentCard reflects active state styling via class names", async () => {
    const fragment: Fragment = { id: "frag-3", title: "Active Fragment" };
    const { rerender } = render(
      <MessageCard
        content="With active fragment"
        role={"ASSISTANT" as MessageRole}
        fragment={fragment}
        createdAt={makeDate()}
        isActiveFragment={false}
        onFragmentClick={jest.fn()}
        type={"RESULT" as MessageType}
      />
    );

    const inactiveBtn = screen.getByRole("button", { name: /active fragment/i });
    expect(inactiveBtn.className).toMatch(/bg-muted/);
    expect(inactiveBtn.className).not.toMatch(/bg-primary/);

    rerender(
      <MessageCard
        content="With active fragment"
        role={"ASSISTANT" as MessageRole}
        fragment={fragment}
        createdAt={makeDate()}
        isActiveFragment={true}
        onFragmentClick={jest.fn()}
        type={"RESULT" as MessageType}
      />
    );

    const activeBtn = screen.getByRole("button", { name: /active fragment/i });
    expect(activeBtn.className).toMatch(/bg-primary/);
    expect(activeBtn.className).toMatch(/text-primary-foreground/);
  });
});