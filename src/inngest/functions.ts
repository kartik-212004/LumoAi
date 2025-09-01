import { inngest } from "./client";
import { Sandbox } from "@e2b/code-interpreter";
import { openai, createAgent, Agent } from "@inngest/agent-kit";
import { getSandbox } from "./utils";
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },

  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandbox-id", async () => {
      const sandbox = await Sandbox.create("vibe-nextjs-testkartik");
      return sandbox.sandboxId;
    });
    const summerizer = createAgent({
      name: "code-agent",
      system:
        "You are an expert Next.js developer. You write readable, maintainable code. You write simple next.js and react snippets",
      model: openai({ model: "gpt-4o" }),
    });

    const { output } = await summerizer.run(
      `Summerize the following text : ${event.data.value}}`
    );
    console.log(output);
    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    });

    return { output, sandboxUrl };
  }
);
