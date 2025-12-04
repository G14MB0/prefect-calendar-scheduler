import React from "react";
import Badge from "../common/Badge";
import { useConnection } from "../../context/ConnectionContext";

export default function ConnectionBadge() {
  const { status } = useConnection();

  const tone = {
    idle: "warning",
    checking: "warning",
    connected: "success",
    degraded: "warning",
    error: "danger"
  }[status || "idle"];

  const label = {
    idle: "Non testata",
    checking: "Verifica...",
    connected: "Connesso",
    degraded: "Instabile",
    error: "Errore"
  }[status || "idle"];

  return <Badge tone={tone}>{label}</Badge>;
}
