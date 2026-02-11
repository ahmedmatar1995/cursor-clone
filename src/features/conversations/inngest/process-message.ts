import { Id } from "convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";

interface MessageEvent {
  messageId: Id<"messages">;
}

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
    retries: 0,
    cancelOn: [
      {
        event: "app/cancel-message",
        if: "event.data.messageId == async.data.messageId",
      },
    ],
    onFailure: async ({ event, step, error }) => {
      console.log("=== Inngest onFailure Started ===");
      console.log("Error:", error);

      // Attempt to extract messageId from various possible paths in the failure event
      const originalEvent = event.data?.event;
      const messageId = originalEvent?.data?.messageId;

      console.log("Extracted MessageId from onFailure:", messageId);

      const internalKey =
        process.env.VITE_CONVEX_INTERNAL_KEY ||
        (typeof import.meta !== "undefined" &&
          import.meta.env?.VITE_CONVEX_INTERNAL_KEY);

      if (!internalKey) {
        console.error(
          "CRITICAL: Internal key missing in onFailure handler! Cannot update message status.",
        );
        return;
      }

      if (messageId) {
        try {
          await step.run("update-message-on-failure", async () => {
            console.log("Updating message status to failed for ID:", messageId);
            await convex.mutation(api.system.updateMessageContent, {
              messageId,
              internalKey,
              content:
                "My Apologies, Cannot Respond to your message. Please check server logs.",
              status: "failed",
            });
          });
        } catch (err) {
          console.error("Failed to run update-message-on-failure step:", err);
        }
      } else {
        console.error(
          "Could not find messageId in failure event payload",
          JSON.stringify(event.data, null, 2),
        );
      }
    },
  },
  {
    event: "app/process-message",
  },
  async ({ event, step }) => {
    console.log("=== Inngest processMessage Started ===");
    const { messageId } = event.data as MessageEvent;

    const internalKey =
      process.env.VITE_CONVEX_INTERNAL_KEY ||
      (typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_CONVEX_INTERNAL_KEY);

    console.log("Internal Key found in main function:", !!internalKey);
    console.log("Processing messageId:", messageId);

    if (!internalKey) {
      console.error("Internal key not found in main function!");
      throw new NonRetriableError("internal key not found");
    }

    await step.sleep("pretend to wait ai processing", "5s");
    console.log(
      "Woke up from sleep, proceeding with intentional failure core...",
    );

    try {
      await step.run("throw-error", () => {
        console.log("Executing intentional failure step...");
        throw new NonRetriableError("intentional test failure");
      });
    } catch (err) {
      console.log(
        "Main function caught error from step.run (rethrowing for onFailure):",
        err,
      );
      throw err;
    }

    // This part should theoretically not be reached due to the throw above
    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        messageId,
        content: "this content processed by ai (Success Case)",
        internalKey,
        status: "completed",
      });
    });
  },
);
