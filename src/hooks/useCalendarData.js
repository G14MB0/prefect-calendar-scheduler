import { useMemo } from "react";
import { addDays, subDays } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDeploymentRuns, fetchDeployments, fetchDeploymentSchedule, fetchScheduledRuns } from "../api/resources";
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
      const deploymentIds = deployments.map((d) => d.id);

      // Fetch both past/current runs AND scheduled future runs
      const [flowRunsResponses, scheduledRuns] = await Promise.all([
        // Get flow runs (includes past and some scheduled)
        Promise.all(
          deployments.map((d) =>
            fetchDeploymentRuns(d.id, {
              start_time_after: windowStart,
              start_time_before: windowEnd
            }).then((runs) => ({
              deploymentId: d.id,
              runs
            }))
          )
        ),
        // Get scheduled runs specifically
        fetchScheduledRuns(deploymentIds, windowEnd).catch(() => [])
      ]);

      // Merge scheduled runs into the responses
      // Create a map to avoid duplicates by run ID
      const runsById = new Map();

      // Add flow runs
      flowRunsResponses.forEach((r) => {
        const runs = Array.isArray(r.runs) ? r.runs : r.runs?.items || [];
        runs.forEach((run) => {
          if (run.id) runsById.set(run.id, run);
        });
      });

      // Add scheduled runs (may overlap with flow runs)
      (scheduledRuns || []).forEach((run) => {
        if (run.id && !runsById.has(run.id)) {
          runsById.set(run.id, run);
        }
      });

      // Group by deployment
      const byDeployment = {};
      runsById.forEach((run) => {
        const depId = run.deployment_id;
        if (!byDeployment[depId]) byDeployment[depId] = [];
        byDeployment[depId].push(run);
      });

      return Object.entries(byDeployment).map(([deploymentId, runs]) => ({
        deploymentId,
        runs
      }));
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
    // runsQuery.data is an array of { deploymentId, runs } where runs is already a flat array
    const allRuns = runsQuery.data.flatMap((r) => {
      return Array.isArray(r.runs) ? r.runs : [];
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
