import React, { useState } from "react";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import Button from "../components/common/Button";
import DeploymentFilter from "../components/common/DeploymentFilter";
import ScheduleEditor from "../components/schedule/ScheduleEditor";
import StatusBadge from "../components/common/StatusBadge";
import { useCalendarData } from "../hooks/useCalendarData";
import { useScheduleMutations } from "../hooks/useSchedules";
import { colorForDeployment } from "../utils/grouping";
import { format } from "date-fns";

function ScheduleCard({ schedule, deploymentId, onEdit }) {
    const { deleteSchedule, toggleSchedule } = useScheduleMutations(deploymentId);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const handleToggle = async () => {
        setIsToggling(true);
        try {
            await toggleSchedule.mutateAsync({ scheduleId: schedule.id, active: !schedule.active });
        } finally {
            setIsToggling(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Sei sicuro di voler eliminare questa schedule?")) return;
        setIsDeleting(true);
        try {
            await deleteSchedule.mutateAsync(schedule.id);
        } finally {
            setIsDeleting(false);
        }
    };

    // Parse schedule type and details
    const getScheduleDescription = () => {
        const s = schedule.schedule || schedule;
        if (s.cron) return `Cron: ${s.cron}`;
        if (s.interval) return `Ogni ${s.interval} secondi`;
        if (s.rrule) return `RRule: ${s.rrule}`;
        return "Schedule";
    };

    return (
        <div
            className={`rounded-md border p-3 ${schedule.active
                    ? "border-border-primary bg-bg-primary"
                    : "border-dashed border-border-primary bg-bg-secondary opacity-60"
                }`}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${schedule.active ? "bg-green-500" : "bg-gray-400"}`} />
                        <span className="text-sm font-medium text-text-primary">
                            {getScheduleDescription()}
                        </span>
                    </div>
                    {schedule.schedule?.timezone && (
                        <p className="text-xs text-text-tertiary mt-1">
                            Timezone: {schedule.schedule.timezone}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleToggle}
                        disabled={isToggling}
                        className={`px-2 py-1 text-xs rounded transition ${schedule.active
                                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                                : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                    >
                        {isToggling ? "..." : schedule.active ? "Disabilita" : "Abilita"}
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 transition"
                    >
                        {isDeleting ? "..." : "Elimina"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function DeploymentCard({ deployment, schedules = [], runs = [], onNewSchedule }) {
    const [expanded, setExpanded] = useState(false);

    // Stats
    const scheduledRuns = runs.filter(r => {
        const s = (r.stateName || "").toLowerCase();
        return s === "scheduled" || s === "pending";
    });
    const completedRuns = runs.filter(r => (r.stateName || "").toLowerCase() === "completed");
    const failedRuns = runs.filter(r => {
        const s = (r.stateName || "").toLowerCase();
        return s === "failed" || s === "crashed";
    });
    const activeSchedules = schedules.filter(s => s.active);

    return (
        <div
            className="rounded-lg border border-border-primary overflow-hidden"
            style={{ borderLeftColor: colorForDeployment(deployment.id), borderLeftWidth: 4 }}
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full p-4 text-left hover:bg-bg-secondary transition flex items-center justify-between"
            >
                <div>
                    <h3 className="text-base font-semibold text-text-primary">{deployment.name}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs">
                        <span className="text-text-secondary">
                            {activeSchedules.length}/{schedules.length} schedule attive
                        </span>
                        {scheduledRuns.length > 0 && (
                            <span className="text-blue-500">{scheduledRuns.length} pianificate</span>
                        )}
                        {completedRuns.length > 0 && (
                            <span className="text-green-500">{completedRuns.length} completate</span>
                        )}
                        {failedRuns.length > 0 && (
                            <span className="text-red-500">{failedRuns.length} fallite</span>
                        )}
                    </div>
                </div>
                <span className="text-text-tertiary">{expanded ? "▼" : "▶"}</span>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-border-primary">
                    {/* Schedules section */}
                    <div className="p-4 bg-bg-secondary">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-text-primary">Schedule</h4>
                            <Button variant="ghost" size="sm" onClick={() => onNewSchedule(deployment.id)}>
                                + Aggiungi
                            </Button>
                        </div>
                        {schedules.length === 0 ? (
                            <p className="text-sm text-text-tertiary">Nessuna schedule configurata</p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {schedules.map((schedule) => (
                                    <ScheduleCard
                                        key={schedule.id}
                                        schedule={schedule}
                                        deploymentId={deployment.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent runs section */}
                    <div className="p-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-3">
                            Ultime esecuzioni ({runs.length})
                        </h4>
                        {runs.length === 0 ? (
                            <p className="text-sm text-text-tertiary">Nessuna esecuzione recente</p>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                                {runs.slice(0, 20).map((run, idx) => (
                                    <div
                                        key={run.runId || `${run.startTime}-${idx}`}
                                        className="flex items-center justify-between px-2 py-1 rounded hover:bg-bg-tertiary"
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-text-tertiary font-mono">
                                                {format(new Date(run.startTime), "dd/MM HH:mm")}
                                            </span>
                                            <StatusBadge state={run.stateName} />
                                        </div>
                                        {run.prefectUrl && (
                                            <a
                                                href={run.prefectUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-xs text-button-primary hover:underline"
                                            >
                                                Apri
                                            </a>
                                        )}
                                    </div>
                                ))}
                                {runs.length > 20 && (
                                    <p className="text-xs text-text-tertiary text-center py-1">
                                        +{runs.length - 20} altre esecuzioni
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DeploymentPage() {
    const { deployments, schedules, groups, isLoading, isError, error } = useCalendarData({});
    const [selectedDeployments, setSelectedDeployments] = useState([]);
    const [scheduleModalDeploymentId, setScheduleModalDeploymentId] = useState(null);

    // Normalize deployments
    const deploymentList = React.useMemo(() => {
        if (Array.isArray(deployments)) return deployments;
        if (deployments?.items) return deployments.items;
        return [];
    }, [deployments]);

    // Filter deployments
    const filteredDeployments = React.useMemo(() => {
        if (selectedDeployments.length === 0) return deploymentList;
        return deploymentList.filter((d) => selectedDeployments.includes(d.id));
    }, [deploymentList, selectedDeployments]);

    // Get runs for a deployment
    const getRunsForDeployment = (deploymentId) => {
        const group = groups.find((g) => g.deploymentId === deploymentId);
        return group?.occurrences || [];
    };

    // Get schedules for a deployment
    const getSchedulesForDeployment = (deploymentId) => {
        return schedules[deploymentId] || [];
    };

    return (
        <div className="flex flex-col gap-4">
            <Card
                title="Vista per Deployment"
                description="Dashboard raggruppata per deployment con gestione schedule."
            >
                {/* Filter */}
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
                        <span>Caricamento deployment...</span>
                    </div>
                )}
                {isError && <p className="text-sm text-text-error">{error?.message}</p>}
                {!isLoading && !isError && (
                    <div className="flex flex-col gap-4">
                        {filteredDeployments.length === 0 ? (
                            <p className="text-sm text-text-tertiary">Nessun deployment trovato.</p>
                        ) : (
                            filteredDeployments.map((deployment) => (
                                <DeploymentCard
                                    key={deployment.id}
                                    deployment={deployment}
                                    schedules={getSchedulesForDeployment(deployment.id)}
                                    runs={getRunsForDeployment(deployment.id)}
                                    onNewSchedule={setScheduleModalDeploymentId}
                                />
                            ))
                        )}
                    </div>
                )}
            </Card>

            {scheduleModalDeploymentId && (
                <ScheduleEditor
                    deploymentId={scheduleModalDeploymentId}
                    onClose={() => setScheduleModalDeploymentId(null)}
                />
            )}
        </div>
    );
}
