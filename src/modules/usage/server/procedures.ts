import { getUsageStatus } from "@/lib/usage";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const usageRouter = createTRPCRouter({
  status: protectedProcedure.query(async () => {
    try {
      const result = await getUsageStatus();
      return result;
    } catch (error) {
      // Log the error for debugging
      console.error("Usage status query error:", error);
      
      // Return null for client to handle gracefully
      return null;
    }
  }),
});
