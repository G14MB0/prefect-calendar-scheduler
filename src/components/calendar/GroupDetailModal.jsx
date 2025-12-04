import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { colorForDeployment } from "../../utils/grouping";
import StatusBadge from "../common/StatusBadge";
import Button from "../common/Button";
import RunDetailModal from "./RunDetailModal";

export default function GroupDetailModal({ group, onClose }) {
    const [sortOrder, setSortOrder] = useState("asc"); // asc = earliest first, desc = latest first
    const [selectedRun, setSelectedRun] = useState(null);

    if (!group) return null;

    const occurrences = group.occurrences || [];
    const deploymentName = group.deploymentName || occurrences[0]?.deploymentName || "Deployment";

    // Sort occurrences
    const sortedOccurrences = useMemo(() => {
        const sorted = [...occurrences].sort((a, b) => {
            const diff = new Date(a.startTime) - new Date(b.startTime);
            return sortOrder === "asc" ? diff : -diff;
        });
        return sorted;
    }, [occurrences, sortOrder]);

    // Group by hour
    const byHour = useMemo(() => {
        const map = {};
        sortedOccurrences.forEach((occ) => {
            const hourKey = format(new Date(occ.startTime), "yyyy-MM-dd HH:00");
            if (!map[hourKey]) map[hourKey] = [];
            map[hourKey].push(occ);
        });

        // Convert to array and sort
        const entries = Object.entries(map);
        entries.sort((a, b) => {
            const diff = new Date(a[0]) - new Date(b[0]);
            return sortOrder === "asc" ? diff : -diff;
        });

        return entries;
    }, [sortedOccurrences, sortOrder]);

    // Stats
    const scheduledCount = occurrences.filter(
        (o) => (o.stateName || "").toLowerCase() === "scheduled" || (o.stateName || "").toLowerCase() === "pending"
    ).length;
    const completedCount = occurrences.filter(
        (o) => (o.stateName || "").toLowerCase() === "completed"
    ).length;
    const failedCount = occurrences.filter(
        (o) => (o.stateName || "").toLowerCase() === "failed" || (o.stateName || "").toLowerCase() === "crashed"
    ).length;
    const otherCount = occurrences.length - scheduledCount - completedCount - failedCount;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-lg bg-bg-primary shadow-xl flex flex-col">
                {/* Header */}
                <div
                    className="p-4 border-b border-border-primary"
                    style={{ background: colorForDeployment(group.deploymentId) + "15" }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase text-text-tertiary">Dettaglio Deployment</p>
                            <h2 className="text-xl font-semibold text-text-primary">{deploymentName}</h2>
                            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                                <span className="text-text-secondary">{occurrences.length} esecuzioni totali</span>
                                {scheduledCount > 0 && <span className="text-blue-500">{scheduledCount} pianificate</span>}
                                {completedCount > 0 && <span className="text-green-500">{completedCount} completate</span>}
                                {failedCount > 0 && <span className="text-red-500">{failedCount} fallite</span>}
                                {otherCount > 0 && <span className="text-text-tertiary">{otherCount} altre</span>}
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            Chiudi
                        </Button>
                    </div>
                </div>

                {/* Controls */}
                <div className="p-3 border-b border-border-primary flex items-center justify-between bg-bg-secondary">
                    <span className="text-sm text-text-secondary">
                        Raggruppate per ora
                    </span>
                    <button
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="text-sm text-button-primary hover:underline flex items-center gap-1"
                    >
                        {sortOrder === "asc" ? "↑ Prima le più vecchie" : "↓ Prima le più recenti"}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {byHour.length === 0 ? (
                        <p className="text-sm text-text-tertiary">Nessuna esecuzione trovata.</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {byHour.map(([hourKey, hourOccs]) => (
                                <div key={hourKey} className="rounded-lg border border-border-primary overflow-hidden">
                                    <div className="bg-bg-tertiary px-3 py-2 flex items-center justify-between">
                                        <span className="text-sm font-semibold text-text-primary">
                                            {format(new Date(hourKey), "EEEE dd MMM - HH:00")}
                                        </span>
                                        <span className="text-xs text-text-tertiary">
                                            {hourOccs.length} esecuzioni
                                        </span>
                                    </div>
                                    <div className="divide-y divide-border-primary">
                                        {hourOccs.map((occ, idx) => (
                                            <div
                                                key={occ.runId || `${occ.startTime}-${idx}`}
                                                className="px-3 py-2 flex items-center justify-between hover:bg-bg-secondary transition cursor-pointer"
                                                onClick={() => setSelectedRun(occ)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-text-tertiary font-mono w-12">
                                                        {format(new Date(occ.startTime), "HH:mm")}
                                                    </span>
                                                    <StatusBadge state={occ.stateName} />
                                                    <span className="text-sm text-text-primary">
                                                        {occ.raw?.name || `Run ${idx + 1}`}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-text-tertiary">
                                                    Clicca per dettagli →
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Run Detail Modal */}
                {selectedRun && (
                    <RunDetailModal
                        event={selectedRun}
                        onClose={() => setSelectedRun(null)}
                    />
                )}
            </div>
        </div>
    );
}
