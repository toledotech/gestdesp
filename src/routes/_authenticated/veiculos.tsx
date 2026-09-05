import { createFileRoute } from "@tanstack/react-router";
import Veiculos from "@/pages/Veiculos";

export const Route = createFileRoute("/_authenticated/veiculos")({
  component: Veiculos,
});
