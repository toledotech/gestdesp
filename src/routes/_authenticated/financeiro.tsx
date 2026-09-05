import { createFileRoute } from "@tanstack/react-router";
import Financeiro from "@/pages/Financeiro";

export const Route = createFileRoute("/_authenticated/financeiro")({
  component: Financeiro,
});
