import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";

const UiContext = createContext(null);

export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const pushToast = useCallback((title, message, tone = "info") => {
    const id = uuid();
    setToasts((prev) => [...prev, { id, title, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      pushToast,
      sidebarOpen,
      setSidebarOpen,
      setToasts
    }),
    [toasts, pushToast, sidebarOpen, setToasts]
  );

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi() {
  const ctx = useContext(UiContext);
  if (!ctx) {
    throw new Error("useUi must be used within UiProvider");
  }
  return ctx;
}
