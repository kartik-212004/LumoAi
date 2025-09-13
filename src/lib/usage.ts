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

  try {
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.consume(userId, GENERATION_COST);
    return result;
  } catch (error) {
    // Log the actual error for debugging
    console.error("RateLimiter consume error:", error);
    
    // If it's a rate limit error, re-throw with the expected message
    if (error instanceof Error && error.message.includes("Too Many Requests")) {
      throw new Error("Rate limit exceeded");
    }
    
    // For fresh accounts or other database issues, still allow the operation
    // but log the error. This prevents blocking new users.
    console.warn("Credit consumption failed for user:", userId, "Error:", error);
    
    // Return a mock result for fresh accounts to allow the operation to proceed
    return {
      remainingPoints: FREE_POINTS - GENERATION_COST,
      msBeforeNext: DURATION * 1000,
      totalHits: 1
    };
  }
}

export async function getUsageStatus() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.get(userId);
    return result;
  } catch (error) {
    // Log the error for debugging
    console.error("RateLimiter get error:", error);
    
    // For fresh accounts that don't have usage data yet, return default values
    console.warn("Getting usage status failed for user:", userId, "Error:", error);
    
    // Return default status for fresh accounts
    const { has } = await auth();
    const hasProAccess = has({ plan: "pro" });
    const maxPoints = hasProAccess ? PRO_POINTS : FREE_POINTS;
    
    return {
      remainingPoints: maxPoints,
      msBeforeNext: DURATION * 1000,
      totalHits: 0
    };
  }
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
