import { ChevronRightIcon } from "lucide-react";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useState } from "react";
import { getItemPadding } from "./constants";
import { cn } from "@/lib/utils";

interface Props {
  type: "file" | "folder" | null;
  defaultValue: string;
  isOpen?: boolean;
  level: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

export const RenameInput = ({
  type,
  level,
  defaultValue,
  isOpen,
  onSubmit,
  onCancel,
}: Props) => {
  const [value, setValue] = useState(defaultValue);
  const handleSubmit = () => {
    const trimmedValue = value.trim() || defaultValue;
    if (trimmedValue) {
      onSubmit(trimmedValue);
    } else {
      onCancel();
    }
  };
  return (
    <div
      className="w-full mt-2 flex items-center gap-1 h-[22px] bg-accent/30"
      style={{ paddingLeft: getItemPadding(level, type === "file") }}
    >
      <div className="flex items-center gap-0.5">
        {type === "folder" && (
          <ChevronRightIcon
            className={cn(
              "size-4 shrink-0 text-muted-foreground",
              isOpen && "rotate-90",
            )}
          />
        )}
        {type === "file" && (
          <FileIcon fileName={value} autoAssign className="size-4" />
        )}
        {type === "folder" && (
          <FolderIcon folderName={value} className="size-4" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none focus:ring-1 focus:ring-inset focus:ring-ring"
          autoFocus
          onBlur={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSubmit();
            } else if (e.key === "Escape") {
              onCancel();
            } else return;
          }}
          onFocus={(e) => {
            if (type === "folder") {
              e.currentTarget.select();
            } else {
              const value = e.currentTarget.value;
              const lastDotIndex = value.lastIndexOf(".");
              if (lastDotIndex > 0) {
                e.currentTarget.setSelectionRange(0, lastDotIndex);
              } else {
                e.currentTarget.select();
              }
            }
          }}
        />
      </div>
    </div>
  );
};
