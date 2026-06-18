import { TREES } from "../data/trees.js";
import { MAP_ZONES } from "../data/gardenMap.js";
import { ROLE } from "../models.js";

export function filterTrees({ trees = TREES, query = "", zone = "all", status = "all" } = {}) {
  const needle = query.trim().toLowerCase();
  return trees.filter((tree) => {
    if (zone !== "all" && tree.zone !== zone) return false;
    if (status !== "all" && tree.status !== status) return false;
    return !needle || `${tree.id} ${tree.name} ${tree.scientificName}`.toLowerCase().includes(needle);
  });
}

export function findTree(id, trees = TREES) {
  return trees.find((tree) => tree.id.toLowerCase() === id.trim().toLowerCase());
}

export function maskTreeForRole(tree, role) {
  if (!tree) return tree;
  if (role === ROLE.VISITOR) {
    const { health, status, ...publicTree } = tree;
    if (!tree.rare) return publicTree;
    return {
      ...publicTree,
      x: null,
      y: null,
      coordinateLabel: "Protected location - exact coordinates hidden",
    };
  }
  if (!tree.rare || role === ROLE.ADMIN || role === ROLE.IT_SUPPORT) return tree;
  return {
    ...tree,
    x: null,
    y: null,
    coordinateLabel: "Protected location - exact coordinates hidden",
  };
}

export function getZoneById(id) {
  return MAP_ZONES.find((zone) => zone.id === id);
}

export function filterAuditLogs(logs, type = "all", severity = "all") {
  return logs.filter((log) => {
    if (type !== "all" && log.type !== type) return false;
    return severity === "all" || log.severity === severity;
  });
}