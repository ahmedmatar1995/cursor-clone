import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";

interface UpdateFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  content: z.string(),
});

export const updateFileTool = ({ internalKey }: UpdateFileToolOptions) => {
  return createTool({
    name: "updateFile",
    description: "Update the content of an existing file",
    parameters: z.object({
      fileId: z
        .string()
        .min(1, "File ID is required")
        .describe("the ID of the file to update"),
      content: z.string().describe("the content of the file to update"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = await paramsSchema.safeParse(params);
      if (!parsed.success) return `Error: ${parsed.error.issues[0].message}`;
      const { fileId, content } = parsed.data;

      const file = await convex.query(api.system.getFileById, {
        fileId: fileId as Id<"files">,
        internalKey,
      });

      if (!file) return `Error:${fileId} file not found`;

      if (file.type === "folder")
        return `Error:${fileId} is a folder not a file, you can only update the content of files not folders`;

      try {
        return await toolStep?.run("update-file", async () => {
          const file_id = await convex.mutation(api.system.updateFile, {
            fileId: fileId as Id<"files">,
            internalKey,
            content,
          });
          return { success: true, file_id };
        });
      } catch (err) {
        return `Error: ${err instanceof Error ? err.message : "unknown error"}`;
      }
    },
  });
};
