const API_BASE = import.meta.env.VITE_IT_SUPPORT_API_BASE || import.meta.env.VITE_SS4_API_BASE || import.meta.env.VITE_SS3_API_BASE || "http://localhost:4174";

async function requestItSupportApi(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || "IT Support backend request failed");
  }
  return payload;
}

export async function fetchItDashboardBackend() {
  try { return await requestItSupportApi("/api/it-support/dashboard"); } catch { return null; }
}

export async function fetchItServicesBackend() {
  try { return await requestItSupportApi("/api/it-support/services"); } catch { return null; }
}

export async function fetchItServiceLogsBackend(serviceId) {
  try { return await requestItSupportApi(`/api/it-support/services/${encodeURIComponent(serviceId)}/logs`); } catch { return null; }
}

export async function runItServiceActionBackend({ serviceId, action, actor = "it001" }) {
  try {
    return await requestItSupportApi(`/api/it-support/services/${encodeURIComponent(serviceId)}/actions`, {
      method: "POST",
      body: { action, actor },
    });
  } catch {
    return null;
  }
}

export async function fetchItUsersBackend() {
  try { return await requestItSupportApi("/api/it-support/users"); } catch { return null; }
}

export async function updateItUserAccessBackend({ userId, action, actor = "it001" }) {
  try {
    return await requestItSupportApi(`/api/it-support/users/${encodeURIComponent(userId)}/access`, {
      method: "PATCH",
      body: { action, actor },
    });
  } catch {
    return null;
  }
}

export async function fetchItTicketsBackend() {
  try { return await requestItSupportApi("/api/it-support/tickets"); } catch { return null; }
}

export async function updateItTicketBackend({ ticketId, patch, actor = "it001" }) {
  try {
    return await requestItSupportApi(`/api/it-support/tickets/${encodeURIComponent(ticketId)}`, {
      method: "PATCH",
      body: { ...patch, actor },
    });
  } catch {
    return null;
  }
}
