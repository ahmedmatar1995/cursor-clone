import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";

export const useProjects = () => {
  return useQuery(api.projects.get, {});
};

export const useProjectsPartial = (limit: number) => {
  return useQuery(api.projects.getPartial, { limit });
};

export const useProject = (projectId: Id<"projects">) => {
  return useQuery(api.projects.getById, { id: projectId });
};

export const useCreateProject = () => {
  return useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, args) => {
      const existingProjects = localStore.getQuery(api.projects.get);

      if (existingProjects !== undefined) {
        const newProject = {
          _id: crypto.randomUUID() as Id<"projects">,
          _creationTime: Date.now(),
          updatedAt: Date.now(),
          name: args.name,
          ownerId: "anonymous",
        };

        return localStore.setQuery(api.projects.get, {}, [
          newProject,
          ...existingProjects,
        ]);
      }
    },
  );
};

export const useRenameProject = (projectId: Id<"projects">) => {
  return useMutation(api.projects.renameProject).withOptimisticUpdate(
    (localStore, args) => {
      const existingProject = localStore.getQuery(api.projects.getById, {
        id: projectId,
      });

      if (existingProject !== undefined && existingProject !== null) {
        localStore.setQuery(
          api.projects.getById,
          { id: existingProject._id },
          {
            ...existingProject,
            name: args.name,
            updatedAt: Date.now(),
          },
        );
      }
      const existingProjects = localStore.getQuery(api.projects.get, {});
      if (existingProjects !== undefined) {
        localStore.setQuery(
          api.projects.get,
          {},
          existingProjects.map((project) => {
            return project._id === args.id
              ? { ...project, name: args.name, updatedAt: Date.now() }
              : project;
          }),
        );
      }
    },
  );
};
