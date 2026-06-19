import { ACCESS_USERS, SERVICE_LOGS } from "../data/itSupport.js";

export function filterAccessUsers(users = ACCESS_USERS, { query = "", role = "all", status = "all", session = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return users.filter((user) => {
    if (role !== "all" && user.role !== role) return false;
    if (status !== "all" && user.status !== status) return false;
    const sessionText = user.session.toLowerCase();
    if (session === "active" && (!sessionText.includes("active") || sessionText.includes("invalidated"))) return false;
    if (session === "none" && !sessionText.includes("no active")) return false;
    if (session === "invalidated" && !sessionText.includes("invalidated")) return false;
    if (session === "locked" && user.status !== "locked" && !sessionText.includes("locked")) return false;
    if (!needle) return true;
    return `${user.id} ${user.name} ${user.role} ${user.status} ${user.session} ${user.lastLogin}`.toLowerCase().includes(needle);
  });
}

export function getServiceLogs(serviceId, logs = SERVICE_LOGS) {
  return logs.filter((log) => log.serviceId === serviceId);
}

export function filterServiceLogs(logs, level = "all") {
  return logs.filter((log) => level === "all" || log.level === level);
}

