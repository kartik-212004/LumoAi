import { RateLimiterPrisma } from "rate-limiter-flexible";
import { auth } from "@clerk/nextjs/server";
import prisma from "./db";

const FREE_POINTS = 2;
const DURATION = 30 * 24 * 60 * 60;
const GENERATION_COST = 1;
const PRO_POINTS = 100;

export async function getUsageTracker() {
  const { has } = await auth();
  const hasProAccess = has({ plan: "pro" });
  
  // Debug logging
  console.log("Pro access check:", hasProAccess);

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

  // Check if user has pro plan
  const hasProAccess = has({ plan: "pro" });
  
  try {
    const usageTracker = await getUsageTracker();
    const result = await usageTracker.consume(userId, GENERATION_COST);
    return result;
  } catch (error) {
    // If user has pro plan, don't throw rate limit errors
    if (hasProAccess) {
      console.warn("Pro user hit rate limit, allowing anyway:", error);
      return { remainingPoints: PRO_POINTS };
    }
    
    // For free users, throw the rate limit error
    throw new Error("Rate limit exceeded");
  }
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

export async function getUserPlanInfo() {
  const { userId, has } = await auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const hasProAccess = has({ plan: "pro" });
  
  return {
    userId,
    hasProAccess,
    maxPoints: hasProAccess ? PRO_POINTS : FREE_POINTS,
    pointsPerGeneration: GENERATION_COST,
  };
}
