import { Id } from "convex/_generated/dataModel";
import { FileIcon } from "@react-symbols/icons/utils";
import { useFilePath } from "@/features/projects/hooks/use-files";
import { useEditor } from "../hooks/use-editor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import React from "react";

export const FileBreadcrumbs = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const { activeTabId } = useEditor(projectId);
  const filePath = useFilePath(activeTabId as Id<"files">);
  if (filePath === undefined || !activeTabId) {
    return (
      <div className="p-2 bg-background border-b">
        <Breadcrumb>
          <BreadcrumbList className="gap-0.5">
            <BreadcrumbItem className="text-sm">
              <BreadcrumbPage>&nbsp;</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    );
  }
  return (
    <div className="p-2 bg-background border-b">
      <Breadcrumb>
        <BreadcrumbList className="gap-0.5">
          {filePath.map((file, index) => {
            const isLast = index === filePath.length - 1;
            return (
              <React.Fragment key={file._id}>
                <BreadcrumbItem className="text-xs">
                  {isLast ? (
                    <BreadcrumbPage className="flex items-center gap-1">
                      <FileIcon
                        className="size-4"
                        autoAssign
                        fileName={file.name}
                      />
                      {file.name}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href="#">{file.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="size-4" />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
