import React, { createContext, useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { type Theme, setThemeServerFn } from "@/lib/theme";

export type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  theme,
  children,
}: React.PropsWithChildren<{ theme: Theme }>) {
  const router = useRouter();
  const setTheme = useCallback(
    (t: Theme) => {
      setThemeServerFn({ data: t }).then(() => router.invalidate());
    },
    [router],
  );
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
