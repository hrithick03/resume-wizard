// src/router.tsx
import { QueryClient } from "@tanstack/react-query";
import {
  Router,
  RouterProvider,
  Route,
  RootRoute,
} from "@tanstack/react-router";
import React, { useEffect } from "react";

// Create a QueryClient instance
const queryClient = new QueryClient();

// Root layout component
function Layout({ children }: { children: React.ReactNode }) {
  // Inject external ad script once
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

// Define root route
const rootRoute = new RootRoute({
  component: Layout,
});

// Example child route
const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => <div>Welcome to Resume Wizard!</div>,
});

// Build router
const routeTree = rootRoute.addChildren([indexRoute]);

export const router = new Router({
  routeTree,
  context: { queryClient },
});

// Provide router to app
export function AppRouter() {
  return <RouterProvider router={router} />;
}
