import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/")({
  loader: () => {
    console.log("home page");
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <p>home page</p>
      <div className="w-xl mx-auto mt-4">
        <Card className="rounded">card</Card>
        <Button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          Switch to {theme === "dark" ? "light" : "dark"}
        </Button>
      </div>
    </div>
  );
}
