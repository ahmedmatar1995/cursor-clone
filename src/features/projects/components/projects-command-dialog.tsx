import { useRouter } from "@tanstack/react-router";
import { FaGithub } from "react-icons/fa";
import { Loader2Icon, AlertCircleIcon } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandGroup,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { getProjectIcon } from "./project-item";

import { useProjects } from "../hooks/use-projects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectsCommandDialog = ({ open, onOpenChange }: Props) => {
  const router = useRouter();
  const projects = useProjects();
  const handleSelect = (projectId: string) => {
    router.navigate({ to: `/projects/${projectId}` });
    onOpenChange(false);
  };
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Projects"
      description="Search and Navigate to your projects"
    >
      <CommandInput placeholder="Search your projects" />
      <CommandList>
        <CommandEmpty>No Projects Found</CommandEmpty>
        <CommandGroup heading="projects">
          {projects?.map((project) => (
            <CommandItem
              key={project._id}
              value={`${project.name}-${project._id}`}
              onSelect={() => handleSelect(project._id)}
            >
              {getProjectIcon(project)}
              <span>{project.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
