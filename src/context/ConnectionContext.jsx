import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { configureHttpClient } from "../api/httpClient";
import { pingHealth } from "../api/resources";

const defaultSettings = {
  apiUrl: "",
  apiKey: "",
  workspace: ""
};

const ConnectionContext = createContext(null);

export function ConnectionProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem("prefect-calendar-connection");
    return stored ? JSON.parse(stored) : defaultSettings;
  });
  const [status, setStatus] = useState("idle"); // idle | checking | connected | degraded | error
  const [lastTest, setLastTest] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    configureHttpClient(settings);
    localStorage.setItem("prefect-calendar-connection", JSON.stringify(settings));
  }, [settings]);

  // Auto-test connection when apiUrl is configured
  useEffect(() => {
    if (settings.apiUrl) {
      testConnection.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.apiUrl]);

  const testConnection = useMutation({
    mutationFn: async () => {
      setStatus("checking");
      setErrorMessage("");
      const data = await pingHealth();
      return data;
    },
    onSuccess: () => {
      setStatus("connected");
      setLastTest(new Date().toISOString());
    },
    onError: (err) => {
      setStatus("error");
      setErrorMessage(err?.message || "Unable to reach Prefect API");
    }
  });

  const value = useMemo(
    () => ({
      settings,
      status,
      lastTest,
      errorMessage,
      updateSettings: (next) =>
        setSettings((prev) => ({
          ...prev,
          ...next
        })),
      testConnection: () => testConnection.mutateAsync()
    }),
    [settings, status, lastTest, errorMessage, testConnection]
  );

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
}

export function useConnection() {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within ConnectionProvider");
  }
  return ctx;
}
