import { createFileRoute } from "@tanstack/react-router";
import { inngest } from "@/inngest/client";

export const Route = createFileRoute("/api/background/")({
  server: {
    handlers: {
      POST: async () => {
        await inngest.send({ name: "app/demo-generate", data: {} });
        console.log("we will test the inngest function");
        return new Response(JSON.stringify({ status: "Started" }));
      },
    },
  },
});
