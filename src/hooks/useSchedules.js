import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSchedule, deleteSchedule, updateSchedule } from "../api/resources";
import { useUi } from "../context/UiContext";

export function useScheduleMutations(deploymentId) {
  const queryClient = useQueryClient();
  const { pushToast } = useUi();

  const onSuccessCommon = (msg) => {
    pushToast("Success", msg, "success");
    queryClient.invalidateQueries({ queryKey: ["runs"] });
    queryClient.invalidateQueries({ queryKey: ["deployment-schedules"] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createSchedule(deploymentId, payload),
    onSuccess: () => onSuccessCommon("Schedule created"),
    onError: (err) => pushToast("Error", err.message, "error")
  });

  const updateMutation = useMutation({
    mutationFn: ({ scheduleId, payload }) => updateSchedule(deploymentId, scheduleId, payload),
    onSuccess: () => onSuccessCommon("Schedule updated"),
    onError: (err) => pushToast("Error", err.message, "error")
  });

  const deleteMutation = useMutation({
    mutationFn: (scheduleId) => deleteSchedule(deploymentId, scheduleId),
    onSuccess: () => onSuccessCommon("Schedule deleted"),
    onError: (err) => pushToast("Error", err.message, "error")
  });

  return {
    createSchedule: createMutation,
    updateSchedule: updateMutation,
    deleteSchedule: deleteMutation
  };
}
