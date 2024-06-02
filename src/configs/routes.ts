import type { ExtractRoutes } from "@/app/router";
// Routes
import api from "@routes/api";
import web from "@routes/web";

const routes = {
  web,
  api,
} as const;

export default routes;
export type RouteDefinitions = typeof routes;
type Routes = Prettify<
  UnionToIntersection<
    {
      [K in keyof RouteDefinitions]: ExtractRoutes<RouteDefinitions[K]>;
    }[keyof RouteDefinitions]
  >
>;
export type AvailableRoutes = keyof Routes;
export type AvailableMethodRoutes<Method extends string> = {
  [K in keyof Routes as Routes[K] extends Method ? K : never]: Routes[K];
};
