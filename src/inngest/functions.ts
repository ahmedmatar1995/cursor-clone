import { inngest } from "./client";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { app } from "@/lib/firecrawl";
import { NonRetriableError } from "inngest";

const google = createGoogleGenerativeAI({
  apiKey: process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY as string,
});

const URL_REGEX = /https?:\/\/[^\s]+/g;

export const generateDemo = inngest.createFunction(
  { id: "demo-generate" },
  {
    event: "app/demo-generate",
  },
  async ({ event, step }) => {
    const { prompt } = event.data as { prompt: string };
    const urls = (await step.run("extract-urls", () => {
      return prompt.match(URL_REGEX) ?? [];
    })) as string[];

    const scrapedContent = await step.run("scrape-urls", async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          const result = await app.scrape(url, { formats: ["markdown"] });

          return result.markdown ?? null;
        }),
      );
      console.log(results);
      return results.filter(Boolean).join("\n\n");
    });

    const finalPrompt = scrapedContent
      ? `Context:\n${scrapedContent}\n\nQuestion: ${prompt}`
      : prompt;

    const result = await step.run("generate-text", async () => {
      return await generateText({
        model: google("gemini-2.5-flash-lite"),
        prompt: finalPrompt,
      });
    });

    return result;
  },
);

export const generateError = inngest.createFunction(
  { id: "demo-error" },
  { event: "app/demo-error" },
  async ({}) => {
    throw new NonRetriableError("inngest error: something went wrong");
  },
);
