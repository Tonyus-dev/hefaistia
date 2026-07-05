import { createFileRoute } from "@tanstack/react-router";
import { RevisaoHost } from "@/components/RevisaoHost";
import { RouteErrorBoundary, RouteNotFoundBoundary } from "@/components/loading-states";

export const Route = createFileRoute("/_authenticated/revisao")({
  component: RevisaoHost,
  errorComponent: RouteErrorBoundary,
  notFoundComponent: () => <RouteNotFoundBoundary />,
});
