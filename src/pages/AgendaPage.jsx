import React, { useState } from "react";
import { formatISO } from "date-fns";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import AgendaView from "../components/calendar/AgendaView";
import ScheduleEditor from "../components/schedule/ScheduleEditor";
import { useCalendarData } from "../hooks/useCalendarData";
import Input from "../components/common/Input";

export default function AgendaPage() {
  const { groups, singleEvents, isLoading, isError, error } = useCalendarData({});
  const [day, setDay] = useState(() => formatISO(new Date(), { representation: "date" }));
  const [selected, setSelected] = useState(null);

  const dayDate = new Date(day);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Agenda giornaliera"
        description="24 fasce orarie per debugging preciso delle schedule Prefect."
      >
        <div className="mb-4 flex items-center gap-3">
          <Input
            label="Giorno"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="max-w-xs"
          />
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Spinner />
            <span>Caricamento agenda...</span>
          </div>
        )}
        {isError && <p className="text-sm text-text-error">{error?.message}</p>}
        {!isLoading && !isError && (
          <AgendaView
            day={dayDate}
            groups={groups}
            singleEvents={singleEvents}
            onSelect={setSelected}
          />
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
