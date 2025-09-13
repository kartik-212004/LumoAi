import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { consumeCredits } from "@/lib/usage";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import z from "zod";

export const messageRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z
          .string()
          .min(1, { message: "Project ID is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
          Project: {
            userId: ctx.auth.userId,
          },
        },
        include: {
          Fragment: true,
        },
        orderBy: {
          updatedAt: "asc",
        },
      });
      return messages;
    }),
  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Message is Required" })
          .max(1000, { message: "Message is too long" }),
        projectId: z
          .string()
          .min(1, { message: "Project ID is required" }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingProject = await prisma.project.findUnique({
        where: {
          id: input.projectId,
          userId: ctx.auth.userId,
        },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "User not authenticated") {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            });
          } else if (error.message === "Rate limit exceeded") {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "You have run out of credits. Please upgrade to Pro or wait for your credits to reset.",
            });
          } else {
            // Log the actual error for debugging
            console.error("Credit consumption error:", error);
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to check credits",
            });
          }
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Unknown error occurred",
          });
        }
      }

      const createdMessage = await prisma.message.create({
        data: {
          projectId: existingProject.id,
          content: input.value,
          role: "USER",
          type: "RESULT",
        },
      });
      
      try {
        const result = await inngest.send({
          name: "code-agent/run",
          data: {
            value: input.value,
            projectId: input.projectId,
          },
        });
        console.log("[Inngest] Event sent successfully:", result);
      } catch (error) {
        console.error("[Inngest] Failed to send event:", error);
        throw error;
      }
      
      return createdMessage;
    }),
});
