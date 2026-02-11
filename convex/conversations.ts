import { api } from "./_generated/api";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuth } from "./auth";
import { validateInternalKey } from "./system";

export const create = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");

    const conversation = await ctx.db.insert("conversations", {
      projectId: args.projectId,
      title: args.title,
      updatedAt: Date.now(),
    });

    return conversation;
  },
});

export const getByProject = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");

    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();

    return conversations;
  },
});

export const getById = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("conversation not found");
    const project = await ctx.db.get("projects", conversation.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");
    return conversation;
  },
});

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("conversation not found");
    const project = await ctx.db.get("projects", conversation.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    return messages;
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("conversation not found");
    const project = await ctx.db.get("projects", conversation.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    const message = await ctx.db.insert("messages", {
      projectId: project._id,
      conversationId: args.conversationId,
      content: args.content,
      role: args.role,
      status: "processing",
      updatedAt: Date.now(),
    });

    return message;
  },
});
