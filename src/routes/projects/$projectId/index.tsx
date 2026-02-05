import { ProjectLayout } from "@/components/projectLayout";
import { ProjectView } from "@/features/projects/components/project-view";
import { createFileRoute } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";

export const Route = createFileRoute("/projects/$projectId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams() as { projectId: Id<"projects"> };
  return (
    <ProjectLayout projectId={projectId}>
      <ProjectView projectId={projectId} />
    </ProjectLayout>
  );
}
