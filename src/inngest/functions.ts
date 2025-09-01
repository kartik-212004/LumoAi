import { inngest } from "./client";
import { openai, createAgent, Agent } from "@inngest/agent-kit";
export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },

  async ({ event, step }) => {
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

    return { message: `Hello ${event.data.value}!` };
  }
);
