import React, { useMemo } from "react";
import { addHours, format, isSameDay, startOfDay } from "date-fns";
import { colorForDeployment } from "../../utils/grouping";
import StatusBadge from "../common/StatusBadge";

export default function AgendaView({ day = new Date(), groups = [], singleEvents = [], onSelect }) {
  const normalizedDay = startOfDay(day);
  const hours = useMemo(() => Array.from({ length: 24 }).map((_, idx) => addHours(normalizedDay, idx)), [normalizedDay]);

  const eventsForDay = useMemo(() => {
    const isSame = (date) => isSameDay(new Date(date), normalizedDay);
    const g = groups.filter((group) => isSame(group.start));
    const s = singleEvents.filter((event) => isSame(event.startTime));
    return [...g.map((item) => ({ type: "group", data: item })), ...s.map((item) => ({ type: "single", data: item }))];
  }, [groups, singleEvents, normalizedDay]);

  const eventsByHour = useMemo(() => {
    const map = {};
    eventsForDay.forEach((item) => {
      const start = new Date(item.type === "group" ? item.data.start : item.data.startTime);
      const key = format(start, "HH:00");
      if (!map[key]) map[key] = [];
      map[key].push(item);
    });
    return map;
  }, [eventsForDay]);

  return (
    <div className="rounded-lg border border-border-primary bg-bg-primary p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-text-tertiary">Agenda</p>
          <p className="text-base font-semibold text-text-primary">{format(normalizedDay, "EEEE dd MMM")}</p>
        </div>
      </div>

      <div className="grid grid-cols-[80px,1fr] gap-x-3 gap-y-2">
        {hours.map((hour) => {
          const label = format(hour, "HH:00");
          const items = eventsByHour[label] || [];
          return (
            <React.Fragment key={label}>
              <div className="text-xs text-text-tertiary">{label}</div>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <div className="h-8 rounded-md border border-dashed border-border-primary px-3 py-2 text-xs text-text-tertiary">
                    Libero
                  </div>
                ) : (
                  items.map((item, idx) => {
                    if (item.type === "group") {
                      const g = item.data;
                      return (
                        <button
                          key={`${label}-${idx}`}
                          onClick={() => onSelect?.(g)}
                          style={{ background: colorForDeployment(g.deploymentId) + "20" }}
                          className="flex flex-col rounded-md border border-border-primary px-3 py-2 text-left"
                        >
                        <span className="text-sm font-semibold text-text-primary">
                          {g.occurrences[0]?.deploymentName || "Deployment"}
                        </span>
                        <span className="text-xs text-text-secondary">
                          ogni {g.frequency || "?"}s - {g.occurrences.length} occorrenze
                        </span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {g.occurrences.slice(0, 3).map((ev) => (
                            <StatusBadge key={ev.runId || ev.startTime} state={ev.stateName} />
                          ))}
                        </div>
                      </button>
                    );
                  }
                  const e = item.data;
                  return (
                      <button
                        key={`${label}-${idx}`}
                        onClick={() => onSelect?.(e)}
                        className="flex flex-col rounded-md border border-dashed border-border-primary px-3 py-2 text-left hover:border-button-primary"
                      >
                        <span className="text-sm font-semibold text-text-primary">
                          {e.deploymentName}
                        </span>
                        <div className="flex items-center justify-between text-xs text-text-secondary">
                          <span>{format(e.startTime, "HH:mm")}</span>
                          <StatusBadge state={e.stateName} />
                        </div>
                        {e.prefectUrl && (
                          <a
                            href={e.prefectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-button-primary underline"
                            onClick={(evt) => evt.stopPropagation()}
                          >
                            Apri in Prefect UI
                          </a>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
