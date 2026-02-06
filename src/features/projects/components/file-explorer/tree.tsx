import { Id, Doc } from "convex/_generated/dataModel";
import { ChevronRightIcon } from "lucide-react";
import { FolderIcon, FileIcon } from "@react-symbols/icons/utils";
import { cn } from "@/lib/utils";
import {
  useCreateFile,
  useCreateFolder,
  useGetFolderContents,
  useRenameFile,
  useDeleteFile,
  useRenameFolder,
} from "../../hooks/use-files";
import { getItemPadding } from "./constants";
import { LoadingRow } from "./loading-row";
import { CreateInput } from "./create-input";
import { useState } from "react";
import { TreeItemWrapper } from "./tree-item-wrapper";
import { RenameInput } from "./rename-input";

interface Props {
  file: Doc<"files">;
  level?: number;
  projectId: Id<"projects">;
}

export const Tree = ({ file, level = 0, projectId }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);
  const createFile = useCreateFile();
  const renameFile = useRenameFile();
  const renameFolder = useRenameFolder();
  const createFolder = useCreateFolder();
  const deleteFile = useDeleteFile();
  const files = useGetFolderContents({
    projectId,
    parentId: file._id,
    enabled: file.type === "folder" && isOpen,
  });
  const handleRename = (newName: string) => {
    setIsRenaming(false);
    if (newName === file.name) return;
    if (file.type === "file") {
      renameFile({ id: file._id, newName });
    } else {
      renameFolder({ id: file._id, newName });
    }
  };
  if (file.type === "file") {
    if (isRenaming) {
      return (
        <RenameInput
          type="file"
          level={level}
          defaultValue={file.name}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
      );
    }
    return (
      <TreeItemWrapper
        item={file}
        level={level}
        isActive={false}
        onClick={() => setIsOpen((prev) => !prev)}
        onRename={() => setIsRenaming(true)}
        onDelete={() => {
          deleteFile({ id: file._id });
        }}
      >
        <FileIcon fileName={file.name} autoAssign className="size-4" />
        <span className="truncate text-sm">{file.name}</span>
      </TreeItemWrapper>
    );
  }
  const folderName = file.name;
  const handleCreate = (name: string) => {
    setCreating(null);
    if (creating === "file") {
      createFile({
        name,
        projectId,
        content: "",
        parentId: file._id,
      });
    } else {
      createFolder({
        name,
        projectId,
        parentId: file._id,
      });
    }
  };
  const startCreating = (type: "file" | "folder") => {
    setIsOpen(true);
    setCreating(type);
  };
  const folderContent = (
    <>
      <div className="flex items-center gap-0.5">
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground",
            isOpen && "rotate-90",
          )}
        />
        <FolderIcon folderName={folderName} className="size-4" />
      </div>
      <span className="truncate text-sm">{folderName}</span>
    </>
  );

  if (creating) {
    return (
      <>
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="group flex items-center gap-1 h-[22px] hover:bg-accent/30 cursor-pointer w-full"
          style={{ paddingLeft: getItemPadding(level, false) }}
        >
          {folderContent}
        </button>
        {isOpen && (
          <>
            {files === undefined && <LoadingRow level={level + 1} />}
            <CreateInput
              type={creating}
              level={level + 1}
              onSubmit={handleCreate}
              onCancel={() => setCreating(null)}
            />
            {files?.map((file) => (
              <Tree
                key={file._id}
                file={file}
                level={level + 1}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <>
      {isRenaming ? (
        <RenameInput
          type="folder"
          level={level}
          defaultValue={file.name}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
      ) : (
        <TreeItemWrapper
          item={file}
          isActive={false}
          level={level}
          onClick={() => setIsOpen((prev) => !prev)}
          onRename={() => setIsRenaming(true)}
          onDelete={() => {
            deleteFile({ id: file._id });
          }}
          onCreateFile={() => startCreating("file")}
          onCreateFolder={() => startCreating("folder")}
        >
          {folderContent}
        </TreeItemWrapper>
      )}

      {isOpen && (
        <>
          {files === undefined && <LoadingRow level={level + 1} />}
          {files?.map((subItem) => (
            <Tree
              key={subItem._id}
              file={subItem}
              level={level + 1}
              projectId={projectId}
            />
          ))}
        </>
      )}
    </>
  );
};
