import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="w-screen h-screen grid place-items-center">
      <div className="w-full max-w-lg">
        <SignIn />
      </div>
    </div>
  );
}
