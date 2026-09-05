import { createFileRoute } from "@tanstack/react-router";
import Configuracoes from "@/pages/Configuracoes";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});
