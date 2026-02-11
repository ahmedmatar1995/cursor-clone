import { createFileRoute } from "@tanstack/react-router";
import { serve } from "inngest/edge";
import { inngest } from "@/inngest/client";
import { generateDemo, generateError } from "@/inngest/functions";
import { processMessage } from "@/features/conversations/inngest/process-message";

const handler = serve({
  client: inngest,
  functions: [generateDemo, generateError, processMessage],
});

export const Route = createFileRoute("/api/inngest")({
  server: {
    handlers: {
      GET: async ({ request }) => handler(request),
      POST: async ({ request }) => handler(request),
      PUT: async ({ request }) => handler(request),
    },
  },
});
