import { Spinner } from "@/components/ui/spinner";
import { useProjectsPartial } from "../hooks/use-projects";
import { Kbd } from "@/components/ui/kbd";
import { ProjectItem } from "./project-item";
import { ContinueCard } from "./continue-card";

interface Props {
  onViewAll: () => void;
}

export const ProjectsList = ({ onViewAll }: Props) => {
  const projects = useProjectsPartial(6);

  const recentCount = 1;

  const sortedProjects = [...(projects ?? [])].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  const recentProjects = sortedProjects?.slice(0, recentCount);
  const restProjects = sortedProjects?.slice(recentCount);

  if (projects === undefined) return <Spinner className="size-4 text-ring" />;
  return (
    <div className="flex flex-col gap-4">
      {recentProjects.length > 0 && <ContinueCard data={recentProjects[0]} />}
      {restProjects.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Recent Projects
            </span>
            <button
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors"
              onClick={onViewAll}
            >
              <span>View All</span>
              <Kbd className="bg-accent border ">Ctrl+K</Kbd>
            </button>
          </div>
          <ul className="flex flex-col gap-y-2 mt-4">
            {restProjects.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
