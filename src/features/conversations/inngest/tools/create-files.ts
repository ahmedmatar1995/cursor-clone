import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { convex } from "@/lib/convex-client";

interface CreateFilesToolOptions {
  internalKey: string;
  projectId: Id<"projects">;
}

const paramsSchema = z.object({
  parentId: z.string(),
  files: z
    .array(
      z.object({
        name: z.string().min(1, "File name is required"),
        content: z.string(),
      }),
    )
    .min(1, "At least one file is required"),
});

export const createFilesTool = ({
  internalKey,
  projectId,
}: CreateFilesToolOptions) => {
  return createTool({
    name: "createFiles",
    description:
      "create multiple file at once in the same folder, use this to batch create files that share the same parent folder, more efficient than creating files one by one",
    parameters: z.object({
      parentId: z.string(),
      files: z
        .array(
          z.object({
            name: z
              .string()
              .min(1, "File name is required")
              .describe("the file name including extension"),
            content: z.string().describe("the file content"),
          }),
        )
        .min(1, "At least one file is required")
        .describe("Array of files to create"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = await paramsSchema.safeParse(params);
      if (!parsed.success) return `Error:${parsed.error.issues[0].message}`;
      const { parentId, files } = parsed.data;

      try {
        return await toolStep?.run("create-files", async () => {
          let resolvedParentId: Id<"files"> | undefined;
          if (parentId && parentId !== "") {
            resolvedParentId = parentId as Id<"files">;
            const parentFolder = await convex.query(api.system.getFileById, {
              fileId: resolvedParentId,
              internalKey,
            });
            if (!parentFolder) return `Error:${resolvedParentId} not found`;
            if (parentFolder.type !== "folder")
              return `Error:${parentFolder.name} is a file not a folder`;
            if (parentFolder.projectId !== projectId)
              return `Error:${parentFolder.name} is not in the same project`;
          }

          const results = await convex.mutation(api.system.createFiles, {
            internalKey,
            projectId,
            parentId: resolvedParentId,
            files,
          });

          const created = results.filter((r) => !r.error);
          const failed = results.filter((r) => r.error);
          let response = `Created ${created.length} file(s)`;

          if (created.length > 0) {
            response += `:${created.map((r) => r.name).join(", ")}`;
          }

          if (failed.length > 0) {
            response += `:${failed.map((r) => `${r.name} (${r.error})`).join(", ")}`;
          }

          return response;
        });
      } catch (err) {
        return `Error:${err instanceof Error ? err.message : "unknown error"}`;
      }
    },
  });
};
