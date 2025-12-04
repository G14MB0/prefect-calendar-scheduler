import React, { useState, useMemo } from "react";
import Card from "../components/common/Card";
import ListView from "../components/calendar/ListView";
import DeploymentFilter from "../components/common/DeploymentFilter";
import RunDetailModal from "../components/calendar/RunDetailModal";
import { useCalendarData } from "../hooks/useCalendarData";
import Spinner from "../components/common/Spinner";

export default function ListPage() {
  const { groups, singleEvents, deployments, isLoading, isError, error } = useCalendarData({});
  const [selected, setSelected] = useState(null);
  const [selectedDeployments, setSelectedDeployments] = useState([]);

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
        title="Vista Lista"
        description="Lista giornaliera con gruppi espandibili per visualizzare le singole esecuzioni."
      >
        {/* Deployment filter */}
        <div className="mb-4">
          <DeploymentFilter
            deployments={deploymentList}
            selected={selectedDeployments}
            onChange={setSelectedDeployments}
          />
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Spinner />
            <span>Caricamento eventi...</span>
          </div>
        )}
        {isError && <p className="text-sm text-text-error">{error?.message}</p>}
        {!isLoading && !isError && (
          <ListView groups={filteredGroups} singleEvents={filteredSingleEvents} onSelect={setSelected} />
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
