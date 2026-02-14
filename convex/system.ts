import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { indentLess } from "@codemirror/commands";
import { Id } from "./_generated/dataModel";

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

    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("message not found");

    await ctx.db.patch(args.messageId, {
      content: args.content,
      status: args.status ?? "completed",
    });
  },
});

export const getProcessingMessages = query({
  args: {
    projectId: v.id("projects"),
    internalKey: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "processing"),
      )
      .collect();
    return messages;
  },
});

export const updateMessageStatus = mutation({
  args: {
    internalKey: v.string(),
    messageId: v.id("messages"),
    status: v.union(
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const message = await ctx.db.get("messages", args.messageId);
    if (!message) throw new Error("message not found");
    return await ctx.db.patch(args.messageId, {
      status: args.status,
    });
  },
});

export const getProjectProcessingMessages = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const internalKey = process.env.VITE_CONVEX_INTERNAL_KEY as string;
    await validateInternalKey(internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    const processingMessages = await ctx.db
      .query("messages")
      .withIndex("by_project_status", (q) =>
        q.eq("projectId", args.projectId).eq("status", "processing"),
      )
      .collect();

    return processingMessages;
  },
});

export const getRecentMessages = query({
  args: {
    conversationId: v.id("conversations"),
    internalKey: v.string(),
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    validateInternalKey(args.internalKey);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("conversation not found");
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", conversation._id),
      )
      .order("asc")
      .collect();

    const limit = args.limit ?? 10;
    return messages.slice(-limit);
  },
});

export const updateConversationTitle = mutation({
  args: {
    conversationId: v.id("conversations"),
    internalKey: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const conversation = await ctx.db.get("conversations", args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    const updatedConversation = await ctx.db.patch(conversation._id, {
      title: args.title,
      updatedAt: Date.now(),
    });
    return updatedConversation;
  },
});

export const getProjectFiles = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    const files = await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", project._id))
      .collect();
    if (!files || files.length === 0) return [];
    return files;
  },
});

export const getFileById = query({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    return await ctx.db.get("files", args.fileId);
  },
});

export const updateFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const file = await ctx.db.get("files", args.fileId);
    if (!file) throw new Error("file not found");
    return await ctx.db.patch(file._id, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    internalKey: v.string(),
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", project._id).eq("parentId", args.parentId),
      )
      .collect();

    const existing = await files.find(
      (file) => file.name === args.name && file.type === "file",
    );
    if (existing) throw new Error("file name already exists");
    return await ctx.db.insert("files", {
      projectId: project._id,
      parentId: args.parentId,
      name: args.name,
      content: args.content,
      updatedAt: Date.now(),
      type: "file",
    });
  },
});

export const createFiles = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    internalKey: v.string(),
    files: v.array(
      v.object({
        name: v.string(),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    const existingFiles = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", project._id).eq("parentId", args.parentId),
      )
      .collect();

    const results: { name: string; fileId: Id<"files">; error?: string }[] = [];

    for (const file of args.files) {
      const existing = existingFiles.find(
        (f) => f.name === file.name && f.type === "file",
      );

      if (existing) {
        results.push({
          name: file.name,
          fileId: existing._id as Id<"files">,
          error: "File Already exists",
        });
        continue;
      }

      const fileId = await ctx.db.insert("files", {
        name: file.name,
        projectId: project._id,
        parentId: args.parentId,
        content: file?.content ?? "",
        updatedAt: Date.now(),
        type: "file",
      });

      results.push({ name: file.name, fileId });
    }
    return results;
  },
});

export const createFolder = mutation({
  args: {
    name: v.string(),
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    internalKey: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", project._id).eq("parentId", args.parentId),
      )
      .collect();
    const existing = await files.find(
      (file) => file.name === args.name && file.type === "folder",
    );
    if (existing) throw new Error("folder name already exists");
    const folderId = await ctx.db.insert("files", {
      name: args.name,
      projectId: project._id,
      parentId: args.parentId,
      updatedAt: Date.now(),
      type: "folder",
    });

    return folderId;
  },
});

export const renameFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    projectId: v.id("projects"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const file = await ctx.db.get("files", args.fileId);
    if (!file) throw new Error("file not found");

    const siblingFiles = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", file.parentId),
      )
      .collect();

    const existing = await siblingFiles.find(
      (f) =>
        f.name === args.newName && f.type === "file" && f._id !== args.fileId,
    );

    if (existing) throw new Error("file name already exists");

    const updatedFile = await ctx.db.patch(file._id, {
      name: args.newName,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });

    return updatedFile;
  },
});

export const renameFolder = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    projectId: v.id("projects"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const file = await ctx.db.get("files", args.fileId);
    if (!file) throw new Error("folder not found");

    if (file.type !== "folder") throw new Error("folder not found");

    const siblingFiles = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", file.parentId),
      )
      .collect();

    const existing = await siblingFiles.find(
      (f) =>
        f.name === args.newName && f.type === "folder" && f._id !== args.fileId,
    );

    if (existing) throw new Error("folder name already exists");

    const updatedFolder = await ctx.db.patch(file._id, {
      name: args.newName,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });

    return updatedFolder;
  },
});

export const deleteFile = mutation({
  args: {
    internalKey: v.string(),
    fileId: v.id("files"),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const file = await ctx.db.get("files", args.fileId);
    if (!file) throw new Error("file not found");

    const deleteRecursive = async (fileId: Id<"files">) => {
      const file = await ctx.db.get("files", fileId);
      if (!file) throw new Error("file not found");
      if (file.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_project_parent", (q) =>
            q.eq("projectId", args.projectId).eq("parentId", file._id),
          )
          .collect();
        for (const child of children) {
          await deleteRecursive(child._id);
        }
      }
      if (file.storageId) {
        await ctx.storage.delete(file.storageId);
      }
      await ctx.db.delete("files", fileId);
      return file._id;
    };

    await deleteRecursive(args.fileId);
    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });
    return args.fileId;
  },
});

export const getProjectById = query({
  args: {
    internalKey: v.string(),
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await validateInternalKey(args.internalKey);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    return project;
  },
});
