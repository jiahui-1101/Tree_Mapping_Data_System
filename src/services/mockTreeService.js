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

export function buildVisitorRoute(preferences, trees = TREES) {
  if (!preferences?.length) {
    return { ok: false, message: "Please select at least one plant interest." };
  }
  const preferredZones = new Set();
  preferences.forEach((preference) => {
    if (preference === "rare" || preference === "Rare Flowers") preferredZones.add("Pemuliharaan");
    if (preference === "ancient" || preference === "Ancient Trees") preferredZones.add("Arboretum");
    if (preference === "medicinal" || preference === "Medicinal Plants") preferredZones.add("Tanaman");
    if (preference === "butterfly" || preference === "Butterfly Zone") preferredZones.add("Tapak Semaian");
    if (preference === "shaded" || preference === "Shaded Paths") preferredZones.add("Riparian");
  });
  const candidateStops = trees.filter((tree) => preferredZones.has(tree.zone) && !tree.rare).slice(0, 5);
  const route = candidateStops.length ? candidateStops : trees.filter((tree) => !tree.rare).slice(0, 4);
  const waypoints = buildRouteWaypoints(route);
  return {
    ok: true,
    route,
    stops: route,
    waypoints,
    selectedInterests: preferences,
    estimatedDuration: Math.max(30, route.length * 12),
    totalDistance: estimateRouteDistance(waypoints),
  };
}

export function buildRouteWaypoints(route) {
  if (!route?.length) return [];
  const entrance = { id: "start", label: "Garden entrance", x: 10, y: 50, type: "facility" };
  const stops = route.map((tree, index) => ({
    id: tree.id,
    label: tree.name,
    x: tree.x,
    y: tree.y,
    type: "tree",
    order: index + 1,
  }));
  return [entrance, ...stops];
}

export function estimateRouteDistance(waypoints = []) {
  if (waypoints.length < 2) return "0.0 km";
  const total = waypoints.slice(1).reduce((sum, point, index) => {
    const previous = waypoints[index];
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    return sum + Math.sqrt(dx * dx + dy * dy);
  }, 0);
  return `${Math.max(0.2, total / 42).toFixed(1)} km`;
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

