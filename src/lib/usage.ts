import { RateLimiterPrisma } from "rate-limiter-flexible";
import { auth } from "@clerk/nextjs/server";
import prisma from "./db";

const FREE_POINTS = 5;
const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;
const PRO_POINTS = 100;

export async function getUsageTracker() {
  const { has } = await auth();
  const hasProAccess = has({ plan: "pro" });

  const usageTracker = new RateLimiterPrisma({
    storeClient: prisma,
    tableName: "Usage",
    points: hasProAccess ? PRO_POINTS : FREE_POINTS,
    duration: DURATION,
  });

  return usageTracker;
}

export async function consumeCredits() {
  const { userId, has } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.consume(userId, GENERATION_COST);
  return result;
}

export async function getUsageStatus() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  const usageTracker = await getUsageTracker();
  const result = await usageTracker.get(userId);
  return result;
}

// export async function getUserPlanInfo() {
//   const { userId, has } = await auth();

//   if (!userId) {
//     throw new Error("User not authenticated");
//   }

//   const hasProAccess = has({ plan: "pro" });

//   return {
//     userId,
//     hasProAccess,
//     maxPoints: hasProAccess ? PRO_POINTS : FREE_POINTS,
//     pointsPerGeneration: GENERATION_COST,
//   };
// }
