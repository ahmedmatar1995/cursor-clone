import { createTool } from "@inngest/agent-kit";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { z } from "zod";
import { convex } from "@/lib/convex-client";

interface DeleteFilesToolOptions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileIds: z.array(z.string().min(1, "File ID is required")),
});

export const deleteFilesTool = ({ internalKey }: DeleteFilesToolOptions) => {
  return createTool({
    name: "deleteFiles",
    description:
      "delete files and folders from the project, if a folder has been deleted then all the files and folders in it will be deleted as well",
    parameters: z.object({
      fileIds: z
        .array(z.string().min(1, "File ID is required"))
        .describe("Array of files or folders IDs to delete"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = await paramsSchema.safeParse(params);
      if (!parsed.success) return `Error:${parsed.error.issues[0].message}`;
      const { fileIds } = parsed.data;

      if (fileIds.length === 0) return "Error:no files to delete";
      const file = await convex.query(api.system.getFileById, {
        internalKey,
        fileId: fileIds[0] as Id<"files">,
      });
      if (!file) return "Error:something went wrong";
      const project = await convex.query(api.system.getProjectById, {
        internalKey,
        projectId: file?.projectId as Id<"projects">,
      });
      if (!project) return "Error:something went wrong";
      const results = [];
      for (const fileId of fileIds) {
        const file = await convex.query(api.system.getFileById, {
          internalKey,
          fileId: fileId as Id<"files">,
        });
        if (!file) return "Error:something went wrong";
        results.push(file);
      }
      const isEqual = await results.every((r) => r.projectId === project._id);
      if (!isEqual) return "Error:not all files have the same projectID";
      try {
        return await toolStep?.run("delete-files", async () => {
          for (const fileId of fileIds) {
            await convex.mutation(api.system.deleteFile, {
              internalKey,
              projectId: project._id,
              fileId: fileId as Id<"files">,
            });
          }
          return `Files with IDs ${fileIds.join(", ")} has been deleted`;
        });
      } catch (err) {
        return `Error:${err instanceof Error ? err.message : "unknown error"}`;
      }
    },
  });
};
