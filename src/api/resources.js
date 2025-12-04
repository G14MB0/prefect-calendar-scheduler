import { getHttpClient } from "./httpClient";

const client = getHttpClient();

// Prefect v3 API has a max limit of 200
const MAX_LIMIT = 200;

export async function pingHealth() {
  const { data } = await client.get("/health");
  return data;
}

export async function fetchDeployments() {
  // Prefect v3 uses POST /deployments/filter
  const { data } = await client.post("/deployments/filter", {
    offset: 0,
    limit: MAX_LIMIT
  });
  return data;
}

export async function fetchDeploymentSchedule(deploymentId) {
  // Get deployment detail which contains schedules
  const { data } = await client.get(`/deployments/${deploymentId}`);
  // Prefect v3 deployments have a `schedules` array
  return data?.schedules || [];
}

export async function fetchDeploymentRuns(deploymentId, params = {}) {
  // Prefect v3 uses POST /flow_runs/filter with proper filter structure
  const { start_time_after, start_time_before } = params;

  // Build the filter according to Prefect v3 schema
  // Include all state types to get scheduled runs too
  const filter = {
    flow_runs: {
      deployment_id: {
        any_: [deploymentId]
      },
      ...(start_time_after || start_time_before ? {
        expected_start_time: {
          ...(start_time_after && { after_: start_time_after }),
          ...(start_time_before && { before_: start_time_before })
        }
      } : {})
    },
    limit: MAX_LIMIT,
    offset: 0
  };

  const { data } = await client.post("/flow_runs/filter", filter);
  return data;
}

export async function fetchScheduledRuns(deploymentIds, scheduledBefore) {
  // Prefect v3: POST /deployments/get_scheduled_flow_runs
  // This returns flow runs that are scheduled but not yet executed
  const { data } = await client.post("/deployments/get_scheduled_flow_runs", {
    deployment_ids: deploymentIds,
    scheduled_before: scheduledBefore,
    limit: MAX_LIMIT
  });
  return data;
}

export async function createSchedule(deploymentId, payload) {
  // Prefect v3: POST /deployments/{id}/schedules with proper schedule structure
  // The API expects: { schedule: { cron|interval|rrule }, active: bool }
  const scheduleData = buildSchedulePayload(payload);
  const { data } = await client.post(`/deployments/${deploymentId}/schedules`, [scheduleData]);
  return data;
}

export async function updateSchedule(deploymentId, scheduleId, payload) {
  // Prefect v3: PATCH /deployments/{id}/schedules/{schedule_id}
  const scheduleData = buildScheduleUpdatePayload(payload);
  const { data } = await client.patch(`/deployments/${deploymentId}/schedules/${scheduleId}`, scheduleData);
  return data;
}

export async function deleteSchedule(deploymentId, scheduleId) {
  // Prefect v3: DELETE /deployments/{id}/schedules/{schedule_id}
  const { data } = await client.delete(`/deployments/${deploymentId}/schedules/${scheduleId}`);
  return data;
}

// Build Prefect v3 schedule payload from form data
function buildSchedulePayload(payload) {
  const schedule = buildScheduleObject(payload);
  return {
    schedule,
    active: payload.active !== false
  };
}

function buildScheduleUpdatePayload(payload) {
  const result = {};
  if (payload.active !== undefined) {
    result.active = payload.active;
  }
  // Only include schedule if type-specific fields are provided
  if (payload.type || payload.cron || payload.interval_seconds || payload.rrule) {
    result.schedule = buildScheduleObject(payload);
  }
  return result;
}

function buildScheduleObject(payload) {
  const type = payload.type || 'interval';

  if (type === 'cron') {
    return {
      cron: payload.cron || '0 * * * *',
      timezone: payload.timezone || 'UTC'
    };
  }

  if (type === 'rrule') {
    return {
      rrule: payload.rrule,
      timezone: payload.timezone || 'UTC'
    };
  }

  if (type === 'once') {
    // One-time schedule - use interval with very large value or use cron for specific time
    return {
      cron: formatDateTimeAsCron(payload.start_time),
      timezone: payload.timezone || 'UTC'
    };
  }

  // Default: interval schedule
  return {
    interval: payload.interval_seconds || 900,
    anchor_date: payload.anchor_date || payload.start_time || new Date().toISOString(),
    timezone: payload.timezone || 'UTC'
  };
}

function formatDateTimeAsCron(dateTimeStr) {
  if (!dateTimeStr) return '0 0 * * *';
  const date = new Date(dateTimeStr);
  const minute = date.getMinutes();
  const hour = date.getHours();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${minute} ${hour} ${day} ${month} *`;
}
