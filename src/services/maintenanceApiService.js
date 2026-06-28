const API_BASES = [
  import.meta.env.VITE_M1C_API_BASE,
  import.meta.env.VITE_SS3_API_BASE,
  "http://localhost:4174",
  "http://localhost:4001",
].filter(Boolean);

async function requestMaintenanceApi(path, { method = "GET", body } = {}) {
  let lastError;
  for (const apiBase of [...new Set(API_BASES)]) {
    try {
      const response = await fetch(`${apiBase}${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok || payload.ok === false) {
        throw new Error(payload.message || payload.error || "Maintenance backend request failed");
      }
      return payload;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Maintenance backend request failed");
}

export async function fetchMaintenanceAlertsBackend() {
  try {
    const payload = await requestMaintenanceApi("/api/predictive-alerts");
    return payload.data || [];
  } catch {
    return null;
  }
}

export async function generateMaintenanceAlertsBackend() {
  try {
    return await requestMaintenanceApi("/api/predictive-alerts/generate", { method: "POST" });
  } catch {
    return null;
  }
}

export async function updateMaintenanceAlertStatusBackend({ alertId, status }) {
  try {
    return await requestMaintenanceApi(`/api/predictive-alerts/${encodeURIComponent(alertId)}/status`, {
      method: "PATCH",
      body: { status },
    });
  } catch {
    return null;
  }
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
