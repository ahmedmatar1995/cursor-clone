import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

interface ReadFilesToolOpions {
  internalKey: string;
}

const paramsSchema = z.object({
  fileIds: z
    .array(z.string().min(1, "File ID cannot be empty"))
    .min(1, "insert at least one fileId"),
});

export const createReadFilesTool = ({ internalKey }: ReadFilesToolOpions) => {
  return createTool({
    name: "readFiles",
    description:
      "Read the file content from the project and return the file content ",
    parameters: z.object({
      fileIds: z
        .array(z.string().min(1, "File ID cannot be empty"))
        .describe("Array of file IDs to read"),
    }),
    handler: async (params, { step: toolStep }) => {
      const parsed = paramsSchema.safeParse(params);
      if (!parsed.success) {
        return `Error:${parsed.error.issues[0].message}`;
      }

      const { fileIds } = parsed.data;

      try {
        const results = await toolStep?.run("read-files-content", async () => {
          const fetchedResults: {
            id: Id<"files">;
            name: string;
            content: string;
          }[] = [];
          for (const fileId of fileIds) {
            const file = await convex.query(api.system.getFileById, {
              internalKey,
              fileId: fileId as Id<"files">,
            });
            if (file && file.content) {
              fetchedResults.push({
                id: file._id,
                name: file.name,
                content: file.content,
              });
            }
          }
          return fetchedResults;
        });

        if (!results || results.length === 0) {
          return `Error:no files found with the provided Ids, use listFiles to get valid file Ids`;
        }

        return JSON.stringify(results);
      } catch (err) {
        return `Error Reading Files:${err instanceof Error ? err.message : "unknown Error"}`;
      }
    },
  });
};
