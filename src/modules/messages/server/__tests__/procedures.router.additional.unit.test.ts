/**
 * Additional unit tests for message router procedures (getMany, create).
 * Testing library/framework: Vitest
 *
 * Notes:
 * - We mock "@/trpc/init" with a lightweight builder that runs Zod validation
 *   before invoking handlers, approximating TRPC's behavior for inputs.
 * - Prisma and Inngest are mocked to assert interactions and simulate failures.
 * - We intentionally avoid relying on any symbols from existing tests to keep this file isolated and stable.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Prisma mock
vi.mock("@/lib/db", () => {
  return {
    default: {
      message: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

// Inngest mock
vi.mock("@/inngest/client", () => ({
  inngest: {
    send: vi.fn(),
  },
}));

// TRPC init mock: run Zod schema validation on input, then call handler
vi.mock("@/trpc/init", () => {
  type Handler<TIn, TOut> = (opts: { input: TIn }) => Promise<TOut> | TOut;

  const makeBuilder = <TIn = any, TOut = any>(schema?: any) => ({
    // Allow chaining input again if needed (not required here but harmless)
    input(nextSchema?: any) {
      return makeBuilder(nextSchema ?? schema);
    },
    query(fn: Handler<TIn, TOut>) {
      const z = schema;
      return async ({ input }: { input: any }) => {
        const parsed = z ? z.parse(input) : input;
        return fn({ input: parsed });
      };
    },
    mutation(fn: Handler<TIn, TOut>) {
      const z = schema;
      return async ({ input }: { input: any }) => {
        const parsed = z ? z.parse(input) : input;
        return fn({ input: parsed });
      };
    },
  });

  return {
    baseProcedure: {
      input(schema: any) {
        return makeBuilder(schema);
      },
    },
    createTRPCRouter(routes: any) {
      // Return a simple map where each procedure is a callable function
      return routes;
    },
  };
});

// Import after mocks so the module under test sees mocked dependencies
import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { messageRouter } from "../procedures";

describe("messageRouter (additional unit tests)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getMany", () => {
    it("returns messages and queries Prisma with expected where/include/orderBy", async () => {
      const messages = [
        {
          id: "m1",
          projectId: "proj-1",
          content: "hello",
          role: "USER",
          type: "RESULT",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          Fragment: [],
        },
      ];
      (prisma.message.findMany as any).mockResolvedValue(messages);

      const input = { projectId: "proj-1" };
      const result = await messageRouter.getMany({ input });

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { projectId: "proj-1" },
        include: { Fragment: true },
        orderBy: { updatedAt: "asc" },
      });
      expect(result).toEqual(messages);
    });

    it("returns empty array when no messages exist", async () => {
      (prisma.message.findMany as any).mockResolvedValue([]);
      const result = await messageRouter.getMany({ input: { projectId: "none" } });
      expect(result).toEqual([]);
    });

    it("rejects when projectId is empty (Zod validation)", async () => {
      await expect(
        messageRouter.getMany({ input: { projectId: "" } as any })
      ).rejects.toThrow(/Project ID is required/i);
    });

    it("propagates Prisma errors", async () => {
      (prisma.message.findMany as any).mockRejectedValue(new Error("DB down"));
      await expect(
        messageRouter.getMany({ input: { projectId: "proj" } })
      ).rejects.toThrow("DB down");
    });

    it("accepts special characters in projectId", async () => {
      (prisma.message.findMany as any).mockResolvedValue([]);
      await messageRouter.getMany({ input: { projectId: "proj-123_ABC.xyz" } });

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: { projectId: "proj-123_ABC.xyz" },
        include: { Fragment: true },
        orderBy: { updatedAt: "asc" },
      });
    });
  });

  describe("create", () => {
    const baseCreated = {
      id: "new-1",
      projectId: "proj-1",
      content: "content",
      role: "USER",
      type: "RESULT",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("creates a message and sends an Inngest event with expected payload", async () => {
      (prisma.message.create as any).mockResolvedValue(baseCreated);
      (inngest.send as any).mockResolvedValue({ id: "evt-1" });

      const input = { value: "content", projectId: "proj-1" };
      const result = await messageRouter.create({ input });

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: {
          projectId: "proj-1",
          content: "content",
          role: "USER",
          type: "RESULT",
        },
      });
      expect(inngest.send).toHaveBeenCalledWith({
        name: "code-agent/run",
        data: {
          value: "content",
          projectId: "proj-1",
        },
      });
      expect(result).toEqual(baseCreated);
    });

    it("enforces min/max content length (Zod validation)", async () => {
      await expect(
        messageRouter.create({ input: { value: "", projectId: "p" } as any })
      ).rejects.toThrow(/Message is Required/i);

      await expect(
        messageRouter.create({
          input: { value: "a".repeat(1001), projectId: "p" } as any,
        })
      ).rejects.toThrow(/Message is too long/i);
    });

    it("requires non-empty projectId (Zod validation)", async () => {
      await expect(
        messageRouter.create({ input: { value: "ok", projectId: "" } as any })
      ).rejects.toThrow(/Project ID is required/i);
    });

    it("propagates Prisma creation failures and does not send event", async () => {
      (prisma.message.create as any).mockRejectedValue(new Error("Unique violation"));

      await expect(
        messageRouter.create({ input: { value: "x", projectId: "p" } })
      ).rejects.toThrow("Unique violation");

      expect(inngest.send).not.toHaveBeenCalled();
    });

    it("propagates Inngest failures after successful creation", async () => {
      (prisma.message.create as any).mockResolvedValue(baseCreated);
      (inngest.send as any).mockRejectedValue(new Error("Inngest unavailable"));

      await expect(
        messageRouter.create({ input: { value: "y", projectId: "p" } })
      ).rejects.toThrow("Inngest unavailable");

      expect(prisma.message.create).toHaveBeenCalledTimes(1);
      expect(inngest.send).toHaveBeenCalledTimes(1);
    });

    it("sets role USER and type RESULT regardless of input", async () => {
      (prisma.message.create as any).mockResolvedValue(baseCreated);
      (inngest.send as any).mockResolvedValue({ id: "evt" });

      await messageRouter.create({
        input: { value: "abc", projectId: "p" },
      });

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ role: "USER", type: "RESULT" }),
      });
    });

    it("accepts exactly 1000 characters and special characters", async () => {
      const thousand = "a".repeat(1000);
      (prisma.message.create as any).mockResolvedValue({
        ...baseCreated,
        content: thousand,
      });
      (inngest.send as any).mockResolvedValue({ id: "evt" });

      const r1 = await messageRouter.create({
        input: { value: thousand, projectId: "p" },
      });
      expect(r1.content).toBe(thousand);

      const special =
        "Test 🚀 with émojis & special chars: <script>alert('xss')</script>";
      (prisma.message.create as any).mockResolvedValue({
        ...baseCreated,
        content: special,
      });
      const r2 = await messageRouter.create({
        input: { value: special, projectId: "p" },
      });
      expect(r2.content).toBe(special);
    });

    it("handles concurrent creations", async () => {
      (inngest.send as any).mockResolvedValue({ id: "evt" });
      (prisma.message.create as any).mockImplementation(async ({ data }: any) => ({
        ...baseCreated,
        id: `id-${data.content}`,
        content: data.content,
        projectId: data.projectId,
      }));

      const inputs = [
        { value: "m1", projectId: "proj" },
        { value: "m2", projectId: "proj" },
        { value: "m3", projectId: "proj" },
      ];
      const results = await Promise.all(inputs.map((input) => messageRouter.create({ input })));

      expect(prisma.message.create).toHaveBeenCalledTimes(3);
      expect(inngest.send).toHaveBeenCalledTimes(3);
      expect(results.map((r) => r.content)).toEqual(["m1", "m2", "m3"]);
    });
  });

  describe("router shape", () => {
    it("exposes callable procedures", () => {
      expect(typeof messageRouter.getMany).toBe("function");
      expect(typeof messageRouter.create).toBe("function");
    });
  });
});