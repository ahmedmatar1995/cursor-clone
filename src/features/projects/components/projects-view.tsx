import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { SparklesIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { ProjectsList } from "./projects-list";
import { useCreateProject } from "../hooks/use-projects";
import { generateSlug } from "random-word-slugs";
import {
  uniqueNamesGenerator,
  adjectives,
  animals,
  colors,
} from "unique-names-generator";
import { ProjectsCommandDialog } from "./projects-command-dialog";

export const ProjectsView = () => {
  const [commandDialogOpen, setCommandDialogOpen] = useState(false);
  const createProject = useCreateProject();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCommandDialogOpen(true);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return document.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <>
      <ProjectsCommandDialog
        open={commandDialogOpen}
        onOpenChange={setCommandDialogOpen}
      />
      <div className="min-h-screen bg-sidebar flex flex-col items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4 items-center">
          <div className="flex items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-2 w-full group/logo">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTNNhEWHxjOL4UVuAnfmrwP1ehBb6e3Zcg8jA&s"
                alt="cursor-clone"
                className="size-[32px] md:size-[46px]"
              />
              <h1 className="text-3xl md:text-4xl font-extrabold capitalize">
                Cursor Clone
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-4 w-full">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const projectName = uniqueNamesGenerator({
                    dictionaries: [adjectives, animals, colors],
                    separator: "-",
                    length: 3,
                  });
                  createProject({ name: projectName });
                }}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <SparklesIcon className="size-4" />
                  <Kbd className="bg-accent border">Ctrl+J</Kbd>
                </div>
                <div className="text-sm">New</div>
              </Button>
              <Button
                variant="outline"
                onClick={() => {}}
                className="h-full items-start justify-start p-4 bg-background border flex flex-col gap-6 rounded-none"
              >
                <div className="flex items-center justify-between w-full">
                  <FaGithub className="size-4" />
                  <Kbd className="bg-accent border">Ctrl+I</Kbd>
                </div>
                <div className="text-sm">Import</div>
              </Button>
            </div>
            {/*  ProjectsList   */}
            <ProjectsList
              onViewAll={() => setCommandDialogOpen((prev) => !prev)}
            />
          </div>
        </div>
      </div>
    </>
  );
};
