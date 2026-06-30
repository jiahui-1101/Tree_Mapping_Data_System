const API_BASE = import.meta.env.VITE_SS4_API_BASE || import.meta.env.VITE_SS3_API_BASE || "http://localhost:4174";

async function requestSs4Api(path, { method = "GET", body } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.message || payload.error || "SS4 backend request failed");
  }
  return payload;
}

export async function fetchSs4MapBackend({ role } = {}) {
  try {
    const params = new URLSearchParams(role ? { role } : {});
    return await requestSs4Api(`/api/ss4/map${params.toString() ? `?${params}` : ""}`);
  } catch {
    return null;
  }
}

export async function fetchSs4AuditLogsBackend() {
  try {
    return await requestSs4Api("/api/ss4/audit-logs");
  } catch {
    return null;
  }
}

export async function fetchSs4SecurityAlertsBackend() {
  try {
    return await requestSs4Api("/api/ss4/security-alerts");
  } catch {
    return null;
  }
}

export async function fetchSs4SpatialPlansBackend() {
  try {
    return await requestSs4Api("/api/ss4/spatial/plans");
  } catch {
    return null;
  }
}

export async function simulateSs4SpatialPlanBackend({ point, species, targetZone, createdBy }) {
  try {
    return await requestSs4Api("/api/ss4/spatial/simulate", {
      method: "POST",
      body: { point, species, targetZone, createdBy },
    });
  } catch {
    return null;
  }
}

export async function confirmSs4SpatialPlanBackend({ point, species, targetZone, createdBy, decision = "confirmed" }) {
  try {
    return await requestSs4Api("/api/ss4/spatial/confirm", {
      method: "POST",
      body: { point, species, targetZone, createdBy, decision },
    });
  } catch {
    return null;
  }
}

export async function recordSs4QrScanBackend({ rawId, qrId, treeId, actorId, role }) {
  try {
    return await requestSs4Api("/api/ss4/qr-scans", {
      method: "POST",
      body: { rawId, qrId, treeId, actorId, role },
    });
  } catch {
    return null;
  }
}
