import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { Button } from "@/components/ui/button";
import { generateSlug } from "random-word-slugs";
import { requireAuth } from "@/lib/require-auth";
import { UserButton } from "@clerk/tanstack-react-start";
import Ky from "ky";

export const Route = createFileRoute("/")({
  server: {
    middleware: [requireAuth],
  },
  component: RouteComponent,
});

function RouteComponent() {
  const data = useQuery(api.projects.get);
  const add = useMutation(api.projects.create);

  return (
    <div>
      <div>{JSON.stringify(data, null, 2)}</div>

      <UserButton />
      <Button onClick={() => add({ name: generateSlug(6) })}>add new</Button>
      <Button
        variant="outline"
        onClick={async () => {
          const response = await Ky.post("/api/background").json();
          console.log(response);
        }}
      >
        generate text
      </Button>
    </div>
  );
}
