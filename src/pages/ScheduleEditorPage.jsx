import React, { useState } from "react";
import Card from "../components/common/Card";
import Select from "../components/common/Select";
import Button from "../components/common/Button";
import ScheduleEditor from "../components/schedule/ScheduleEditor";
import { useCalendarData } from "../hooks/useCalendarData";
import Spinner from "../components/common/Spinner";

export default function ScheduleEditorPage() {
  const { deployments, isLoading, isError, error } = useCalendarData({});
  const [deploymentId, setDeploymentId] = useState("");
  const [open, setOpen] = useState(false);

  const options = Array.isArray(deployments)
    ? deployments.map((d) => ({ value: d.id, label: d.name }))
    : deployments?.items?.map((d) => ({ value: d.id, label: d.name })) || [];

  return (
    <div className="flex flex-col gap-4">
      <Card
        title="Editor schedule dedicato"
        description="Crea o modifica una schedule senza passare dal calendario."
      >
        {isLoading && (
          <div className="flex items-center gap-2 text-text-secondary">
            <Spinner />
            <span>Caricamento deployment...</span>
          </div>
        )}
        {isError && <p className="text-sm text-text-error">{error?.message}</p>}
        {!isLoading && !isError && (
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <Select
              label="Deployment"
              options={[{ value: "", label: "Seleziona..." }, ...options]}
              value={deploymentId}
              onChange={(e) => setDeploymentId(e.target.value)}
              className="min-w-[240px]"
            />
            <Button
              onClick={() => setOpen(true)}
              disabled={!deploymentId}
              variant="primary"
            >
              Apri editor
            </Button>
          </div>
        )}
      </Card>

      {open && deploymentId && (
        <ScheduleEditor deploymentId={deploymentId} onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
