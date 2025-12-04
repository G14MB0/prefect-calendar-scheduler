import React, { useMemo, useState } from "react";
import { addHours, format, isSameDay, startOfDay } from "date-fns";
import { colorForDeployment } from "../../utils/grouping";
import StatusBadge from "../common/StatusBadge";

export default function AgendaView({ day = new Date(), groups = [], singleEvents = [], onSelect }) {
  const normalizedDay = startOfDay(day);
  const hours = useMemo(() => Array.from({ length: 24 }).map((_, idx) => addHours(normalizedDay, idx)), [normalizedDay]);

  // Filter: show all, only scheduled, or only executed
  const [filter, setFilter] = useState("all"); // "all" | "scheduled" | "executed"

  // Get ALL events for this day
  const allEventsForDay = useMemo(() => {
    const isSame = (date) => isSameDay(new Date(date), normalizedDay);

    // Extract all individual occurrences from groups for this day
    const fromGroups = groups.flatMap((group) => {
      return (group.occurrences || [])
        .filter((occ) => isSame(occ.startTime))
        .map((occ) => ({
          ...occ,
          deploymentId: group.deploymentId,
          deploymentName: occ.deploymentName || group.deploymentName
        }));
    });

    // Filter single events for this day
    const fromSingles = singleEvents.filter((event) => isSame(event.startTime));

    // Combine and sort by time
    return [...fromGroups, ...fromSingles].sort(
      (a, b) => new Date(a.startTime) - new Date(b.startTime)
    );
  }, [groups, singleEvents, normalizedDay]);

  // Apply filter
  const filteredEvents = useMemo(() => {
    if (filter === "all") return allEventsForDay;

    return allEventsForDay.filter((event) => {
      const state = (event.stateName || "").toLowerCase();
      const isScheduled = state === "scheduled" || state === "pending";

      if (filter === "scheduled") return isScheduled;
      if (filter === "executed") return !isScheduled;
      return true;
    });
  }, [allEventsForDay, filter]);

  // Stats
  const stats = useMemo(() => {
    const scheduled = allEventsForDay.filter((e) => {
      const s = (e.stateName || "").toLowerCase();
      return s === "scheduled" || s === "pending";
    }).length;
    const executed = allEventsForDay.length - scheduled;
    return { total: allEventsForDay.length, scheduled, executed };
  }, [allEventsForDay]);

  const eventsByHour = useMemo(() => {
    const map = {};
    filteredEvents.forEach((event) => {
      const key = format(new Date(event.startTime), "HH:00");
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [filteredEvents]);

  return (
    <div className="rounded-lg border border-border-primary bg-bg-primary p-4 shadow-sm">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-text-tertiary">Agenda Giornaliera</p>
            <p className="text-base font-semibold text-text-primary">{format(normalizedDay, "EEEE dd MMM yyyy")}</p>
          </div>
          <div className="text-right text-xs">
            <p className="text-text-secondary">{stats.total} totali</p>
            {stats.scheduled > 0 && <p className="text-blue-500">{stats.scheduled} pianificate</p>}
            {stats.executed > 0 && <p className="text-text-tertiary">{stats.executed} eseguite</p>}
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-md transition ${filter === "all"
                ? "bg-button-primary text-text-button"
                : "bg-bg-tertiary text-text-primary hover:bg-bg-secondary"
              }`}
          >
            Tutte ({stats.total})
          </button>
          <button
            onClick={() => setFilter("scheduled")}
            className={`px-3 py-1 text-xs rounded-md transition ${filter === "scheduled"
                ? "bg-blue-500 text-white"
                : "bg-bg-tertiary text-text-primary hover:bg-bg-secondary"
              }`}
          >
            Pianificate ({stats.scheduled})
          </button>
          <button
            onClick={() => setFilter("executed")}
            className={`px-3 py-1 text-xs rounded-md transition ${filter === "executed"
                ? "bg-button-primary text-text-button"
                : "bg-bg-tertiary text-text-primary hover:bg-bg-secondary"
              }`}
          >
            Eseguite ({stats.executed})
          </button>
        </div>
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
                  events.map((event, idx) => {
                    const isScheduled = (event.stateName || "").toLowerCase() === "scheduled" ||
                      (event.stateName || "").toLowerCase() === "pending";
                    return (
                      <button
                        key={event.runId || `${event.startTime}-${idx}`}
                        onClick={() => onSelect?.(event)}
                        style={{ background: colorForDeployment(event.deploymentId) + "20" }}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-left hover:shadow-custom transition ${isScheduled ? "border-blue-300" : "border-border-primary"
                          }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-primary">
                            {event.deploymentName}
                          </span>
                          <span className="text-xs text-text-tertiary">
                            {format(new Date(event.startTime), "HH:mm:ss")}
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
