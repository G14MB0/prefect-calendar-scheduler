import React, { useState, useMemo } from "react";
import { formatISO } from "date-fns";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import DeploymentFilter from "../components/common/DeploymentFilter";
import AgendaView from "../components/calendar/AgendaView";
import RunDetailModal from "../components/calendar/RunDetailModal";
import { useCalendarData } from "../hooks/useCalendarData";
import Input from "../components/common/Input";

export default function AgendaPage() {
  const { groups, singleEvents, deployments, isLoading, isError, error } = useCalendarData({});
  const [day, setDay] = useState(() => formatISO(new Date(), { representation: "date" }));
  const [selected, setSelected] = useState(null);
  const [selectedDeployments, setSelectedDeployments] = useState([]);

  const dayDate = new Date(day);

  // Normalize deployments list
  const deploymentList = useMemo(() => {
    if (Array.isArray(deployments)) return deployments;
    if (deployments?.items) return deployments.items;
    return [];
  }, [deployments]);

  // Filter groups and events by selected deployments
  const filteredGroups = useMemo(() => {
    if (selectedDeployments.length === 0) return groups;
    return groups.filter((g) => selectedDeployments.includes(g.deploymentId));
  }, [groups, selectedDeployments]);

  const filteredSingleEvents = useMemo(() => {
    if (selectedDeployments.length === 0) return singleEvents;
    return singleEvents.filter((e) => selectedDeployments.includes(e.deploymentId));
  }, [singleEvents, selectedDeployments]);

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Agenda giornaliera"
        description="24 fasce orarie per debugging preciso delle schedule Prefect."
      >
        <div className="mb-4 flex flex-wrap items-end gap-4">
          <Input
            label="Giorno"
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="max-w-xs"
          />
          <DeploymentFilter
            deployments={deploymentList}
            selected={selectedDeployments}
            onChange={setSelectedDeployments}
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
            groups={filteredGroups}
            singleEvents={filteredSingleEvents}
            onSelect={setSelected}
          />
        )}
      </Card>

      {selected && (
        <RunDetailModal
          event={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
