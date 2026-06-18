import { ROLE } from "../models.js";

export const NAVIGATION = {
  [ROLE.ADMIN]: [
    {
      label: "Overview",
      items: [{ id: "dashboard", icon: "chart", label: "Dashboard" }],
    },
    {
      label: "SS1 - Tree Health",
      items: [
        { id: "inventory", icon: "tree", label: "Tree Inventory" },
        { id: "maintenance", icon: "spark", label: "Predictive Maint." },
      ],
    },
    {
      label: "SS2 - Scheduling",
      items: [
        { id: "schedule", icon: "calendar", label: "Workforce Schedule" },
        { id: "rangers", icon: "people", label: "Ranger Management" },
        { id: "tasks", icon: "check", label: "Task Tracker" },
      ],
    },
    {
      label: "SS4 - Map & QR",
      items: [
        { id: "map", icon: "map", label: "Garden Map" },
        { id: "spatial", icon: "target", label: "Spatial Planning" },
        { id: "audit", icon: "lock", label: "Audit Log" },
      ],
    },
  ],
  [ROLE.RANGER]: [
    {
      label: "Field Operations",
      items: [
        { id: "ranger-tasks", icon: "check", label: "My Tasks" },
        { id: "qr", icon: "scan", label: "QR Tree Scan" },
        { id: "ranger-reports", icon: "chart", label: "My Reports" },
        { id: "map", icon: "map", label: "Garden Map" },
      ],
    },
  ],
  [ROLE.VISITOR]: [
    {
      label: "Visitor Portal",
      items: [
        { id: "explore", icon: "route", label: "Explore & Route" },
        { id: "qr", icon: "scan", label: "Scan QR Trees" },
        { id: "profiles", icon: "leaf", label: "Tree Profiles" },
        { id: "chat", icon: "chat", label: "Ask AI" },
        { id: "collection", icon: "badge", label: "My Collection" },
      ],
    },
  ],
  [ROLE.IT_SUPPORT]: [
    {
      label: "IT Operations",
      items: [
        { id: "it-dashboard", icon: "chart", label: "IT Dashboard" },
        { id: "it-monitoring", icon: "spark", label: "System Monitoring" },
        { id: "it-users", icon: "people", label: "User & Access Control" },
        { id: "it-tickets", icon: "check", label: "Incident Tickets" },
        { id: "audit", icon: "lock", label: "Audit Log" },
        { id: "map", icon: "map", label: "Protected Map View" },
      ],
    },
  ],
};

export const DEFAULT_PAGE = {
  [ROLE.ADMIN]: "dashboard",
  [ROLE.RANGER]: "ranger-tasks",
  [ROLE.VISITOR]: "explore",
  [ROLE.IT_SUPPORT]: "it-dashboard",
};