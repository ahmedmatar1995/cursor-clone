import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { auth } from "@clerk/tanstack-react-start/server";
import { inngest } from "@/inngest/client";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

const requestSchema = z.object({
  projectId: z.string(),
});

export const Route = createFileRoute("/api/messages/cancel/")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { userId } = await auth();
        if (!userId)
          return Response.json({ error: "unAuthorized" }, { status: 401 });
        const body = await request.json();
        const { projectId } = await requestSchema.parse(body);

        const internalKey = process.env.VITE_CONVEX_INTERNAL_KEY as string;
        if (!internalKey)
          return Response.json(
            { error: "internal key not found" },
            { status: 500 },
          );

        const processingMessages = await convex.query(
          api.system.getProcessingMessages,
          {
            internalKey,
            projectId: projectId as Id<"projects">,
          },
        );

        if (processingMessages.length === 0) {
          return Response.json(
            { success: true, cancelled: false },
            { status: 200 },
          );
        }

        const cancellIds = await Promise.all(
          processingMessages.map(async (msg) => {
            await inngest.send({
              name: "app/cancel-message",
              data: {
                messageId: msg._id,
              },
            });
            await convex.mutation(api.system.updateMessageStatus, {
              internalKey,
              messageId: msg._id,
              status: "cancelled",
            });

            return msg._id;
          }),
        );

        return Response.json({
          success: true,
          cancelled: true,
          messageIds: cancellIds,
        });
      },
    },
  },
});
