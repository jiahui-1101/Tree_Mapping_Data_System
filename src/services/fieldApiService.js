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
      dashboard,
      source: "backend",
    };
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
