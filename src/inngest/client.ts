import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "Lumo",
  eventKey: process.env.INNGEST_EVENT_KEY,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  retries: 3,

  // Add logging for debugging
  logger: {
    info: (msg: string, data?: unknown) =>
      console.log("[Inngest Info]", msg, data),
    error: (msg: string, data?: unknown) =>
      console.error("[Inngest Error]", msg, data),
    warn: (msg: string, data?: unknown) =>
      console.warn("[Inngest Warn]", msg, data),
    debug: (msg: string, data?: unknown) =>
      console.debug("[Inngest Debug]", msg, data),
  },
});
