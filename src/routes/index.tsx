import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/lib/require-auth";
import { ProjectsView } from "@/features/projects/components/projects-view";

export const Route = createFileRoute("/")({
  server: {
    middleware: [requireAuth],
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <ProjectsView />;
}
