import { Id } from "convex/_generated/dataModel";
import { inngest } from "@/inngest/client";
import { NonRetriableError } from "inngest";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";
import { createAgent, createNetwork, gemini } from "@inngest/agent-kit";
import {
  CODING_AGENT_SYSTEM_PROMPT,
  TITLE_GENERATOR_SYSTEM_PROMPT,
} from "./constants";
import { DEFAULT_CONVERSATION_TITLE } from "convex/constants";
import { createReadFilesTool } from "./tools/read-files";
import { createListFilesTool } from "./tools/list-files";
import { updateFileTool } from "./tools/update-file";
import { createFilesTool } from "./tools/create-files";
import { createFolderTool } from "./tools/create-folder";
import { createRenameFileTool } from "./tools/rename-file";
import { deleteFilesTool } from "./tools/delete-files";
import { createScrapeUrlsTool } from "./tools/scrape-urls";

interface MessageEvent {
  messageId: Id<"messages">;
  projectId: Id<"projects">;
  conversationId: Id<"conversations">;
  message: string;
}

export const processMessage = inngest.createFunction(
  {
    id: "process-message",
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
    const { messageId, projectId, conversationId, message } =
      event.data as MessageEvent;

    const internalKey =
      process.env.VITE_CONVEX_INTERNAL_KEY ||
      (typeof import.meta !== "undefined" &&
        import.meta.env?.VITE_CONVEX_INTERNAL_KEY);

    if (!internalKey) {
      throw new NonRetriableError("internal key not found");
    }

    await step.sleep("wait for db sync", "1s");
    console.log(
      "Woke up from sleep, proceeding with intentional failure core...",
    );

    const conversation = await step.run("get-conversation", async () => {
      return await convex.query(api.system.getConversationById, {
        conversationId,
        internalKey,
      });
    });

    if (!conversation) throw new NonRetriableError("Conversation Not found");

    const recentMessages = await step.run("get-recent-messages", async () => {
      return await convex.query(api.system.getRecentMessages, {
        conversationId,
        internalKey,
        limit: 10,
      });
    });

    let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

    const contextMessages = recentMessages.filter(
      (msg) => msg._id !== messageId && msg.content.trim() !== "",
    );

    if (contextMessages.length > 0) {
      const historyText = contextMessages
        .map((msg) => `${msg.role.toUpperCase()}:${msg.content}`)
        .join("\n\n");

      systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${historyText}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
    }

    const shouldGenerateTitle =
      conversation.title === DEFAULT_CONVERSATION_TITLE;

    if (shouldGenerateTitle) {
      const titleAgent = createAgent({
        name: "title-generator",
        system: TITLE_GENERATOR_SYSTEM_PROMPT,
        model: gemini({
          model: "gemini-2.5-flash-lite",
          apiKey: process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY as string,
        }),
      });

      const { output } = await titleAgent.run(message, { step });

      const textMessage = output.find(
        (m) => m.type === "text" && m.role === "assistant",
      );

      if (textMessage?.type === "text") {
        const title =
          typeof textMessage.content === "string"
            ? textMessage.content.trim()
            : textMessage.content
                .map((c) => c.text)
                .join("")
                .trim();

        if (title) {
          await step.run("update-conversation-title", async () => {
            await convex.mutation(api.system.updateConversationTitle, {
              conversationId,
              internalKey,
              title,
            });
          });
        }
      }
    }

    const codingAgent = createAgent({
      name: "coding-dev",
      description: "an ai coding expert",
      system: systemPrompt,
      model: gemini({
        model: "gemini-2.5-flash-lite",
        apiKey: process.env.VITE_GOOGLE_GENERATIVE_AI_API_KEY as string,
      }),
      tools: [
        createReadFilesTool({ internalKey }),
        createListFilesTool({ projectId, internalKey }),
        updateFileTool({ internalKey }),
        createFilesTool({ internalKey, projectId }),
        createFolderTool({ internalKey, projectId }),
        createRenameFileTool({ internalKey }),
        deleteFilesTool({ internalKey }),
        createScrapeUrlsTool(),
      ],
    });

    const network = createNetwork({
      name: "polaris-network",
      agents: [codingAgent],
      maxIter: 20,
      router: ({ network }) => {
        const lastResult = network.state.results.at(-1);
        const hasTextResponse = lastResult?.output.find(
          (m) => m.type === "text" && m.role === "assistant",
        );

        const hasToolCalls = lastResult?.output.find(
          (m) => m.type === "tool_call",
        );

        if (hasTextResponse && !hasToolCalls) return undefined;

        return codingAgent;
      },
    });

    const result = await network.run(message);

    const lastResult = result.state.results.at(-1);
    const textMessage = lastResult?.output.find(
      (m) => m.type === "text" && m.role === "assistant",
    );

    let assistantResponse =
      "I proceed your request, let me know if you need anything else";

    if (textMessage?.type === "text") {
      assistantResponse =
        typeof textMessage.content === "string"
          ? textMessage.content
          : textMessage.content.map((c) => c.text).join("");
    }

    await step.run("update-assistant-message", async () => {
      await convex.mutation(api.system.updateMessageContent, {
        messageId,
        content: assistantResponse,
        internalKey,
        status: "completed",
      });
    });

    return { success: true, messageId, conversationId };
  },
);
