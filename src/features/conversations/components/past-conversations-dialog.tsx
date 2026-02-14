import { formatDistanceToNow } from "date-fns";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandInput,
} from "@/components/ui/command";

import {
  useConversation,
  useConversationsByProject,
} from "../hooks/use-conversation";
import { Id } from "convex/_generated/dataModel";

interface PastConversationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (conversationId: Id<"conversations">) => void;
  projectId: Id<"projects">;
}

export const PastConversationDialog = ({
  open,
  onOpenChange,
  onSelect,
  projectId,
}: PastConversationsDialogProps) => {
  const conversations = useConversationsByProject(projectId);
  const handleSelect = (conversationId: Id<"conversations">) => {
    onSelect(conversationId);
    onOpenChange(false);
  };
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Past conversations"
      description="Search & Select Past Conversations"
    >
      <CommandInput placeholder="Search Conversations" />
      <CommandList>
        <CommandEmpty>No Conversations found.</CommandEmpty>
        <CommandGroup heading="Conversations">
          {conversations?.map((conversation) => (
            <CommandItem
              key={conversation._id}
              value={`${conversation.title}-${conversation._id}`}
              onSelect={() => handleSelect(conversation._id)}
            >
              <div className="flex flex-col gap-0.5">
                <span>{conversation.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(conversation._creationTime, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
