import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const validateInternalKey = (key: string) => {
  const internalKey = process.env.VITE_CONVEX_INTERNAL_KEY as string;
  if (!internalKey) throw new Error("internal key not found");
  if (key !== internalKey) throw new Error("invalid internal key");
};

export const getConversationById = query({
  args: {
    conversationId: v.id("conversations"),
    internalKey: v.string(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    return await ctx.db.get(args.conversationId);
  },
});

export const createMessage = mutation({
  args: {
    internalKey: v.string(),
    userId: v.string(),
    projectId: v.id("projects"),
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("conversation not found");
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== args.userId)
      throw new Error("unAuthorized to access this project");
    const message = await ctx.db.insert("messages", {
      projectId: args.projectId,
      conversationId: args.conversationId,
      content: args.content,
      role: args.role,
      internalKey: args.internalKey,
      status: args.status,
      updatedAt: Date.now(),
    });

    await ctx.db.patch(args.conversationId, {
      updatedAt: Date.now(),
    });

    return message;
  },
});

export const updateMessageContent = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("processing"),
        v.literal("completed"),
        v.literal("cancelled"),
        v.literal("failed"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);

    await ctx.db.patch(args.messageId, {
      content: args.content,
      status: args.status ?? "completed",
    });
  },
});

export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);

    await ctx.db.patch(args.messageId, {
      status: args.status,
    });
  },
});
