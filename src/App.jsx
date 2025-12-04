import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import CalendarPage from "./pages/CalendarPage";
import ListPage from "./pages/ListPage";
import AgendaPage from "./pages/AgendaPage";
import SettingsPage from "./pages/SettingsPage";
import ScheduleEditorPage from "./pages/ScheduleEditorPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/list" element={<ListPage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/editor" element={<ScheduleEditorPage />} />
      </Route>
    </Routes>
  );
}
