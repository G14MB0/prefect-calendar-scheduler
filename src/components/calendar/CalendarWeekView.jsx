import React, { useMemo } from "react";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { colorForDeployment } from "../../utils/grouping";
import { formatTime } from "../../utils/formatters";
import StatusBadge from "../common/StatusBadge";

const MAX_GROUPS_PER_DAY = 5;

export default function CalendarWeekView({ groups = [], singleEvents = [], onSelect }) {
  const days = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, idx) => addDays(today, idx));
  }, []);

  const groupedByDay = useMemo(() => {
    return days.map((day) => {
      // Get all groups that have events on this day
      const dayGroups = groups.filter((g) => {
        // Check if any occurrence falls on this day
        return g.occurrences?.some(occ => isSameDay(new Date(occ.startTime), day));
      }).map(g => {
        // Filter occurrences to only those on this day
        const dayOccurrences = g.occurrences.filter(occ => isSameDay(new Date(occ.startTime), day));

        // Separate scheduled vs executed
        const scheduledCount = dayOccurrences.filter(occ =>
          (occ.stateName || "").toLowerCase() === "scheduled" ||
          (occ.stateName || "").toLowerCase() === "pending"
        ).length;
        const executedCount = dayOccurrences.length - scheduledCount;

        return {
          ...g,
          occurrences: dayOccurrences,
          scheduledCount,
          executedCount,
          start: dayOccurrences[0]?.startTime || g.start,
          end: dayOccurrences[dayOccurrences.length - 1]?.startTime || g.end
        };
      });

      const daySingles = singleEvents.filter((e) => isSameDay(new Date(e.startTime), day));

      // Limit groups shown per day
      const visibleGroups = dayGroups.slice(0, MAX_GROUPS_PER_DAY);
      const hiddenGroupsCount = dayGroups.length - visibleGroups.length;
      const totalScheduled = dayGroups.reduce((sum, g) => sum + g.scheduledCount, 0);
      const totalExecuted = dayGroups.reduce((sum, g) => sum + g.executedCount, 0) + daySingles.length;

      return {
        day,
        groups: visibleGroups,
        singles: daySingles,
        hiddenGroupsCount,
        totalScheduled,
        totalExecuted
      };
    });
  }, [days, groups, singleEvents]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {groupedByDay.map(({ day, groups: dayGroups, singles, hiddenGroupsCount, totalScheduled, totalExecuted }) => (
        <div
          key={day.toISOString()}
          className="rounded-lg border border-border-primary bg-bg-primary p-3 shadow-sm"
        >
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-tertiary uppercase">{format(day, "EEEE")}</p>
              <p className="text-base font-semibold">{format(day, "dd MMM")}</p>
            </div>
            <div className="text-right">
              {totalScheduled > 0 && (
                <p className="text-xs text-blue-500">{totalScheduled} pianificate</p>
              )}
              {totalExecuted > 0 && (
                <p className="text-xs text-text-tertiary">{totalExecuted} eseguite</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {dayGroups.map((group) => (
              <button
                key={`${group.deploymentId}-${day.toISOString()}`}
                onClick={() => onSelect?.(group)}
                className="w-full rounded-md border border-border-primary px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-custom"
                style={{ background: colorForDeployment(group.deploymentId) + "20" }}
              >
                <p className="text-sm font-semibold text-text-primary">
                  {group.deploymentName || group.occurrences[0]?.deploymentName || "Deployment"}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  {group.scheduledCount > 0 && (
                    <span className="text-blue-500">{group.scheduledCount} pianificate</span>
                  )}
                  {group.executedCount > 0 && (
                    <span>{group.executedCount} eseguite</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                  {group.occurrences.slice(0, 5).map((ev, idx) => (
                    <StatusBadge key={ev.runId || `${ev.startTime}-${idx}`} state={ev.stateName} />
                  ))}
                  {group.occurrences.length > 5 && (
                    <span className="text-text-tertiary">+{group.occurrences.length - 5}</span>
                  )}
                </div>
              </button>
            ))}
            {hiddenGroupsCount > 0 && (
              <div className="text-xs text-text-tertiary text-center py-1">
                +{hiddenGroupsCount} altri deployment nascosti
              </div>
            )}
            {singles.map((event) => (
              <button
                key={`${event.deploymentId}-${new Date(event.startTime).toISOString()}`}
                onClick={() => onSelect?.(event)}
                className="w-full rounded-md border border-dashed border-border-primary px-3 py-2 text-left transition hover:-translate-y-0.5 hover:border-button-primary hover:shadow-custom"
              >
                <p className="text-sm font-semibold text-text-primary">
                  {event.deploymentName}
                </p>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <span>{formatTime(event.startTime)}</span>
                  <StatusBadge state={event.stateName} />
                </div>
              </button>
            ))}
            {!dayGroups.length && !singles.length && (
              <p className="text-sm text-text-tertiary">Nessuna occorrenza.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
