import { useMemo } from "react";
import { addDays, subDays } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeploymentRuns, fetchDeployments, fetchDeploymentSchedule } from "../api/resources";
import { useConnection } from "../context/ConnectionContext";
import { groupEvents, normalizeEvents } from "../utils/grouping";
import { getUiBaseUrl } from "../api/httpClient";

export function useCalendarData({ windowDays = 30, pastDays = 7 } = {}) {
  const { settings } = useConnection();
  const queryClient = useQueryClient();
  const windowStart = subDays(new Date(), pastDays).toISOString();
  const windowEnd = addDays(new Date(), windowDays).toISOString();
  const uiBaseUrl = getUiBaseUrl();

  const deploymentsQuery = useQuery({
    queryKey: ["deployments", settings.apiUrl],
    queryFn: fetchDeployments,
    enabled: Boolean(settings.apiUrl),
    staleTime: 1000 * 60 * 5
  });

  const deployments = useMemo(() => {
    const raw = deploymentsQuery.data;
    if (Array.isArray(raw)) return raw;
    if (raw?.items && Array.isArray(raw.items)) return raw.items;
    return [];
  }, [deploymentsQuery.data]);

  const schedulesQuery = useQuery({
    queryKey: ["deployment-schedules", settings.apiUrl],
    enabled: deployments.length > 0,
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const results = await Promise.all(
        deployments.map((d) =>
          fetchDeploymentSchedule(d.id).then((schedule) => ({
            deploymentId: d.id,
            schedules: schedule
          }))
        )
      );
      return results.reduce((acc, entry) => {
        acc[entry.deploymentId] = entry.schedules;
        return acc;
      }, {});
    }
  });

  const runsQuery = useQuery({
    queryKey: ["runs", settings.apiUrl, windowDays, pastDays],
    enabled: deployments.length > 0,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const responses = await Promise.all(
        deployments.map((d) =>
          fetchDeploymentRuns(d.id, {
            start_time_after: windowStart,
            start_time_before: windowEnd
          }).then((runs) => ({
            deploymentId: d.id,
            runs
          }))
        )
      );
      return responses;
    }
  });

  const deploymentsById = useMemo(() => {
    const map = {};
    deployments.forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [deployments]);

  const schedulesById = useMemo(() => {
    const map = {};
    const scheduleCollections = schedulesQuery.data || {};
    Object.values(scheduleCollections).forEach((list) => {
      (list || []).forEach((s) => {
        map[s.id] = s;
      });
    });
    return map;
  }, [schedulesQuery.data]);

  const calendarData = useMemo(() => {
    if (!runsQuery.data) return { groups: [], singleEvents: [] };
    const allRuns = runsQuery.data.flatMap((r) => {
      if (Array.isArray(r.runs)) return r.runs;
      if (r.runs?.items && Array.isArray(r.runs.items)) return r.runs.items;
      return [];
    });
    const events = normalizeEvents(allRuns, deploymentsById, schedulesById, uiBaseUrl);
    return groupEvents(events);
  }, [runsQuery.data, deploymentsById, schedulesById, uiBaseUrl]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["runs"] });
    queryClient.invalidateQueries({ queryKey: ["deployments"] });
    queryClient.invalidateQueries({ queryKey: ["deployment-schedules"] });
  };

  return {
    deployments: deploymentsQuery.data || [],
    schedules: schedulesQuery.data || {},
    deploymentsById,
    isLoading:
      deploymentsQuery.isLoading || schedulesQuery.isLoading || runsQuery.isLoading,
    isError: deploymentsQuery.isError || schedulesQuery.isError || runsQuery.isError,
    error: deploymentsQuery.error || schedulesQuery.error || runsQuery.error,
    groups: calendarData.groups,
    singleEvents: calendarData.singleEvents,
    refresh
  };
}
