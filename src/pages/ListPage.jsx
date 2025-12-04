import React, { useState } from "react";
import Card from "../components/common/Card";
import ListView from "../components/calendar/ListView";
import ScheduleEditor from "../components/schedule/ScheduleEditor";
import { useCalendarData } from "../hooks/useCalendarData";
import Spinner from "../components/common/Spinner";

export default function ListPage() {
  const { groups, singleEvents, isLoading, isError, error } = useCalendarData({});
  const [selected, setSelected] = useState(null);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Vista Lista"
        description="Lista giornaliera con gruppi espandibili per visualizzare le singole esecuzioni."
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Spinner />
            <span>Caricamento eventi...</span>
          </div>
        )}
        {isError && <p className="text-sm text-text-error">{error?.message}</p>}
        {!isLoading && !isError && (
          <ListView groups={groups} singleEvents={singleEvents} onSelect={setSelected} />
        )}
      </Card>

      {selected && (
        <ScheduleEditor
          schedule={selected.scheduleId ? { id: selected.scheduleId } : null}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
