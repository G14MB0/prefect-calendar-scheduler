import React, { useState } from "react";
import { ArrowPathIcon, PlusIcon } from "@heroicons/react/24/outline";
import Button from "../common/Button";
import ConnectionBadge from "../settings/ConnectionBadge";
import { useCalendarData } from "../../hooks/useCalendarData";
import { Link } from "react-router-dom";
import ScheduleEditor from "../schedule/ScheduleEditor";

export default function Topbar() {
  const { refresh } = useCalendarData({});
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-border-primary bg-bg-primary px-6 py-3">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Prefect Calendar</h1>
        <p className="text-sm text-text-tertiary">
          Visualizza e modifica le schedulazioni Prefect in tempo reale.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ConnectionBadge />
        <Button variant="primary" size="sm" onClick={() => setShowNewScheduleModal(true)}>
          + Nuova Schedule
        </Button>
        <Button variant="ghost" size="sm" onClick={refresh} icon={<ArrowPathIcon className="h-4 w-4" />}>
          Aggiorna
        </Button>
      </div>

      {showNewScheduleModal && (
        <ScheduleEditor
          onClose={() => setShowNewScheduleModal(false)}
        />
      )}
    </header>
  );
}
