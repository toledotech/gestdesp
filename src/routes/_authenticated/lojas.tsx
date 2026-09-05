import { createFileRoute } from "@tanstack/react-router";
import Lojas from "@/pages/Lojas";

export const Route = createFileRoute("/_authenticated/lojas")({
  component: Lojas,
});
