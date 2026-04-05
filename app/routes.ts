import { type RouteConfig, index, layout, route, prefix } from "@react-router/dev/routes";

const devRoutes = import.meta.env.DEV ? prefix("dev", [route("components", "dev/components.tsx")]) : [];

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("search", "routes/search.tsx"),
    route("bookmarks", "routes/bookmarks.tsx"),
    route("branch/:branch", "routes/branch.tsx"),
    route("branch/:branch/year/:year", "routes/year.tsx"),
    route("subject/:subjectId", "routes/subject.tsx"),
  ]),
  ...devRoutes,
] satisfies RouteConfig;
