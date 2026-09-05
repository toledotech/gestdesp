import { createFileRoute } from "@tanstack/react-router";
import Processos from "@/pages/Processos";

export const Route = createFileRoute("/_authenticated/processos")({
  component: Processos,
});
