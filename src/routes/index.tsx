import { createFileRoute } from "@tanstack/react-router";
import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
} from "@clerk/tanstack-react-start";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  loader: () => {
    console.log("home page");
  },
  component: RouteComponent,
});

function RouteComponent() {
  const {} = useTheme();
  return (
    <div>
      <p>home page</p>
      <SignedOut>
        <SignIn forceRedirectUrl="/" />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </div>
  );
}
