import { createRouter } from "@tanstack/react-router";
import * as Sentry from "@sentry/tanstackstart-react";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},

    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  if (!router.isServer) {
    Sentry.init({
      dsn: "https://examplePublicKey@o0.ingest.sentry.io/0",
      // Optional: sends request headers + IP (PII!)
      sendDefaultPii: true,
      integrations: [
        // add integrations here (Replay/Tracing/etc) if you want
      ],
    });
  }

  return router;
};
