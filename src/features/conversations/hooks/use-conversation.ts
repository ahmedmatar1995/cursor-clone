import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useCreateConversation = () => {
  return useMutation(api.conversations.create);
};

export const useConversation = (id: Id<"conversations"> | null) => {
  return useQuery(
    api.conversations.getById,
    id ? { conversationId: id } : "skip",
  );
};

export const useConversationsByProject = (projectId: Id<"projects">) => {
  return useQuery(
    api.conversations.getByProject,
    projectId ? { projectId } : "skip",
  );
};

export const useMessages = (conversationId: Id<"conversations"> | null) => {
  return useQuery(
    api.conversations.getMessages,
    conversationId ? { conversationId } : "skip",
  );
};
