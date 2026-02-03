import Firecrawl from "@mendable/firecrawl-js";

export const app = new Firecrawl({
  apiKey: process.env.VITE_FIRECRAWL_API_KEY as string,
});
