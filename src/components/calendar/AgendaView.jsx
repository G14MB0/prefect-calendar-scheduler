import React, { useMemo } from "react";
import { addHours, format, isSameDay, startOfDay } from "date-fns";
import { colorForDeployment } from "../../utils/grouping";
import StatusBadge from "../common/StatusBadge";

export default function AgendaView({ day = new Date(), groups = [], singleEvents = [], onSelect }) {
  const normalizedDay = startOfDay(day);
  const hours = useMemo(() => Array.from({ length: 24 }).map((_, idx) => addHours(normalizedDay, idx)), [normalizedDay]);

  // Get only SCHEDULED events for this day (not executed ones)
  const scheduledEventsForDay = useMemo(() => {
    const isSame = (date) => isSameDay(new Date(date), normalizedDay);
    const isScheduled = (stateName) => {
      const state = (stateName || "").toLowerCase();
      return state === "scheduled" || state === "pending";
    };

    // Extract all individual scheduled occurrences from groups
    const scheduledFromGroups = groups.flatMap((group) => {
      return (group.occurrences || [])
        .filter((occ) => isSame(occ.startTime) && isScheduled(occ.stateName))
        .map((occ) => ({
          ...occ,
          deploymentId: group.deploymentId,
          deploymentName: occ.deploymentName || group.deploymentName
        }));
    });

    // Filter scheduled single events
    const scheduledSingles = singleEvents.filter(
      (event) => isSame(event.startTime) && isScheduled(event.stateName)
    );

    // Combine and sort by time
    return [...scheduledFromGroups, ...scheduledSingles].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
  }, [groups, singleEvents, normalizedDay]);

  const eventsByHour = useMemo(() => {
    const map = {};
    scheduledEventsForDay.forEach((event) => {
      const key = format(new Date(event.startTime), "HH:00");
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [scheduledEventsForDay]);

  return (
    <div className="rounded-lg border border-border-primary bg-bg-primary p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-text-tertiary">Agenda - Esecuzioni Pianificate</p>
          <p className="text-base font-semibold text-text-primary">{format(normalizedDay, "EEEE dd MMM")}</p>
        </div>
        <span className="text-xs text-text-tertiary">
          {scheduledEventsForDay.length} esecuzioni pianificate
        </span>
      </div>

      <div className="grid grid-cols-[80px,1fr] gap-x-3 gap-y-2">
        {hours.map((hour) => {
          const label = format(hour, "HH:00");
          const events = eventsByHour[label] || [];
          return (
            <React.Fragment key={label}>
              <div className="text-xs text-text-tertiary">{label}</div>
              <div className="flex flex-col gap-2">
                {events.length === 0 ? (
                  <div className="h-8 rounded-md border border-dashed border-border-primary px-3 py-2 text-xs text-text-tertiary">
                    —
                  </div>
                ) : (
                  events.map((event, idx) => (
                    <button
                      key={event.runId || `${event.startTime}-${idx}`}
                      onClick={() => onSelect?.(event)}
                      style={{ background: colorForDeployment(event.deploymentId) + "20" }}
                      className="flex items-center justify-between rounded-md border border-border-primary px-3 py-2 text-left hover:shadow-custom transition"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-text-primary">
                          {event.deploymentName}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {format(new Date(event.startTime), "HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge state={event.stateName} />
                        {event.prefectUrl && (
                          <a
                            href={event.prefectUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-semibold text-button-primary underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Apri
                          </a>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
