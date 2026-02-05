import { ProjectLayout } from "@/components/projectLayout";
import { createFileRoute } from "@tanstack/react-router";
import { Id } from "convex/_generated/dataModel";

export const Route = createFileRoute("/projects/$projectId/settings/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { projectId } = Route.useParams() as { projectId: Id<"projects"> };
  return (
    <ProjectLayout projectId={projectId}>
      <div>
        <p>settings</p>
        <p>{projectId}</p>
      </div>
    </ProjectLayout>
  );
}
