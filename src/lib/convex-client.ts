import { ConvexHttpClient } from "convex/browser";

const convexUrl =
  process.env.VITE_CONVEX_URL ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_CONVEX_URL);

if (!convexUrl) {
  console.error(
    "CRITICAL: VITE_CONVEX_URL is missing in Convex client initialization!",
  );
}

export const convex = new ConvexHttpClient(convexUrl as string);
