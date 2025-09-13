import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { codeAgentFunction } from "@/inngest/functions";

// Log environment info for debugging
console.log("[Inngest] Environment:", {
  NODE_ENV: process.env.NODE_ENV,
  hasEventKey: !!process.env.INNGEST_EVENT_KEY,
  hasSigningKey: !!process.env.INNGEST_SIGNING_KEY,
  isDev: process.env.NODE_ENV === "development",
});

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [codeAgentFunction],
});
