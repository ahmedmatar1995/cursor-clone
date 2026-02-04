import * as Sentry from "@sentry/tanstackstart-react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/sentry-demo")({
  component: Step6Page,

  // When the route fails, TanStack renders this instead of crashing.
  // Because it's handled, we manually capture it.
  errorComponent: ({ error }) => {
    useEffect(() => {
      Sentry.captureException(error);
    }, [error]);

    return (
      <div style={{ padding: 16 }}>
        <h1>Step 6 - errorComponent caught an error</h1>
        <pre>{String(error)}</pre>
      </div>
    );
  },
});

function Step6Page() {
  // Throw during render to force route error handling
  throw new Error("Route render failed (Step 6 - errorComponent)");
}
