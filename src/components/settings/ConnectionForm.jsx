import React, { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";
import Card from "../common/Card";
import ConnectionBadge from "./ConnectionBadge";
import { useConnection } from "../../context/ConnectionContext";
import Spinner from "../common/Spinner";

export default function ConnectionForm() {
  const { settings, updateSettings, testConnection, status, errorMessage } = useConnection();
  const [local, setLocal] = useState(settings);

  const handleChange = (field, value) => {
    const next = { ...local, [field]: value };
    setLocal(next);
    updateSettings(next);
  };

  return (
    <Card title="Connessione Prefect" description="Configura endpoint, API key e workspace">
      <div className="mb-4 flex items-center gap-3">
        <ConnectionBadge />
        {status === "checking" && <Spinner />}
        {errorMessage && <span className="text-sm text-text-error">{errorMessage}</span>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          label="Prefect API URL"
          placeholder="https://prefect.example.com/api"
          value={local.apiUrl}
          onChange={(e) => handleChange("apiUrl", e.target.value)}
        />
        <Input
          label="API Key"
          type="password"
          placeholder="Token"
          value={local.apiKey}
          onChange={(e) => handleChange("apiKey", e.target.value)}
        />
        <Input
          label="Workspace"
          placeholder="default"
          value={local.workspace}
          onChange={(e) => handleChange("workspace", e.target.value)}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={testConnection} variant="primary">
          Test connessione
        </Button>
      </div>
    </Card>
  );
}
