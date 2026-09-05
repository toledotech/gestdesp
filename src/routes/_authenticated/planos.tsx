import { createFileRoute } from "@tanstack/react-router";
import PlansManagement from "@/pages/PlansManagement";

export const Route = createFileRoute("/_authenticated/planos")({
  component: PlansManagement,
});
