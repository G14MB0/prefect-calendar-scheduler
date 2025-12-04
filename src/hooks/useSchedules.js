import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSchedule, deleteSchedule, updateSchedule, toggleScheduleActive } from "../api/resources";
import { useUi } from "../context/UiContext";
import { useConnection } from "../context/ConnectionContext";

export function useScheduleMutations(deploymentId) {
  const queryClient = useQueryClient();
  const { pushToast } = useUi();
  const { testConnection } = useConnection();

  const onSuccessCommon = async (msg) => {
    pushToast("Success", msg, "success");
    queryClient.invalidateQueries({ queryKey: ["runs"] });
    queryClient.invalidateQueries({ queryKey: ["deployment-schedules"] });
    queryClient.invalidateQueries({ queryKey: ["deployments"] });
    // Retest connection on every successful mutation
    try {
      await testConnection();
    } catch {
      // Ignore test errors
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createSchedule(deploymentId, payload),
    onSuccess: () => onSuccessCommon("Schedule creata"),
    onError: (err) => pushToast("Errore", err.message, "error")
  });

  const updateMutation = useMutation({
    mutationFn: ({ scheduleId, payload }) => updateSchedule(deploymentId, scheduleId, payload),
    onSuccess: () => onSuccessCommon("Schedule aggiornata"),
    onError: (err) => pushToast("Errore", err.message, "error")
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId) => deleteSchedule(deploymentId, scheduleId),
    onSuccess: () => onSuccessCommon("Schedule eliminata"),
    onError: (err) => pushToast("Errore", err.message, "error")
  });

  const toggleMutation = useMutation({
    mutationFn: ({ scheduleId, active }) => toggleScheduleActive(deploymentId, scheduleId, active),
    onSuccess: (_, variables) => onSuccessCommon(variables.active ? "Schedule attivata" : "Schedule disattivata"),
    onError: (err) => pushToast("Errore", err.message, "error")
  });

  return {
    createSchedule: createMutation,
    updateSchedule: updateMutation,
    deleteSchedule: deleteMutation,
    toggleSchedule: toggleMutation
  };
}
