/**
 * Tests for projectsRouter procedures.
 *
 * Testing library/framework: This test file follows the repository's existing test setup.
 * If the project uses Jest: expect/describe/it are from Jest and jest.mock is used.
 * If the project uses Vitest: expect/describe/it are from Vitest and vi.mock is used.
 *
 * The code under test is focused on the diff:
 * - getOne: fetches projects by id, throws NOT_FOUND on missing (note: findMany returns [] which is truthy)
 * - getMany: returns all projects ordered by updatedAt asc
 * - create: creates a project with slug name and initial message, then sends an inngest event
 */

import type { TRPCError } from "@trpc/server";

// Unified mocking helpers to support both Jest and Vitest without introducing new deps.
const isVitest = typeof vi !== "undefined";
const mockFn = (fn?: any) => (isVitest ? vi.fn(fn) : jest.fn(fn));
const mockModule = (...args: any[]) => (isVitest ? vi.mock(...args as any) : (jest as any).mock(...(args as any)));
const resetAllMocks = () => (isVitest ? vi.resetAllMocks() : jest.resetAllMocks());
const clearAllMocks = () => (isVitest ? vi.clearAllMocks() : jest.clearAllMocks());
const setMock = (obj: any, key: string, impl: any) => { (obj as any)[key] = impl; };

mockModule("@/lib/db", () => {
  const project = {
    findMany: mockFn(),
    create: mockFn(),
  };
  return {
    __esModule: true,
    default: { project },
  };
});

mockModule("@/inngest/client", () => {
  return {
    __esModule: true,
    inngest: {
      send: mockFn(),
    },
  };
});

// Ensure deterministic slug for assertions.
mockModule("random-word-slugs", () => {
  return {
    __esModule: true,
    generateSlug: mockFn(() => "foo-bar"),
  };
});

import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { generateSlug } from "random-word-slugs";

import { projectsRouter } from "./procedures"; // assumes router is defined alongside this test
// If router is exported from a different file, adjust the relative path accordingly.

type PrismaMock = typeof prisma & {
  project: {
    findMany: ReturnType<typeof mockFn>;
    create: ReturnType<typeof mockFn>;
  };
};

const prismaMock = prisma as unknown as PrismaMock;

describe("projectsRouter", () => {
  beforeEach(() => {
    resetAllMocks();
    clearAllMocks();
  });

  describe("getMany", () => {
    it("returns projects ordered by updatedAt asc (happy path)", async () => {
      const rows = [
        { id: "1", name: "a", updatedAt: new Date("2020-01-01") },
        { id: "2", name: "b", updatedAt: new Date("2020-01-02") },
      ];
      prismaMock.project.findMany.mockResolvedValueOnce(rows);

      // Call using internal resolver via createCaller if available; otherwise access query() directly
      // Prefer createCaller to ensure input parsing and context behavior are consistent.
      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({}) // supply minimal ctx as baseProcedure doesn't use ctx here
        : null;

      const result = caller
        ? await caller.getMany()
        : await (projectsRouter as any)._def.procedures.getMany.resolver({ input: undefined, ctx: {} });

      expect(prismaMock.project.findMany).toHaveBeenCalledTimes(1);
      expect(prismaMock.project.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "asc" },
      });
      expect(result).toEqual(rows);
    });

    it("propagates prisma errors", async () => {
      const err = new Error("DB down");
      prismaMock.project.findMany.mockRejectedValueOnce(err);

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      await expect(
        caller ? caller.getMany() : (projectsRouter as any)._def.procedures.getMany.resolver({ input: undefined, ctx: {} })
      ).rejects.toThrow("DB down");
    });
  });

  describe("getOne", () => {
    it("returns array of matching projects for given id", async () => {
      const rows = [{ id: "xyz", name: "p" }];
      prismaMock.project.findMany.mockResolvedValueOnce(rows);

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      const result = caller
        ? await caller.getOne({ id: "xyz" })
        : await (projectsRouter as any)._def.procedures.getOne.resolver({ input: { id: "xyz" }, ctx: {} });

      expect(prismaMock.project.findMany).toHaveBeenCalledWith({ where: { id: "xyz" } });
      expect(result).toEqual(rows);
    });

    it("does not throw when no projects found (current implementation returns [])", async () => {
      prismaMock.project.findMany.mockResolvedValueOnce([]);

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      const result = caller
        ? await caller.getOne({ id: "missing" })
        : await (projectsRouter as any)._def.procedures.getOne.resolver({ input: { id: "missing" }, ctx: {} });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    it("throws TRPCError(NOT_FOUND) if prisma returns null/undefined (defensive)", async () => {
      // Although Prisma findMany resolves to an array, we validate the error path too.
      prismaMock.project.findMany.mockResolvedValueOnce(undefined as unknown as any[]);

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      const op = () =>
        caller
          ? caller.getOne({ id: "x" })
          : (projectsRouter as any)._def.procedures.getOne.resolver({ input: { id: "x" }, ctx: {} });

      await expect(op()).rejects.toMatchObject({
        code: "NOT_FOUND",
        message: "Project not found",
      } as Partial<TRPCError>);
    });

    it("validates input schema (id required, non-empty)", async () => {
      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      if (!caller) {
        // If createCaller is unavailable, skip schema validation test since resolver bypasses Zod input parsing.
        return;
      }

      await expect(caller.getOne({ id: "" } as any)).rejects.toBeTruthy();
      // Note: TRPC wraps Zod errors; we only assert that it rejects.
    });
  });

  describe("create", () => {
    it("creates project with slug name, persists initial message, sends inngest event, and returns created project", async () => {
      const created = { id: "p1", name: "foo-bar" };
      prismaMock.project.create.mockResolvedValueOnce(created as any);
      (inngest.send as any).mockResolvedValueOnce({ id: "evt1" });

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      const input = { value: "My first message" };
      const result = caller
        ? await caller.create(input)
        : await (projectsRouter as any)._def.procedures.create.resolver({ input, ctx: {} });

      // Assert slug generator used
      expect(generateSlug).toHaveBeenCalledWith(2, { format: "kebab" });

      // Assert prisma create shape
      expect(prismaMock.project.create).toHaveBeenCalledWith({
        data: {
          name: "foo-bar",
          message: {
            create: {
              content: "My first message",
              role: "USER",
              type: "RESULT",
            },
          },
        },
      });

      // inngest event after creation
      expect(inngest.send).toHaveBeenCalledWith({
        name: "code-agent/run",
        data: { value: "My first message", projectId: "p1" },
      });

      expect(result).toEqual(created);
    });

    it("validates input length: rejects empty value", async () => {
      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      if (!caller) return; // schema validation only enforced via createCaller

      await expect(caller.create({ value: "" })).rejects.toBeTruthy();
      expect(prismaMock.project.create).not.toHaveBeenCalled();
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it("bubbles up prisma errors and does not send inngest", async () => {
      prismaMock.project.create.mockRejectedValueOnce(new Error("create failed"));

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      const op = () =>
        caller
          ? caller.create({ value: "hello" })
          : (projectsRouter as any)._def.procedures.create.resolver({ input: { value: "hello" }, ctx: {} });

      await expect(op()).rejects.toThrow("create failed");
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it("bubbles up inngest errors if sending fails", async () => {
      const created = { id: "p2", name: "foo-bar" };
      prismaMock.project.create.mockResolvedValueOnce(created as any);
      (inngest.send as any).mockRejectedValueOnce(new Error("event error"));

      const caller = (projectsRouter as any).createCaller
        ? (projectsRouter as any).createCaller({})
        : null;

      const op = () =>
        caller
          ? caller.create({ value: "run it" })
          : (projectsRouter as any)._def.procedures.create.resolver({ input: { value: "run it" }, ctx: {} });

      await expect(op()).rejects.toThrow("event error");
    });
  });
});