import React, { useState, useMemo } from "react";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import Button from "../components/common/Button";
import DeploymentFilter from "../components/common/DeploymentFilter";
import CalendarWeekView from "../components/calendar/CalendarWeekView";
import GroupDetailModal from "../components/calendar/GroupDetailModal";
import ScheduleEditor from "../components/schedule/ScheduleEditor";
import { useCalendarData } from "../hooks/useCalendarData";

export default function CalendarPage() {
  const { groups, singleEvents, deployments, isLoading, isError, error } = useCalendarData({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showNewScheduleModal, setShowNewScheduleModal] = useState(false);
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
        title="Calendario settimanale"
        description="Blocchi raggruppati per deployment. Clicca su un gruppo per vedere i dettagli."
        action={
          <Button variant="primary" size="sm" onClick={() => setShowNewScheduleModal(true)}>
            + Nuova Schedule
          </Button>
        }
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
            <span>Caricamento calendario...</span>
          </div>
        )}
        {isError && <p className="text-sm text-text-error">{error?.message}</p>}
        {!isLoading && !isError && (
          <CalendarWeekView groups={filteredGroups} singleEvents={filteredSingleEvents} onSelect={setSelectedGroup} />
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
