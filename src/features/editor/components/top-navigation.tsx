import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Id } from "convex/_generated/dataModel";
import { useEditor } from "../hooks/use-editor";
import { useFile } from "@/features/projects/hooks/use-files";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { FileIcon } from "@react-symbols/icons/utils";
import { XIcon } from "lucide-react";

const Tab = ({
  fileId,
  projectId,
  isFirst,
}: {
  fileId: Id<"files">;
  projectId: Id<"projects">;
  isFirst: boolean;
}) => {
  const file = useFile(fileId);
  const { activeTabId, setActiveTab, previewTabId, openFile, closeTab } =
    useEditor(projectId);
  const isActive = activeTabId === file?._id;
  const isPreview = previewTabId === file?._id;
  const fileName = file?.name ?? "Loading...";

  return (
    <div
      onClick={() => setActiveTab(fileId)}
      onDoubleClick={() => openFile(fileId, { pinned: true })}
      className={cn(
        "flex items-center gap-x-2 h-[35px] px-4  cursor-pointer text-muted-foreground group border-y border-x border-transparent hover:bg-accent/30",
        isActive &&
          "bg-background text-foreground border-x-border border-b-background -mb-px drop-shadow",
        isFirst && "border-l-transparent!",
      )}
    >
      {file === undefined ? (
        <Spinner className="text-ring" />
      ) : (
        <FileIcon fileName={fileName} autoAssign className="size-3.5" />
      )}
      <span className={cn("text-xs whitespace-nowrap", isPreview && "italic")}>
        {fileName}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          closeTab(fileId);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            closeTab(fileId);
          }
        }}
        className={cn(
          "p-0.5 rounded-sm hover:bg-white/10 opacity-0 grouo-hover:opacity-100",
          isActive && "opacity-100",
        )}
      >
        <XIcon className="size-3" />
      </button>
    </div>
  );
};

export const TopNavigation = ({ projectId }: { projectId: Id<"projects"> }) => {
  const { openTabs } = useEditor(projectId);
  return (
    <ScrollArea className="flex-1">
      <nav className="bg-sidebar flex items-center h-[35px] border-b">
        {openTabs.map((fileId, index) => (
          <Tab
            key={fileId}
            fileId={fileId}
            projectId={projectId}
            isFirst={index === 0}
          />
        ))}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};
