import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  ChevronRightIcon,
  CopyMinusIcon,
  FilePlusCornerIcon,
  FolderPlusIcon,
} from "lucide-react";
import { Id } from "convex/_generated/dataModel";
import { useProject } from "../../hooks/use-projects";
import { Button } from "@/components/ui/button";
import {
  useCreateFile,
  useCreateFolder,
  useGetFolderContents,
} from "../../hooks/use-files";
import { CreateInput } from "./create-input";
import { LoadingRow } from "./loading-row";
import { Tree } from "./tree";

export const FileExplorer = ({ projectId }: { projectId: Id<"projects"> }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [collapseKey, setCollapseKey] = useState(0);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const project = useProject(projectId);

  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  const handleCreate = (name: string) => {
    setCreating(null);
    if (creating === "file") {
      createFile({
        name,
        projectId,
        content: "",
        parentId: undefined,
      });
    } else {
      createFolder({
        name,
        projectId,
        parentId: undefined,
      });
    }
  };
  const rootFiles = useGetFolderContents({ projectId, enabled: isOpen });
  return (
    <div className="h-full bg-sidebar">
      <ScrollArea>
        <div
          role="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group/project cursor-pointer w-full text-left flex items-center justify-between gap-[0.5px] h-[22px] bg-accent font-bold"
        >
          <div className="flex items-center">
            <ChevronRightIcon
              className={cn(
                "size-4 shrink-0 text-muted-foreground",
                isOpen && "rotate-90",
              )}
            />
            <p className="text-xs uppercase line-clamp-1">
              {project?.name ?? "Loading"}
            </p>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(true);
                setCreating("file");
              }}
              size="icon-xs"
              variant="highlight"
            >
              <FilePlusCornerIcon className="size-3.5" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsOpen(true);
                setCreating("folder");
              }}
              size="icon-xs"
              variant="highlight"
            >
              <FolderPlusIcon className="size-3.5" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setCollapseKey((prev) => prev + 1);
              }}
              size="icon-xs"
              variant="highlight"
            >
              <CopyMinusIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        {isOpen && (
          <>
            {rootFiles === undefined && <LoadingRow level={0} />}
            {creating && (
              <CreateInput
                type={creating}
                level={0}
                onSubmit={handleCreate}
                onCancel={() => {}}
              />
            )}
            {rootFiles?.map((file) => (
              <Tree
                key={`${file._id}-${collapseKey}`}
                file={file}
                level={0}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </ScrollArea>
    </div>
  );
};
