import { differenceInSeconds, parseISO } from "date-fns";

// Simple stable palette and deterministic hash to keep deployment color consistent.
const palette = [
  "var(--accent-blue)",
  "var(--accent-green)",
  "var(--accent-orange)",
  "var(--accent-purple)",
  "#0ea5e9",
  "#f59e0b",
  "#10b981",
  "#9333ea"
];

// Maximum groups to show per deployment in calendar view
const MAX_GROUPS_PER_DEPLOYMENT = 5;

export function colorForDeployment(deploymentId = "") {
  let hash = 0;
  for (let i = 0; i < deploymentId.length; i += 1) {
    hash = (hash << 5) - hash + deploymentId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

export function normalizeEvents(runs = [], deploymentsById = {}, schedulesById = {}, uiBaseUrl = "") {
  return runs.map((run) => {
    const start = run.start_time || run.expected_start_time || run.scheduled_time;
    const deploymentId = run.deployment_id;
    const deploymentName = deploymentsById[deploymentId]?.name || run.deployment_name || "Deployment";
    const schedule = run.schedule_id ? schedulesById[run.schedule_id] : null;
    const frequency =
      run.frequency ||
      schedule?.interval_seconds ||
      schedule?.interval ||
      (typeof run.interval_seconds === "number" ? run.interval_seconds : null);
    const stateName = run.state_name || run.state || run.state_type || "unknown";
    const runId = run.id || run.flow_run_id;
    const prefectUrl = runId ? buildFlowRunUrl(uiBaseUrl, runId) : null;
    return {
      deploymentId,
      deploymentName,
      scheduleId: run.schedule_id || null,
      startTime: start ? new Date(start) : new Date(),
      frequency: frequency || null,
      stateName,
      runId,
      prefectUrl,
      raw: run
    };
  });
}

export function groupEvents(events = []) {
  if (!events.length) return { groups: [], singleEvents: [] };

  // Group events by deployment (not by frequency matching)
  const byDeployment = {};

  for (const event of events) {
    const depId = event.deploymentId;
    if (!byDeployment[depId]) {
      byDeployment[depId] = [];
    }
    byDeployment[depId].push(event);
  }

  const groups = [];

  for (const depId of Object.keys(byDeployment)) {
    const depEvents = byDeployment[depId];

    // Sort by start time
    depEvents.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Create a single group for this deployment with all its events
    if (depEvents.length > 0) {
      groups.push({
        deploymentId: depId,
        scheduleId: depEvents[0].scheduleId,
        start: depEvents[0].startTime,
        end: depEvents[depEvents.length - 1].startTime,
        occurrences: depEvents,
        frequency: depEvents[0].frequency,
        deploymentName: depEvents[0].deploymentName
      });
    }
  }

  // Sort groups by start time
  groups.sort((a, b) => new Date(a.start) - new Date(b.start));

  // No singles - everything is grouped by deployment
  return { groups, singleEvents: [] };
}

// Limit groups to a maximum per deployment, keeping most recent ones
function limitGroupsPerDeployment(groups, maxPerDeployment) {
  const byDeployment = {};

  // Group by deployment
  for (const group of groups) {
    const depId = group.deploymentId;
    if (!byDeployment[depId]) {
      byDeployment[depId] = [];
    }
    byDeployment[depId].push(group);
  }

  // Limit each deployment's groups
  const limited = [];
  for (const depId of Object.keys(byDeployment)) {
    const depGroups = byDeployment[depId];
    // Sort by start time descending (most recent first)
    depGroups.sort((a, b) => new Date(b.start) - new Date(a.start));
    // Take only the first maxPerDeployment groups
    const kept = depGroups.slice(0, maxPerDeployment);
    // Add remaining count info to the first group if there are more
    if (depGroups.length > maxPerDeployment) {
      kept[0].hiddenCount = depGroups.length - maxPerDeployment;
      kept[0].totalOccurrences = depGroups.reduce((sum, g) => sum + g.occurrences.length, 0);
    }
    limited.push(...kept);
  }

  // Sort final result by start time
  limited.sort((a, b) => new Date(a.start) - new Date(b.start));

  return limited;
}

export function parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  return parseISO(value);
}

function buildFlowRunUrl(uiBaseUrl, runId) {
  if (!uiBaseUrl || !runId) return null;
  const base = uiBaseUrl.replace(/\/+$/, "");
  return `${base}/flow-runs/flow-run/${runId}`;
}
