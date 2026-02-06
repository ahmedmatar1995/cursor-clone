import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";

import { getItemPadding } from "./constants";
import { Doc } from "convex/_generated/dataModel";
import React from "react";

interface Props {
  item: Doc<"files">;
  children: React.ReactNode;
  level: number;
  isActive?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
}

export const TreeItemWrapper = ({
  item,
  children,
  level,
  isActive,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
}: Props) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onRename?.();
            }
          }}
          className={cn(
            "group flex items-center gap-1 w-full h-[22px] hover:bg-accent/30 outline-none focus:ring-1 focus:ring-inset focus:ring-ring",
            isActive && "bg-accent/30",
          )}
          style={{ paddingLeft: getItemPadding(level, item.type === "file") }}
        >
          {children}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-64"
      >
        {item.type === "folder" && (
          <>
            <ContextMenuItem className="text-sm" onClick={onCreateFile}>
              New File...
            </ContextMenuItem>
            <ContextMenuItem className="text-sm" onClick={onCreateFolder}>
              New Folder...
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem className="text-sm" onClick={onRename}>
          Rename
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem className="text-sm" onClick={onDelete}>
          Delete Permanently...
          <ContextMenuShortcut>Backspace</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
