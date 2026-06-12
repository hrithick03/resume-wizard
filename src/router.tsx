// src/router.tsx
import { QueryClient } from "@tanstack/react-query";
import {
  Router,
  RouterProvider,
  Route,
  RootRoute,
} from "@tanstack/react-router";
import React, { useEffect } from "react";

const queryClient = new QueryClient();

// Layout component
function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://pl29722043.effectivecpmnetwork.com/33/d9/3b/33d93b584be297384c60efdcd39b473e.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div>
      <h1>Resume Wizard</h1>
      <div>{children}</div>
    </div>
  );
}

const rootRoute = new RootRoute({
  component: Layout,
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <div>Welcome to Resume Wizard!</div>,
});

const routeTree = rootRoute.addChildren([indexRoute]);

// Exported function for TanStack Start hydration
export function getRouter() {
  return new Router({
    routeTree,
    context: { queryClient },
  });
}

// Optional: component to provide router
export function AppRouter() {
  const router = getRouter();
  return <RouterProvider router={router} />;
}
