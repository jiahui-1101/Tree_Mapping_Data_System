const API_BASE = import.meta.env.VITE_SS2_API_BASE || import.meta.env.VITE_SS3_API_BASE || "http://localhost:4174";

async function requestFieldApi(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || "SS2 backend request failed");
  }
  return payload;
}

export async function fetchFieldBackendState() {
  try {
    const [tasks, reports, rangers, dashboard] = await Promise.all([
      requestFieldApi("/api/ss2/tasks"),
      requestFieldApi("/api/ss2/reports"),
      requestFieldApi("/api/ss2/rangers"),
      requestFieldApi("/api/ss2/dashboard"),
    ]);
    return {
      ok: true,
      tasks: tasks.data || [],
      reports: reports.data || [],
      rangers: rangers.data || [],
      schedule: dashboard.schedule || null,
      dashboard,
      source: "backend",
    };
  } catch {
    return null;
  }
}

export async function generateScheduleBackend({ createdBy, weekLabel } = {}) {
  try {
    return await requestFieldApi("/api/ss2/schedules/generate", {
      method: "POST",
      body: { createdBy, weekLabel },
    });
  } catch {
    return null;
  }
}

export async function updateScheduleAssignmentBackend({ assignmentId, rangerId, rangerName, zone, editedBy, editReason }) {
  try {
    return await requestFieldApi(`/api/ss2/schedule-assignments/${encodeURIComponent(assignmentId)}`, {
      method: "PATCH",
      body: { rangerId, rangerName, zone, editedBy, editReason },
    });
  } catch {
    return null;
  }
}

export async function publishScheduleBackend({ scheduleId, approvedBy }) {
  try {
    return await requestFieldApi(`/api/ss2/schedules/${encodeURIComponent(scheduleId)}/publish`, {
      method: "POST",
      body: { approvedBy },
    });
  } catch {
    return null;
  }
}

export async function fetchFieldNotifications({ ranger = "" } = {}) {
  try {
    const params = ranger ? `?ranger=${encodeURIComponent(ranger)}` : "";
    return await requestFieldApi(`/api/ss2/notifications${params}`);
  } catch {
    return null;
  }
}

export async function upsertRangerBackend(rangerDraft) {
  try {
    return await requestFieldApi("/api/ss2/rangers", {
      method: "POST",
      body: rangerDraft,
    });
  } catch {
    return null;
  }
}

export async function createFieldTaskBackend(taskDraft) {
  try {
    return await requestFieldApi("/api/ss2/tasks", {
      method: "POST",
      body: taskDraft,
    });
  } catch {
    return null;
  }
}

export async function updateFieldTaskStatusBackend({ taskId, status }) {
  try {
    return await requestFieldApi(`/api/ss2/tasks/${encodeURIComponent(taskId)}/status`, {
      method: "PATCH",
      body: { status },
    });
  } catch {
    return null;
  }
}

export async function reassignFieldTaskBackend({ taskId, newRanger, reassignedBy }) {
  try {
    return await requestFieldApi(`/api/ss2/tasks/${encodeURIComponent(taskId)}/reassign`, {
      method: "POST",
      body: { newRanger, reassignedBy },
    });
  } catch {
    return null;
  }
}

export async function submitFieldReportBackend({ treeId, rangerName, draft }) {
  try {
    return await requestFieldApi("/api/ss2/reports", {
      method: "POST",
      body: { treeId, rangerName, draft },
    });
  } catch {
    return null;
  }
}

export async function analyzeFieldPhotoBackend({ treeId, photoName }) {
  try {
    return await requestFieldApi("/api/ss2/photo-analysis", {
      method: "POST",
      body: { treeId, photoName },
    });
  } catch {
    return null;
  }
}
