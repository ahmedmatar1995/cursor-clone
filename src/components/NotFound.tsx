import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export const NotFound = () => {
  return (
    <div className="w-screen h-screen grid place-items-center">
      <div className="w-xl px-8 py-4 rounded flex flex-col items-center gap-y-4">
        <p className="text-lg tracking-wide text-gray-200 font-extrabold">
          404
        </p>
        <h2 className="text-2xl font-extrabold capitalize tracking-tight">
          Page Not Found
        </h2>
        <p className="text-sm text-muted-foreground tracking-wide">
          Sorry, we couldn’t find the page you’re looking for.
        </p>
        <Link to="/" className="mt-8">
          <Button className="capitalize font-bold">go back home</Button>
        </Link>
      </div>
    </div>
  );
};
