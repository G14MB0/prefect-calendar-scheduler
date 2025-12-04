import React, { useEffect, useMemo, useState } from "react";
import { formatISO, addSeconds } from "date-fns";
import cronstrue from "cronstrue/i18n";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";
import Card from "../common/Card";
import Spinner from "../common/Spinner";
import { useScheduleMutations } from "../../hooks/useSchedules";
import { useCalendarData } from "../../hooks/useCalendarData";
import { runDeploymentNow, fetchDeploymentDetails } from "../../api/resources";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUi } from "../../context/UiContext";

const defaultForm = {
  type: "interval",
  intervalSeconds: 900,
  cron: "0 * * * *",
  rrule: "",
  startTime: formatISO(new Date()).slice(0, 16),
  endTime: "",
  timezone: "UTC",
  anchorDate: formatISO(new Date()).slice(0, 10),
  active: true
};

export default function ScheduleEditor({ deploymentId: initialDeploymentId, schedule, onClose }) {
  const [form, setForm] = useState(defaultForm);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState(initialDeploymentId || "");
  const [activeTab, setActiveTab] = useState("schedule"); // schedule | parameters
  const [runParameters, setRunParameters] = useState({});

  const { pushToast } = useUi();
  const queryClient = useQueryClient();

  // Load deployments for the selector
  const { deployments, isLoading: deploymentsLoading } = useCalendarData({});

  // Use the selected deployment ID for mutations
  const activeDeploymentId = selectedDeploymentId || initialDeploymentId;
  const { createSchedule, updateSchedule, deleteSchedule } = useScheduleMutations(activeDeploymentId);

  // Fetch deployment details to get default parameters
  const { data: deploymentDetails } = useQuery({
    queryKey: ["deployment-details", activeDeploymentId],
    queryFn: () => fetchDeploymentDetails(activeDeploymentId),
    enabled: Boolean(activeDeploymentId),
    staleTime: 1000 * 60 * 5
  });

  // Initialize parameters from deployment defaults
  useEffect(() => {
    if (deploymentDetails?.parameters) {
      setRunParameters(deploymentDetails.parameters);
    }
  }, [deploymentDetails]);

  // Run deployment now mutation
  const runNowMutation = useMutation({
    mutationFn: () => runDeploymentNow(activeDeploymentId, runParameters),
    onSuccess: () => {
      pushToast("Successo", "Deployment avviato!", "success");
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["deployments"] });
      onClose?.();
    },
    onError: (err) => {
      pushToast("Errore", err.message || "Impossibile avviare il deployment", "error");
    }
  });

  // Build deployment options
  const deploymentOptions = useMemo(() => {
    const deps = Array.isArray(deployments) ? deployments : deployments?.items || [];
    return deps.map((d) => ({ value: d.id, label: d.name }));
  }, [deployments]);

  useEffect(() => {
    if (initialDeploymentId) {
      setSelectedDeploymentId(initialDeploymentId);
    }
  }, [initialDeploymentId]);

  useEffect(() => {
    if (schedule) {
      setForm((prev) => ({
        ...prev,
        ...schedule,
        startTime: schedule.startTime || prev.startTime,
        endTime: schedule.endTime || "",
        anchorDate: schedule.anchorDate || prev.anchorDate
      }));
    } else {
      setForm(defaultForm);
    }
  }, [schedule]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleParameterChange = (key, value) => {
    setRunParameters((prev) => ({ ...prev, [key]: value }));
  };

  // Human-readable cron translation
  const cronDescription = useMemo(() => {
    if (form.type !== "cron" || !form.cron) return null;
    try {
      return cronstrue.toString(form.cron, { locale: "it", use24HourTimeFormat: true });
    } catch {
      return "Espressione cron non valida";
    }
  }, [form.type, form.cron]);

  const preview = useMemo(() => {
    const list = [];
    const base = form.startTime ? new Date(form.startTime) : new Date();
    if (form.type === "interval") {
      for (let i = 0; i < 5; i += 1) {
        list.push(addSeconds(base, form.intervalSeconds * i));
      }
    } else if (form.type === "once") {
      list.push(base);
    } else if (form.type === "cron") {
      return [];
    } else {
      list.push(base);
      list.push(addSeconds(base, 3600));
      list.push(addSeconds(base, 7200));
    }
    return list;
  }, [form]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!activeDeploymentId) {
      return;
    }
    const anchorDateValue = form.type === "interval" && form.startTime
      ? new Date(form.startTime).toISOString()
      : form.anchorDate;

    const payload = {
      type: form.type,
      interval_seconds: Number(form.intervalSeconds),
      cron: form.cron,
      rrule: form.rrule,
      start_time: form.startTime ? new Date(form.startTime).toISOString() : null,
      end_time: form.endTime ? new Date(form.endTime).toISOString() : null,
      timezone: form.timezone,
      anchor_date: anchorDateValue,
      active: form.active,
      one_time: form.type === "once"
    };
    if (schedule?.id) {
      updateSchedule.mutate({ scheduleId: schedule.id, payload }, { onSuccess: () => onClose?.() });
    } else {
      createSchedule.mutate(payload, { onSuccess: () => onClose?.() });
    }
  };

  const handleDelete = () => {
    if (schedule?.id) {
      deleteSchedule.mutate(schedule.id);
      onClose?.();
    }
  };

  const handleRunNow = () => {
    if (!activeDeploymentId) return;
    runNowMutation.mutate();
  };

  // Find selected deployment name
  const selectedDeploymentName = useMemo(() => {
    if (!activeDeploymentId) return null;
    const dep = deploymentOptions.find(d => d.value === activeDeploymentId);
    return dep?.label || activeDeploymentId;
  }, [activeDeploymentId, deploymentOptions]);

  // Get parameter schema from deployment
  const parameterSchema = deploymentDetails?.parameter_openapi_schema?.properties || {};
  const parameterKeys = Object.keys(parameterSchema);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-bg-primary p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase text-text-tertiary">Schedule Editor</p>
            <h2 className="text-xl font-semibold text-text-primary">
              {schedule ? "Modifica schedule" : "Nuova schedule"}
            </h2>
            {selectedDeploymentName && (
              <p className="text-sm text-text-secondary mt-1">
                Deployment: <span className="font-medium">{selectedDeploymentName}</span>
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Chiudi
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex border-b border-border-primary">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "schedule"
                ? "border-button-primary text-text-primary"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            onClick={() => setActiveTab("schedule")}
          >
            Schedulazione
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === "parameters"
                ? "border-button-primary text-text-primary"
                : "border-transparent text-text-tertiary hover:text-text-secondary"
              }`}
            onClick={() => setActiveTab("parameters")}
          >
            Parametri
          </button>
        </div>

        {/* Schedule Tab */}
        {activeTab === "schedule" && (
          <>
            <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              {/* Deployment Selector */}
              {!initialDeploymentId && (
                <div className="col-span-1 md:col-span-2">
                  {deploymentsLoading ? (
                    <div className="flex items-center gap-2 text-text-secondary">
                      <Spinner />
                      <span>Caricamento deployment...</span>
                    </div>
                  ) : (
                    <Select
                      label="Deployment *"
                      value={selectedDeploymentId}
                      onChange={(e) => setSelectedDeploymentId(e.target.value)}
                      options={[{ value: "", label: "Seleziona un deployment..." }, ...deploymentOptions]}
                    />
                  )}
                </div>
              )}

              <Select
                label="Tipo"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
                options={[
                  { value: "interval", label: "Interval" },
                  { value: "cron", label: "Cron" },
                  { value: "rrule", label: "RRule" },
                  { value: "once", label: "One-time" }
                ]}
              />

              {form.type === "interval" && (
                <Input
                  label="Interval seconds"
                  type="number"
                  min={1}
                  value={form.intervalSeconds}
                  onChange={(e) => handleChange("intervalSeconds", Number(e.target.value))}
                />
              )}

              {form.type === "cron" && (
                <Input
                  label="Cron"
                  value={form.cron}
                  onChange={(e) => handleChange("cron", e.target.value)}
                  hint="Es: 0 */15 * * *"
                />
              )}

              {form.type === "rrule" && (
                <Input
                  label="RRULE"
                  value={form.rrule}
                  onChange={(e) => handleChange("rrule", e.target.value)}
                  hint="Es: FREQ=DAILY;INTERVAL=1"
                />
              )}

              <Input
                label="Start time"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => handleChange("startTime", e.target.value)}
              />
              <Input
                label="End time"
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => handleChange("endTime", e.target.value)}
              />
              <Input
                label="Timezone"
                value={form.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
              />
              <Input
                label="Anchor date"
                type="date"
                value={form.anchorDate}
                onChange={(e) => handleChange("anchorDate", e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => handleChange("active", e.target.checked)}
                />
                <span>Schedule attiva</span>
              </label>

              <div className="col-span-1 md:col-span-2 flex items-center gap-3">
                <Button type="submit" variant="primary" disabled={!activeDeploymentId}>
                  {schedule ? "Salva modifiche" : "Crea schedule"}
                </Button>
                {schedule?.id && (
                  <Button type="button" variant="ghost" onClick={handleDelete}>
                    Elimina
                  </Button>
                )}
              </div>
            </form>

            <Card title="Preview prossime occorrenze" className="mt-4">
              {form.type === "cron" && cronDescription ? (
                <div className="rounded-md bg-bg-secondary px-4 py-3">
                  <p className="text-sm font-medium text-text-primary">Traduzione Cron:</p>
                  <p className="text-base text-text-secondary mt-1">{cronDescription}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {preview.length > 0 ? (
                    preview.map((occ, idx) => (
                      <div key={idx} className="rounded-md border border-border-primary px-3 py-2 text-sm">
                        {occ.toLocaleString("it-IT", { dateStyle: "full", timeStyle: "medium" })}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-text-tertiary">Nessuna preview disponibile</p>
                  )}
                </div>
              )}
            </Card>
          </>
        )}

        {/* Parameters Tab */}
        {activeTab === "parameters" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-text-secondary">
              Modifica i parametri di default per le esecuzioni di questo deployment.
              I valori qui sotto sono i parametri di default definiti nel deployment.
            </p>

            {parameterKeys.length > 0 ? (
              <div className="space-y-3">
                {parameterKeys.map((key) => {
                  const schema = parameterSchema[key];
                  const value = runParameters[key];
                  const type = schema?.type || "string";

                  return (
                    <div key={key} className="space-y-1">
                      <label className="block text-sm font-medium text-text-primary">
                        {key}
                        {schema?.description && (
                          <span className="font-normal text-text-tertiary ml-2">
                            ({schema.description})
                          </span>
                        )}
                      </label>
                      {type === "boolean" ? (
                        <label className="flex items-center gap-2 text-sm text-text-secondary">
                          <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={(e) => handleParameterChange(key, e.target.checked)}
                          />
                          <span>{value ? "true" : "false"}</span>
                        </label>
                      ) : type === "integer" || type === "number" ? (
                        <input
                          type="number"
                          value={value ?? ""}
                          onChange={(e) => handleParameterChange(key, e.target.value ? Number(e.target.value) : null)}
                          className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                        />
                      ) : type === "object" || type === "array" ? (
                        <textarea
                          value={typeof value === "object" ? JSON.stringify(value, null, 2) : value ?? ""}
                          onChange={(e) => {
                            try {
                              handleParameterChange(key, JSON.parse(e.target.value));
                            } catch {
                              // Keep as string if not valid JSON
                            }
                          }}
                          rows={4}
                          className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary font-mono"
                        />
                      ) : (
                        <input
                          type="text"
                          value={value ?? ""}
                          onChange={(e) => handleParameterChange(key, e.target.value)}
                          className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-md bg-bg-secondary p-4 text-sm text-text-tertiary">
                {Object.keys(runParameters).length > 0 ? (
                  <>
                    <p className="mb-2">Parametri attuali (modifica JSON):</p>
                    <textarea
                      value={JSON.stringify(runParameters, null, 2)}
                      onChange={(e) => {
                        try {
                          setRunParameters(JSON.parse(e.target.value));
                        } catch {
                          // Ignore invalid JSON
                        }
                      }}
                      rows={8}
                      className="w-full rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-sm text-text-primary font-mono"
                    />
                  </>
                ) : (
                  <p>Questo deployment non ha parametri configurati o non sono ancora stati caricati.</p>
                )}
              </div>
            )}

            {/* Run Now Button */}
            <Card title="Esecuzione immediata" className="mt-4">
              <p className="text-sm text-text-secondary mb-3">
                Avvia immediatamente il deployment con i parametri configurati sopra.
              </p>
              <Button
                variant="primary"
                onClick={handleRunNow}
                disabled={!activeDeploymentId || runNowMutation.isPending}
              >
                {runNowMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Avvio in corso...
                  </span>
                ) : (
                  "🚀 Lancia ora"
                )}
              </Button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
