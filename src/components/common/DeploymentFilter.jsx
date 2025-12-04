import React, { useState, useRef, useEffect, useMemo } from "react";

export default function DeploymentFilter({ deployments = [], selected = [], onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapperRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredDeployments = useMemo(() => {
        if (!search) return deployments;
        const lower = search.toLowerCase();
        return deployments.filter((d) => d.name?.toLowerCase().includes(lower));
    }, [deployments, search]);

    const toggleDeployment = (deploymentId) => {
        if (selected.includes(deploymentId)) {
            onChange(selected.filter((id) => id !== deploymentId));
        } else {
            onChange([...selected, deploymentId]);
        }
    };

    const clearAll = () => {
        onChange([]);
        setSearch("");
    };

    const selectAll = () => {
        onChange(deployments.map((d) => d.id));
    };

    const selectedNames = useMemo(() => {
        return selected
            .map((id) => deployments.find((d) => d.id === id)?.name)
            .filter(Boolean);
    }, [selected, deployments]);

    return (
        <div ref={wrapperRef} className="relative">
            {/* Trigger button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md border border-border-primary bg-bg-primary hover:bg-bg-secondary transition min-w-[200px]"
            >
                <span className="text-text-tertiary">🏷️</span>
                {selected.length === 0 ? (
                    <span className="text-text-tertiary">Tutti i deployment</span>
                ) : selected.length === 1 ? (
                    <span className="text-text-primary truncate">{selectedNames[0]}</span>
                ) : (
                    <span className="text-text-primary">{selected.length} deployment</span>
                )}
                <span className="ml-auto text-text-tertiary">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 max-h-80 overflow-hidden rounded-lg border border-border-primary bg-bg-primary shadow-xl z-50 flex flex-col">
                    {/* Search input */}
                    <div className="p-2 border-b border-border-primary">
                        <input
                            type="text"
                            placeholder="Cerca deployment..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-md border border-border-primary bg-bg-secondary text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-button-primary"
                            autoFocus
                        />
                    </div>

                    {/* Quick actions */}
                    <div className="flex gap-2 p-2 border-b border-border-primary text-xs">
                        <button
                            onClick={selectAll}
                            className="text-button-primary hover:underline"
                        >
                            Seleziona tutti
                        </button>
                        <span className="text-text-tertiary">|</span>
                        <button
                            onClick={clearAll}
                            className="text-button-primary hover:underline"
                        >
                            Deseleziona tutti
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredDeployments.length === 0 ? (
                            <p className="p-3 text-sm text-text-tertiary">Nessun deployment trovato</p>
                        ) : (
                            filteredDeployments.map((dep) => {
                                const isSelected = selected.includes(dep.id);
                                return (
                                    <button
                                        key={dep.id}
                                        onClick={() => toggleDeployment(dep.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-secondary transition ${isSelected ? "bg-bg-tertiary" : ""
                                            }`}
                                    >
                                        <span
                                            className={`w-4 h-4 rounded border flex items-center justify-center text-xs ${isSelected
                                                    ? "bg-button-primary border-button-primary text-white"
                                                    : "border-border-primary"
                                                }`}
                                        >
                                            {isSelected && "✓"}
                                        </span>
                                        <span className="text-text-primary truncate">{dep.name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Selected count */}
                    {selected.length > 0 && (
                        <div className="p-2 border-t border-border-primary text-xs text-text-secondary">
                            {selected.length} di {deployments.length} selezionati
                        </div>
                    )}
                </div>
            )}

            {/* Selected tags */}
            {selected.length > 0 && selected.length <= 3 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {selectedNames.map((name, idx) => (
                        <span
                            key={selected[idx]}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-bg-tertiary text-text-primary"
                        >
                            {name}
                            <button
                                onClick={() => toggleDeployment(selected[idx])}
                                className="text-text-tertiary hover:text-text-primary"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
