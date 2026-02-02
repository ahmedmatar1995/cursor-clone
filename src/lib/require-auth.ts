import { auth } from "@clerk/tanstack-react-start/server";
import { createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

export const requireAuth = createMiddleware().server(async ({ next }) => {
  const { userId } = await auth();
  if (!userId) throw redirect({ to: "/sign-in" });
  return next();
});
