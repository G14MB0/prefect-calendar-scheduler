import React, { useState } from "react";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import Button from "../components/common/Button";
import CalendarWeekView from "../components/calendar/CalendarWeekView";
import GroupDetailModal from "../components/calendar/GroupDetailModal";
import ScheduleEditor from "../components/schedule/ScheduleEditor";
import { useCalendarData } from "../hooks/useCalendarData";

export default function CalendarPage() {
  const { groups, singleEvents, isLoading, isError, error } = useCalendarData({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Calendario settimanale"
        description="Blocchi raggruppati per deployment. Clicca su un gruppo per vedere i dettagli."
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNewScheduleModal(true)}>
            + Nuova Schedule
          </Button>
        }
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Spinner />
            <span>Caricamento calendario...</span>
          </div>
        )}
        {isError && <p className="text-sm text-text-error">{error?.message}</p>}
        {!isLoading && !isError && (
          <CalendarWeekView groups={groups} singleEvents={singleEvents} onSelect={setSelectedGroup} />
        )}
      </Card>

      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {showNewScheduleModal && (
        <ScheduleEditor
          onClose={() => setShowNewScheduleModal(false)}
        />
      )}
    </div>
  );
}
