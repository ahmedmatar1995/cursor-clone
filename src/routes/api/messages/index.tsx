import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@clerk/tanstack-react-start/server";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { inngest } from "@/inngest/client";

const requestSchema = z.object({
  conversationId: z.string(),
  message: z.string(),
});

export const Route = createFileRoute("/api/messages/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          console.log("=== Message API Called ===");
          const { userId } = await auth();
          console.log("User ID:", userId);

          if (!userId)
            return Response.json({ error: "unAuthorized" }, { status: 401 });

          const internalKey = process.env.VITE_CONVEX_INTERNAL_KEY as string;
          if (!internalKey) {
            console.error("Internal key not found");
            return Response.json(
              { error: "internal key not found" },
              { status: 400 },
            );
          }

          const body = await request.json();
          console.log("Request body:", body);

          const { conversationId, message } = await requestSchema.parse(body);

          console.log("Fetching conversation:", conversationId);
          const conversation = await convex.query(
            api.system.getConversationById,
            {
              conversationId: conversationId as Id<"conversations">,
              internalKey,
            },
          );

          if (!conversation) {
            console.error("Conversation not found:", conversationId);
            return Response.json(
              { error: "conversation not found" },
              { status: 404 },
            );
          }

          const projectId = conversation.projectId;
          console.log("Creating user message...");

          const processingMessages = await convex.query(
            api.system.getProjectProcessingMessages,
            { projectId },
          );

          if (processingMessages.length > 0) {
            await Promise.all(
              processingMessages.map(async (msg) => {
                await inngest.send({
                  name: "app/cancel-message",
                  data: {
                    messageId: msg._id,
                  },
                });

                await convex.mutation(api.system.updateMessageStatus, {
                  messageId: msg._id,
                  internalKey,
                  status: "cancelled",
                });

                return msg._id;
              }),
            );
          }

          const userMessageId = await convex.mutation(
            api.system.createMessage,
            {
              projectId,
              conversationId: conversationId as Id<"conversations">,
              content: message,
              role: "user",
              internalKey,
              status: "completed",
              userId,
            },
          );

          console.log("Creating assistant message...");
          const assistantMessageId = await convex.mutation(
            api.system.createMessage,
            {
              projectId,
              conversationId: conversationId as Id<"conversations">,
              content: "",
              role: "assistant",
              internalKey,
              status: "processing",
              userId,
            },
          );

          const event = inngest.send({
            name: "app/process-message",
            data: {
              messageId: assistantMessageId,
              projectId,
              conversationId,
              message,
            },
          });

          console.log("Messages created successfully");
          return Response.json(
            {
              success: true,
              eventId: (await event).ids[0],
              messageId: assistantMessageId,
            },
            { status: 201 },
          );
        } catch (error) {
          console.error("=== Message API Error ===", error);
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Internal server error",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
