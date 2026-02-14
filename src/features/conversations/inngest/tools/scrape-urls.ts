import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { firecrawl } from "@/lib/firecrawl";

const paramsSchema = z.object({
  urls: z
    .array(z.url("Invalid Url Format"))
    .min(1, "Provide at least one URL to scrape"),
});

export const createScrapeUrlsTool = () => {
  return createTool({
    name: "scrapeUrls",
    description:
      "Scrape Content from Urls to get documentation or reference materials. use this when user provides a Urls or references externals documentation. Return markdown from the scraped pages",
    parameters: z.object({
      urls: z
        .array(z.url("Invalid Url Format"))
        .min(1, "Provide at least one URL to scrape")
        .describe("the Urls to fetch & scrape content from"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = await paramsSchema.safeParse(params);
      if (!parsed.success) return `Error:${parsed.error.issues[0].message}`;
      const { urls } = parsed.data;
      const results: { url: string; content: string }[] = [];

      try {
        return await toolStep?.run("scrape-urls", async () => {
          for (const url of urls) {
            const result = await firecrawl.scrape(url, {
              formats: ["markdown"],
            });
            if (result.markdown)
              results.push({ url, content: result.markdown });
            else results.push({ url, content: "Failed to scrape Url" });
          }
          if (results.length === 0)
            return "Error:no content provided from the scraped urls";
          return JSON.stringify(results);
        });
      } catch (err) {
        return `Error:${err instanceof Error ? err.message : "unknown error"}`;
      }
    },
  });
};
