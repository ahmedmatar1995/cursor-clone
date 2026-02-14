import { createTool } from "@inngest/agent-kit";
import { convex } from "@/lib/convex-client";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

interface ListFilesToolOptions {
  projectId: Id<"projects">;
  internalKey: string;
}

export const createListFilesTool = ({
  projectId,
  internalKey,
}: ListFilesToolOptions) => {
  return createTool({
    name: "listFiles",
    description:
      "list all files and folders in the project. Return names , IDs, types and parentID for each item, items with parent ID:null are at the root level. use the parent ID to understand the folder structure-items with the same parent id are in the same folder",
    handler: async (_, { step: toolStep }) => {
      try {
        return await toolStep?.run("list-files", async () => {
          const files = await convex.query(api.system.getProjectFiles, {
            internalKey,
            projectId,
          });
          return JSON.stringify(files);
        });
      } catch (err) {
        return `Error Reading Files: ${err instanceof Error ? err.message : "unKnown Error"}`;
      }
    },
  });
};
