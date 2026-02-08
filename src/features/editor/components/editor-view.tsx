import { Id } from "convex/_generated/dataModel";
import { TopNavigation } from "./top-navigation";
import { useEditor } from "../hooks/use-editor";
import { FileBreadcrumbs } from "./file-breadcrumbs";
import { useFile, useUpdateFile } from "@/features/projects/hooks/use-files";
import { CodeEditor } from "./code-editor";
import { useRef } from "react";

const DEBOUNCE_MS = 1500;

export const EditorView = ({ projectId }: { projectId: Id<"projects"> }) => {
  const { activeTabId } = useEditor(projectId);
  const activeFile = useFile(activeTabId as Id<"files">);
  const updateFile = useUpdateFile();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveFileBinary = activeFile && activeFile?.storageId;
  const isActiveFileText = activeFile && !activeFile?.storageId;
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center">
        <TopNavigation projectId={projectId} />
      </div>
      {activeTabId && <FileBreadcrumbs projectId={projectId} />}
      <div className="flex-1 min-h-0 bg-background">
        {!activeTabId && (
          <div className="size-full flex items-center justify-center"></div>
        )}
        {isActiveFileText && (
          <CodeEditor
            key={activeFile._id}
            fileName={activeFile.name}
            initialValue={activeFile.content ?? ""}
            onChange={(content: string) => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              timeoutRef.current = setTimeout(() => {
                updateFile({ id: activeFile._id, content });
              }, DEBOUNCE_MS);
            }}
          />
        )}
        <p>{isActiveFileBinary && <p>implement binary preview</p>}</p>
      </div>
    </div>
  );
};
