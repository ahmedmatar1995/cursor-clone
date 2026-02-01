import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";

const themeSchema = z.union([z.literal("light"), z.literal("dark")]);

export type Theme = z.infer<typeof themeSchema>;

export const storageKey = "_preferred-theme";

export const getThemeServerFn = createServerFn().handler(async () => {
  return (getCookie(storageKey) || "dark") as Theme;
});

export const setThemeServerFn = createServerFn()
  .inputValidator(themeSchema)
  .handler(async ({ data }) => {
    setCookie(storageKey, data);
  });
