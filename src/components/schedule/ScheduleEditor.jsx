import React, { useEffect, useMemo, useState } from "react";
import { formatISO, addSeconds } from "date-fns";
import Input from "../common/Input";
import Select from "../common/Select";
import Button from "../common/Button";
import Card from "../common/Card";
import Spinner from "../common/Spinner";
import { useScheduleMutations } from "../../hooks/useSchedules";
import { useCalendarData } from "../../hooks/useCalendarData";

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

  // Load deployments for the selector
  const { deployments, isLoading: deploymentsLoading } = useCalendarData({});

  // Use the selected deployment ID for mutations
  const activeDeploymentId = selectedDeploymentId || initialDeploymentId;
  const { createSchedule, updateSchedule, deleteSchedule } = useScheduleMutations(activeDeploymentId);

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

  const preview = useMemo(() => {
    const list = [];
    const base = form.startTime ? new Date(form.startTime) : new Date();
    if (form.type === "interval") {
      for (let i = 0; i < 5; i += 1) {
        list.push(addSeconds(base, form.intervalSeconds * i));
      }
    } else if (form.type === "once") {
      list.push(base);
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
      return; // Don't submit without a deployment
    }
    const payload = {
      type: form.type,
      interval_seconds: Number(form.intervalSeconds),
      cron: form.cron,
      rrule: form.rrule,
      start_time: form.startTime,
      end_time: form.endTime || null,
      timezone: form.timezone,
      anchor_date: form.anchorDate,
      active: form.active,
      one_time: form.type === "once"
    };
    if (schedule?.id) {
      updateSchedule.mutate({ scheduleId: schedule.id, payload });
    } else {
      createSchedule.mutate(payload);
    }
  };

  const handleDelete = () => {
    if (schedule?.id) {
      deleteSchedule.mutate(schedule.id);
      onClose?.();
    }
  };

  // Find selected deployment name
  const selectedDeploymentName = useMemo(() => {
    if (!activeDeploymentId) return null;
    const dep = deploymentOptions.find(d => d.value === activeDeploymentId);
    return dep?.label || activeDeploymentId;
  }, [activeDeploymentId, deploymentOptions]);

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

        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          {/* Deployment Selector - Always show when no initial deployment or when creating new */}
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
          <div className="flex flex-col gap-2">
            {preview.map((occ, idx) => (
              <div key={idx} className="rounded-md border border-border-primary px-3 py-2 text-sm">
                {occ.toISOString()}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
