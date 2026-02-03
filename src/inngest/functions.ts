import { inngest } from "./client";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY as string,
});

export const generateDemo = inngest.createFunction(
  { id: "demo-generate" },
  {
    event: "app/demo-generate",
  },
  async ({ step }) => {
    await step.sleep("wait for 5s", "5s");
    await step.run("generate-text", async () => {
      return await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: "generate a short random wisedom",
      });
    });
  },
);
