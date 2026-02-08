import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";

import appCss from "../styles.css?url";
import "../App.css";
import { getThemeServerFn } from "@/lib/theme";
import { ThemeProvider } from "@/components/theme-provider";
import { NotFound } from "@/components/NotFound";
import { QueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { AuthLoading } from "convex/react";
import { LoadingAuth } from "@/features/auth/components/auth-loading";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: "Cursor Clone",
        },
      ],
      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
      ],
    }),
    loader: () => getThemeServerFn(),
    notFoundComponent: NotFound,
    component: RootComponent,
  },
);

function RootDocument({ children }: { children: React.ReactNode }) {
  const theme = Route.useLoaderData();
  return (
    <html lang="en" className={theme} suppressHydrationWarning>
      <head>
        <HeadContent />
        <link
          href="https://api.fontshare.com/v2/css?f[]=merriweather-sans@800&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body>
        <div>
          <Providers>
            <div className="w-screen min-h-screen">
              {children}
              <AuthLoading>
                <LoadingAuth />
              </AuthLoading>
              <Toaster />
            </div>

            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
            <Scripts />
          </Providers>
        </div>
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}
