import React from "react";
import { format } from "date-fns";
import { colorForDeployment } from "../../utils/grouping";
import StatusBadge from "../common/StatusBadge";
import Button from "../common/Button";
import Card from "../common/Card";

export default function RunDetailModal({ event, onClose }) {
    if (!event) return null;

    const raw = event.raw || {};
    const deploymentName = event.deploymentName || "Deployment";
    const runName = raw.name || "Flow Run";
    const stateName = event.stateName || raw.state_name || "unknown";
    const startTime = event.startTime || raw.start_time || raw.expected_start_time;
    const endTime = raw.end_time;
    const duration = raw.total_run_time || raw.estimated_run_time;
    const parameters = raw.parameters || {};
    const tags = raw.tags || [];
    const runId = event.runId || raw.id;
    const deploymentId = event.deploymentId || raw.deployment_id;
    const flowId = raw.flow_id;
    const workPoolName = raw.work_pool_name;
    const workQueueName = raw.work_queue_name;
    const infrastructurePid = raw.infrastructure_pid;
    const stateMessage = raw.state?.message || raw.state_message;

    // Format duration
    const formatDuration = (seconds) => {
        if (!seconds) return "-";
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg bg-bg-primary shadow-xl flex flex-col">
                {/* Header */}
                <div
                    className="p-4 border-b border-border-primary"
                    style={{ background: colorForDeployment(deploymentId) + "15" }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase text-text-tertiary">Dettaglio Esecuzione</p>
                            <h2 className="text-xl font-semibold text-text-primary">{runName}</h2>
                            <p className="text-sm text-text-secondary mt-1">{deploymentName}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge state={stateName} />
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                ✕
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Timing */}
                    <Card title="Tempistiche" className="text-sm">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <span className="text-text-tertiary">Inizio:</span>
                                <p className="font-medium text-text-primary">
                                    {startTime ? format(new Date(startTime), "dd MMM yyyy HH:mm:ss") : "-"}
                                </p>
                            </div>
                            <div>
                                <span className="text-text-tertiary">Fine:</span>
                                <p className="font-medium text-text-primary">
                                    {endTime ? format(new Date(endTime), "dd MMM yyyy HH:mm:ss") : "-"}
                                </p>
                            </div>
                            <div>
                                <span className="text-text-tertiary">Durata:</span>
                                <p className="font-medium text-text-primary">{formatDuration(duration)}</p>
                            </div>
                            <div>
                                <span className="text-text-tertiary">Stato:</span>
                                <p className="font-medium text-text-primary capitalize">{stateName}</p>
                            </div>
                        </div>
                        {stateMessage && (
                            <div className="mt-3 p-2 bg-bg-secondary rounded text-xs text-text-secondary">
                                {stateMessage}
                            </div>
                        )}
                    </Card>

                    {/* IDs */}
                    <Card title="Identificativi" className="text-sm">
                        <div className="grid grid-cols-1 gap-2">
                            {runId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-tertiary">Run ID:</span>
                                    <code className="text-xs bg-bg-secondary px-2 py-1 rounded font-mono">
                                        {runId}
                                    </code>
                                </div>
                            )}
                            {deploymentId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-tertiary">Deployment ID:</span>
                                    <code className="text-xs bg-bg-secondary px-2 py-1 rounded font-mono">
                                        {deploymentId}
                                    </code>
                                </div>
                            )}
                            {flowId && (
                                <div className="flex items-center justify-between">
                                    <span className="text-text-tertiary">Flow ID:</span>
                                    <code className="text-xs bg-bg-secondary px-2 py-1 rounded font-mono">
                                        {flowId}
                                    </code>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Infrastructure */}
                    {(workPoolName || workQueueName || infrastructurePid) && (
                        <Card title="Infrastruttura" className="text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                {workPoolName && (
                                    <div>
                                        <span className="text-text-tertiary">Work Pool:</span>
                                        <p className="font-medium text-text-primary">{workPoolName}</p>
                                    </div>
                                )}
                                {workQueueName && (
                                    <div>
                                        <span className="text-text-tertiary">Work Queue:</span>
                                        <p className="font-medium text-text-primary">{workQueueName}</p>
                                    </div>
                                )}
                                {infrastructurePid && (
                                    <div>
                                        <span className="text-text-tertiary">PID:</span>
                                        <p className="font-medium text-text-primary">{infrastructurePid}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Parameters */}
                    {Object.keys(parameters).length > 0 && (
                        <Card title="Parametri" className="text-sm">
                            <div className="bg-bg-secondary p-3 rounded overflow-x-auto">
                                <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap">
                                    {JSON.stringify(parameters, null, 2)}
                                </pre>
                            </div>
                        </Card>
                    )}

                    {/* Tags */}
                    {tags.length > 0 && (
                        <Card title="Tags" className="text-sm">
                            <div className="flex flex-wrap gap-2">
                                {tags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="px-2 py-1 bg-bg-secondary text-text-secondary text-xs rounded"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* Link to Prefect */}
                    {event.prefectUrl && (
                        <div className="pt-2">
                            <a
                                href={event.prefectUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-button-primary hover:underline"
                            >
                                🔗 Apri in Prefect UI
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
