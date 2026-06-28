const API_BASE = import.meta.env.VITE_M1C_API_BASE || import.meta.env.VITE_SS3_API_BASE || "http://localhost:4174";

async function requestMaintenanceApi(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || "Maintenance backend request failed");
  }
  return payload;
}

export async function approveMaintenanceAlertBackend({ alertId, ranger = "Ahmad Razif" }) {
  try {
    return await requestMaintenanceApi(`/api/predictive-alerts/${encodeURIComponent(alertId)}/approve`, {
      method: "POST",
      body: { ranger },
    });
  } catch {
    return null;
  }
}
