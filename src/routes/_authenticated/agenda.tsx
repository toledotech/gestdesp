import { createFileRoute } from "@tanstack/react-router";
import Agenda from "@/pages/Agenda";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: Agenda,
});
