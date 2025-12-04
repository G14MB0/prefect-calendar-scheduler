import React from "react";
import ConnectionForm from "../components/settings/ConnectionForm";
import Card from "../components/common/Card";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ConnectionForm />
      <Card
        title="Caching & polling"
        description="Ottimizzazioni per evitare traffico eccessivo verso Prefect Server."
      >
        <ul className="list-disc pl-5 text-sm text-text-secondary">
          <li>Cache deployment e schedule: 5 minuti</li>
          <li>Cache delle future runs: 30-60 secondi</li>
          <li>Refresh manuale tramite pulsante nella topbar</li>
        </ul>
      </Card>
    </div>
  );
}
