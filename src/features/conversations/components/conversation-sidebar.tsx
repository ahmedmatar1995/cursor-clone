import { Id } from "convex/_generated/dataModel";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageAction,
  MessageActions,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import {
  Check,
  CopyIcon,
  HistoryIcon,
  LoaderIcon,
  MoveRight,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { DEFAULT_CONVERSATION_TITLE } from "convex/constants";
import {
  useConversation,
  useConversationsByProject,
  useCreateConversation,
  useMessages,
} from "../hooks/use-conversation";
import { useState } from "react";
import { toast } from "sonner";
import Ky from "ky";
import { PastConversationDialog } from "./past-conversations-dialog";

export const ConversationSidebar = ({
  projectId,
}: {
  projectId: Id<"projects">;
}) => {
  const [selectedConversationId, setSelectedConversationId] =
    useState<Id<"conversations"> | null>(null);
  const [input, setInput] = useState("");
  const [pastConversationsOpen, setPastConversationsOpen] = useState(false);
  const create = useCreateConversation();
  const conversations = useConversationsByProject(projectId);
  const activeConversationId =
    selectedConversationId ?? conversations?.[0]?._id ?? null;
  const activeConversation = useConversation(activeConversationId);
  const conversationMessages = useMessages(activeConversationId);
  const isProcessing = conversationMessages?.some(
    (msg) => msg.status === "processing",
  );
  const handleCreateConversation = async () => {
    try {
      const conversationId = await create({
        projectId,
        title: DEFAULT_CONVERSATION_TITLE,
      });
      setSelectedConversationId(conversationId);
      return conversationId;
    } catch (err) {
      toast.error("unable to create new conversation");
      return null;
    }
  };
  const handleCancel = async () => {
    try {
      await Ky.post("/api/messages/cancel", {
        json: {
          projectId,
        },
      });
    } catch (err) {
      toast.error("unable to cancel request");
    }
  };
  const handleSubmit = async (message: PromptInputMessage) => {
    if (isProcessing && !message.text) {
      handleCancel();
      setInput("");
      return;
    }

    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await handleCreateConversation();
      if (!conversationId) return;
    }

    try {
      await Ky.post("/api/messages", {
        json: {
          conversationId,
          message: message.text,
        },
      });
      setInput("");
    } catch (err) {
      console.error("Message send error:", err);
      toast.error("Failed to send a message");
    }

    setInput("");
  };

  return (
    <>
      <PastConversationDialog
        open={pastConversationsOpen}
        onOpenChange={setPastConversationsOpen}
        projectId={projectId}
        onSelect={() => {}}
      />
      <div className="flex flex-col gap-4 bg-sidebar h-full">
        <div className="h-8.75 flex items-center justify-between border-b">
          <div className="text-sm truncate pl-3">
            {activeConversation?.title ?? DEFAULT_CONVERSATION_TITLE}
          </div>
          <div className="flex items-center px-1 gap-1">
            <Button
              size="icon-xs"
              variant="highlight"
              onClick={() => setPastConversationsOpen((prev) => !prev)}
            >
              <HistoryIcon className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="highlight"
              onClick={handleCreateConversation}
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        </div>
        <Conversation className="flex-1">
          <ConversationContent>
            {conversationMessages?.map((msg, index) => (
              <Message key={msg._id} from={msg.role}>
                <MessageContent>
                  {msg.status === "processing" && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <LoaderIcon className="size-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  )}
                  {msg.status === "failed" && (
                    <div className="flex items-center gap-2 text-destructive">
                      <XIcon className="size-4" />
                      <MessageResponse>{msg.content}</MessageResponse>
                    </div>
                  )}
                  {msg.status === "cancelled" && (
                    <div className="flex items-center gap-2 text-muted-foreground italic">
                      <MoveRight className="size-4" />
                      <MessageResponse>
                        {msg.content || "Request cancelled"}
                      </MessageResponse>
                    </div>
                  )}
                  {msg.status === "completed" && (
                    <div className="flex items-center gap-2">
                      {msg.role === "assistant" && (
                        <Check className="size-4 text-primary" />
                      )}
                      <MessageResponse>{msg.content}</MessageResponse>
                    </div>
                  )}
                </MessageContent>
                {msg.role == "assistant" &&
                  msg.status === "completed" &&
                  index === (conversationMessages.length ?? 0) - 1 && (
                    <MessageAction
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      label="Copy"
                    >
                      <CopyIcon className="size-3.5" />
                    </MessageAction>
                  )}
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton></ConversationScrollButton>
        </Conversation>
        <div className="p-3">
          <PromptInput onSubmit={handleSubmit} className="mt-2">
            <PromptInputBody>
              <PromptInputTextarea
                placeholder="Ask Polaris Anything"
                onChange={(e) => setInput(e.target.value)}
                value={input}
                disabled={isProcessing}
              ></PromptInputTextarea>
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools />
              <PromptInputSubmit
                disabled={!input && !isProcessing}
                onStop={handleCancel}
                status={isProcessing ? "streaming" : undefined}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </>
  );
};
