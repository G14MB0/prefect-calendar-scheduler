import React, { useMemo, useState } from "react";
import { format, isAfter, isBefore, startOfDay, endOfDay, formatISO } from "date-fns";
import { formatTime } from "../../utils/formatters";
import { colorForDeployment } from "../../utils/grouping";
import StatusBadge from "../common/StatusBadge";
import Input from "../common/Input";

export default function ListView({ groups = [], singleEvents = [], onSelect }) {
  // Track which groups are expanded (by deploymentId + day)
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("asc"); // asc = oldest first, desc = newest first

  // Filter and process data
  const groupedByDay = useMemo(() => {
    const dayMap = {};

    const fromDate = dateFrom ? startOfDay(new Date(dateFrom)) : null;
    const toDate = dateTo ? endOfDay(new Date(dateTo)) : null;

    // Helper to check if date is in range
    const isInRange = (date) => {
      const d = new Date(date);
      if (fromDate && isBefore(d, fromDate)) return false;
      if (toDate && isAfter(d, toDate)) return false;
      return true;
    };

    // Process groups - each group's occurrences need to be distributed by day
    groups.forEach((g) => {
      const occurrencesByDay = {};
      (g.occurrences || []).forEach((occ) => {
        if (!isInRange(occ.startTime)) return;

        const dayKey = format(new Date(occ.startTime), "yyyy-MM-dd");
        if (!occurrencesByDay[dayKey]) occurrencesByDay[dayKey] = [];
        occurrencesByDay[dayKey].push(occ);
      });

      // Create a group entry for each day that has occurrences
      Object.entries(occurrencesByDay).forEach(([dayKey, occs]) => {
        if (!dayMap[dayKey]) dayMap[dayKey] = { groups: [], singles: [] };
        dayMap[dayKey].groups.push({
          ...g,
          occurrences: occs,
          dayKey
        });
      });
    });

    // Process single events
    singleEvents.forEach((e) => {
      if (!isInRange(e.startTime)) return;

      const dayKey = format(new Date(e.startTime), "yyyy-MM-dd");
      if (!dayMap[dayKey]) dayMap[dayKey] = { groups: [], singles: [] };
      dayMap[dayKey].singles.push(e);
    });

    // Convert to sorted array
    const result = Object.entries(dayMap)
      .map(([day, data]) => ({ day, ...data }))
      .sort((a, b) => {
        const diff = new Date(a.day) - new Date(b.day);
        return sortOrder === "asc" ? diff : -diff;
      });

    return result;
  }, [groups, singleEvents, dateFrom, dateTo, sortOrder]);

  // Total counts
  const totalCount = useMemo(() => {
    return groupedByDay.reduce((sum, d) => {
      return sum + d.groups.reduce((s, g) => s + g.occurrences.length, 0) + d.singles.length;
    }, 0);
  }, [groupedByDay]);

  const toggleExpand = (groupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  const renderGroup = (group) => {
    const groupKey = `${group.deploymentId}-${group.dayKey}`;
    const isExpanded = expandedGroups.has(groupKey);
    const occurrences = group.occurrences || [];

    return (
      <div
        key={groupKey}
        className="rounded-md border border-border-primary overflow-hidden"
        style={{ background: colorForDeployment(group.deploymentId) + "12" }}
      >
        {/* Group header - clickable to expand/collapse */}
        <button
          onClick={() => toggleExpand(groupKey)}
          className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-black/5 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-tertiary">
              {isExpanded ? "▼" : "▶"}
            </span>
            <span className="text-sm font-semibold text-text-primary">
              {group.deploymentName || group.occurrences[0]?.deploymentName || "Deployment"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {occurrences.slice(0, 3).map((ev, idx) => (
                <StatusBadge key={ev.runId || `${ev.startTime}-${idx}`} state={ev.stateName} />
              ))}
              {occurrences.length > 3 && (
                <span className="text-xs text-text-tertiary">+{occurrences.length - 3}</span>
              )}
            </div>
            <span className="text-xs text-text-secondary">
              {occurrences.length} esecuzioni
            </span>
          </div>
        </button>

        {/* Expanded occurrences */}
        {isExpanded && (
          <div className="border-t border-border-primary bg-bg-primary/50">
            {occurrences.map((occ, idx) => (
              <button
                key={occ.runId || `${occ.startTime}-${idx}`}
                onClick={() => onSelect?.(occ)}
                className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-bg-tertiary transition border-b border-border-primary last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-tertiary font-mono">
                    {formatTime(occ.startTime)}
                  </span>
                  <span className="text-sm text-text-primary">
                    {occ.deploymentName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge state={occ.stateName} />
                  {occ.prefectUrl && (
                    <a
                      href={occ.prefectUrl}
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
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderSingle = (event) => (
    <button
      key={`${event.deploymentId}-${event.startTime}`}
      onClick={() => onSelect?.(event)}
      className="flex w-full items-center justify-between rounded-md border border-dashed border-border-primary px-3 py-2 text-left hover:-translate-y-0.5 hover:border-button-primary hover:shadow-custom transition"
    >
      <div className="flex items-center gap-3">
        <span className="text-xs text-text-tertiary font-mono">
          {formatTime(event.startTime)}
        </span>
        <span className="text-sm font-semibold text-text-primary">{event.deploymentName}</span>
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

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-bg-secondary border border-border-primary">
        <div className="flex-1 min-w-[150px]">
          <Input
            label="Da"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <Input
            label="A"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <button
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="px-3 py-2 text-sm rounded-md border border-border-primary bg-bg-primary hover:bg-bg-tertiary transition"
        >
          {sortOrder === "asc" ? "↑ Più vecchi prima" : "↓ Più recenti prima"}
        </button>
        {(dateFrom || dateTo) && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-button-primary hover:underline"
          >
            Pulisci filtri
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-text-secondary">
        {totalCount} esecuzioni in {groupedByDay.length} giorni
        {(dateFrom || dateTo) && " (filtrato)"}
      </div>

      {/* List */}
      {groupedByDay.length === 0 ? (
        <p className="text-sm text-text-tertiary">Nessun evento trovato per il periodo selezionato.</p>
      ) : (
        groupedByDay.map(({ day, groups: dayGroups, singles }) => (
          <div key={day} className="rounded-lg border border-border-primary bg-bg-primary p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-text-primary">
                {format(new Date(day), "EEEE dd MMM yyyy")}
              </p>
              <span className="text-xs text-text-tertiary">
                {dayGroups.reduce((sum, g) => sum + g.occurrences.length, 0) + singles.length} esecuzioni
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {dayGroups.map((group) => renderGroup(group))}
              {singles.map((event) => renderSingle(event))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
