import { createFileRoute } from "@tanstack/react-router";
import Relatorios from "@/pages/Relatorios";

export const Route = createFileRoute("/_authenticated/relatorios")({
  component: Relatorios,
});
