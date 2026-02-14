import { createTool } from "@inngest/agent-kit";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { z } from "zod";

interface RenameFileToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileId: z.string().min(1, "File ID is required"),
  newName: z.string().min(1, "New name is required"),
});

export const createRenameFileTool = ({
  internalKey,
}: RenameFileToolOptions) => {
  return createTool({
    name: "renameFile",
    description: "Rename an existing file or folder by its ID",
    parameters: z.object({
      fileId: z
        .string()
        .min(1, "File ID is required")
        .describe("the id of the file to rename"),
      newName: z
        .string()
        .min(1, "New Name is required")
        .describe(
          "the new name for the file or folder including extension if applicable",
        ),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = await paramsSchema.safeParse(params);
      if (!parsed.success) return `Error:${parsed.error.issues[0].message}`;
      const { fileId, newName } = parsed.data;
      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileId as Id<"files">,
      });
      if (!file) return `Error:${fileId} not found`;

      const project = await convex.query(api.system.getProjectById, {
        internalKey,
        projectId: file.projectId,
      });
      if (!project) return `Error:${file.projectId} not found`;

      try {
        await toolStep?.run("rename-file", async () => {
          return await convex.mutation(api.system.renameFile, {
            internalKey,
            projectId: file.projectId,
            fileId: fileId as Id<"files">,
            newName,
          });
        });
        return `File ${fileId} has been renamed to ${newName}`;
      } catch (err) {
        return `Error:${err instanceof Error ? err.message : "unknown error"}`;
      }
    },
  });
};
