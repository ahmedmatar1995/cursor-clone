import { requireAuth } from "@/lib/require-auth";
import { query, mutation } from "./_generated/server";
import { verifyAuth } from "./auth";
import { v } from "convex/values";
import { file } from "zod";
import { arSA } from "date-fns/locale";
import { addToRange } from "react-day-picker";
import { Files } from "lucide-react";
import { Doc, Id } from "./_generated/dataModel";

export const getFiles = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");

    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");

    return await ctx.db
      .query("files")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .collect();
  },
});

export const getFile = query({
  args: {
    id: v.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("file not found");

    const project = await ctx.db.get("projects", file?.projectId);
    if (!project) throw new Error("project not found");

    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");

    return file;
  },
});

export const getFolderContents = query({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    const project = await ctx.db.get("projects", args.projectId);

    if (!project) throw new Error("project not found");

    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", project._id).eq("parentId", args.parentId),
      )
      .collect();

    files.sort((a, b) => {
      if (a.type === "folder" && b.type === "file") return -1;
      if (a.type === "file" && b.type === "folder") return 1;

      return a.name.localeCompare(b.name);
    });
    return files;
  },
});

export const createFile = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");

    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();

    const existing = files?.find(
      (file) => file.name === args.name && file.type === "file",
    );
    if (existing) throw new Error("file with this name already exists");
    const file = await ctx.db.insert("files", {
      name: args.name,
      updatedAt: Date.now(),
      projectId: args.projectId,
      content: args.content,
      type: "file",
      parentId: args.parentId,
    });
    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });

    return file;
  },
});

export const creatFolder = mutation({
  args: {
    projectId: v.id("projects"),
    parentId: v.optional(v.id("files")),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.projectId);
    if (!project) throw new Error("project not found");

    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", args.projectId).eq("parentId", args.parentId),
      )
      .collect();
    const existing = files.find(
      (file) => file.name === addToRange.name && file.type === "folder",
    );
    if (existing) throw new Error("folder already exists");
    const folder = await ctx.db.insert("files", {
      projectId: args.projectId,
      updatedAt: Date.now(),
      type: "folder",
      parentId: args.parentId,
      name: args.name,
    });
    await ctx.db.patch("projects", args.projectId, {
      updatedAt: Date.now(),
    });
    return folder;
  },
});

export const renameFile = mutation({
  args: {
    id: v.id("files"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("file not found");
    if (file.type !== "file") throw new Error("this is not file type");
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", file.projectId).eq("parentId", file.parentId),
      )
      .collect();
    const existing = files.find(
      (file) =>
        file.name === args.newName &&
        file.type === "file" &&
        file._id !== args.id,
    );
    if (existing) throw new Error("file name already exists");

    const updatedFile = await ctx.db.patch("files", args.id, {
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
    id: v.id("files"),
    newName: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("file not found");
    if (file.type !== "folder") throw new Error("this is not folder type");
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized to access this project");
    const files = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", file.projectId).eq("parentId", file.parentId),
      )
      .collect();
    const existing = files.find(
      (file) =>
        file.name === args.newName &&
        file.type === "folder" &&
        file._id !== args.id,
    );

    if (existing) throw new Error("folder name already exists");
    const updatedFolder = await ctx.db.patch("files", args.id, {
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
    id: v.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("file not found");
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");

    const deleteRecursive = async (fileId: Id<"files">) => {
      const item = await ctx.db.get("files", args.id);
      if (!item) return;

      if (item.type === "folder") {
        const children = await ctx.db
          .query("files")
          .withIndex("by_project_parent", (q) =>
            q.eq("projectId", item.projectId).eq("parentId", fileId),
          )
          .collect();

        for (const child of children) {
          await deleteRecursive(child._id);
        }
      }

      if (item.storageId) {
        await ctx.storage.delete(item.storageId);
      }

      await ctx.db.delete("files", fileId);
    };

    await deleteRecursive(args.id);
    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });
  },
});

export const updateFile = mutation({
  args: {
    id: v.id("files"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("file not found");
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    const updatedFile = await ctx.db.patch("files", args.id, {
      content: args.content,
      updatedAt: Date.now(),
    });

    await ctx.db.patch("projects", file.projectId, {
      updatedAt: Date.now(),
    });
  },
});

export const getFilePath = query({
  args: {
    id: v.id("files"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const file = await ctx.db.get("files", args.id);
    if (!file) throw new Error("file not found");
    const project = await ctx.db.get("projects", file.projectId);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    const path: { _id: Id<"files">; name: string }[] = [];
    let currentId: Id<"files"> | null = args.id;
    while (currentId) {
      const file = (await ctx.db.get("files", currentId)) as
        | Doc<"files">
        | undefined;
      if (!file) break;
      path.unshift({ _id: file._id, name: file.name });
      currentId = file.parentId as Id<"files">;
    }
    return path;
  },
});
