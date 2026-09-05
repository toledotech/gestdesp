import { createFileRoute } from "@tanstack/react-router";
import Prazos from "@/pages/Prazos";

export const Route = createFileRoute("/_authenticated/prazos")({
  component: Prazos,
});
