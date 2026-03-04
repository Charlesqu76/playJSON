import {
  type AnyRoute,
  type RouteComponent,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

type PageModule = {
  default: React.ComponentType;
};

const eagerHomeModule = import.meta.glob<PageModule>("./pages/index.tsx", { eager: true });
const pageModules = import.meta.glob<PageModule>(["./pages/**/*.tsx", "!./pages/index.tsx"]);

const toRoutePath = (filePath: string): string => {
  const pagePath = filePath.replace("./pages/", "").replace(/\.tsx$/, "");
  if (pagePath === "index") return "/";

  const parts = pagePath.split("/").filter((part) => part !== "index");
  return `/${parts.join("/")}`;
};

const getRouteComponent = (filePath: string, loadPage: () => Promise<PageModule>): RouteComponent => {
  const eagerHomePage = eagerHomeModule[filePath]?.default;
  if (eagerHomePage) {
    return eagerHomePage as RouteComponent;
  }

  const LazyPage = lazy(loadPage);
  return (() => (
    <Suspense fallback={null}>
      <LazyPage />
    </Suspense>
  )) as RouteComponent;
};

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: (eagerHomeModule["./pages/index.tsx"]?.default ?? (() => null)) as RouteComponent,
});

const pageRoutes = Object.entries(pageModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([filePath, loadPage]) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path: toRoutePath(filePath),
      component: getRouteComponent(filePath, loadPage),
    }),
  );

const routeTree = rootRoute.addChildren([homeRoute, ...(pageRoutes as AnyRoute[])]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
