import { createTool } from "@inngest/agent-kit";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { convex } from "@/lib/convex-client";
import { z } from "zod";

interface createFolderToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

const paramsSchema = z.object({
  name: z.string().min(1, "folder name is required"),
  parentId: z.string().optional(),
});

export const createFolderTool = ({
  internalKey,
  projectId,
}: createFolderToolOptions) => {
  return createTool({
    name: "createFolder",
    description: "Create a new folder in the project",
    parameters: z.object({
      name: z
        .string()
        .min(1, "folder name is required")
        .describe("the name of the folder to create"),
      parentId: z
        .string()
        .optional()
        .describe("the parent folder of the folder to create"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = await paramsSchema.safeParse(params);
      if (!parsed.success) return `Errro:${parsed.error.issues[0].message}`;
      const { name, parentId } = parsed.data;

      try {
        return await toolStep?.run("create-folder", async () => {
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

          const folderId = await convex.mutation(api.system.createFolder, {
            internalKey,
            projectId,
            parentId: resolvedParentId,
            name,
          });

          return `Created folder ${name} with id ${folderId}`;
        });
      } catch (err) {
        return `Error:${err instanceof Error ? err.message : "unknown error"}`;
      }
    },
  });
};
