import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useQuery, useMutation } from "convex/react";

export const useCreateFile = () => {
  return useMutation(api.files.createFile);
};

export const useCreateFolder = () => {
  return useMutation(api.files.creatFolder);
};

export const useGetFolderContents = ({
  projectId,
  parentId,
  enabled = true,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled: boolean;
}) => {
  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId } : "skip",
  );
};

export const useRenameFile = () => {
  return useMutation(api.files.renameFile);
};

export const useRenameFolder = () => {
  return useMutation(api.files.renameFolder);
};

export const useDeleteFile = () => {
  return useMutation(api.files.deleteFile);
};
