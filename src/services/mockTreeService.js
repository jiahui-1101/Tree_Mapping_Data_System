import { ROLE } from "../models.js";

export function maskTreeForRole(tree, role) {
  if (!tree) return tree;
  if (!tree.rare || role === ROLE.ADMIN || role === ROLE.IT_SUPPORT) return tree;
  return {
    ...tree,
    x: null,
    y: null,
    coordinateLabel: "Protected location - exact coordinates hidden",
  };
}

export function filterAuditLogs(logs, type = "all", severity = "all") {
  return logs.filter((log) => {
    if (type !== "all" && log.type !== type) return false;
    if (severity !== "all" && log.severity !== severity) return false;
    return true;
  });
}

