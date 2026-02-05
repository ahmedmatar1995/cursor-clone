import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { verifyAuth } from "./auth";

export const create = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    return await ctx.db.insert("projects", {
      name: args.name,
      ownerId: identity?.subject as string,
      updatedAt: Date.now(),
    });
  },
});

export const getPartial = query({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);

    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) =>
        q.eq("ownerId", identity?.subject as string),
      )
      .order("desc")
      .take(args?.limit);
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await verifyAuth(ctx);
    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) =>
        q.eq("ownerId", identity?.subject as string),
      )
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: {
    id: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    return project;
  },
});

export const renameProject = mutation({
  args: {
    id: v.id("projects"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await verifyAuth(ctx);
    const project = await ctx.db.get("projects", args.id);
    if (!project) throw new Error("project not found");
    if (project.ownerId !== identity?.subject)
      throw new Error("unAuthorized access to this project");
    const updatedProjected = await ctx.db.patch("projects", args.id, {
      name: args.name,
      updatedAt: Date.now(),
    });

    return updatedProjected;
  },
});
