/** Placeholder test file created to receive edge-case tests. */

/* Added edge-case tests: await params and fire-and-forget prefetch
 * Framework: Vitest + React Testing Library
 */
describe("Page (/projects/[projectId]) - edge cases", () => {
  it("supports params passed as a Promise (covers `const { projectId } = await params`)", async () => {
    // Import Page defined at top of file; cast to any to allow Promise for params
    const el = await (Page as any)({ params: Promise.resolve({ projectId: "promised-42" }) });
    render(el as any);

    const { trpc } = await import("@/trpc/server");
    expect(trpc.messages.getMany.prefetch).toHaveBeenCalledWith({ projectId: "promised-42" });
    expect(trpc.projects.getOne.prefetch).toHaveBeenCalledWith({ id: "promised-42" });
    expect(await screen.findByTestId("project-view")).toHaveTextContent("promised-42");
  });

  it("does not await prefetch calls (fire-and-forget semantics)", async () => {
    const { trpc } = await import("@/trpc/server");

    // Make prefetch return a never-resolving promise; if Page awaited it, the test would time out
    const never = new Promise<void>(() => {});
    (trpc.messages.getMany.prefetch as any).mockImplementation(() => never);
    // Note: projects.getOne.prefetch references the same vi.fn in this test file's mock.

    // Ensure Page resolves quickly by racing with a short timeout
    const result = await Promise.race([
      (Page as any)({ params: { projectId: "ff-99" } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Page awaited prefetch (should not)")), 300)),
    ]);

    render(result as any);
    expect(screen.getByTestId("project-view")).toHaveTextContent("ff-99");
  });
});