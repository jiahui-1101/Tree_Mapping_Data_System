import { ROLE } from "../models.js";

export const DEMO_USERS = {
  [ROLE.ADMIN]: {
    id: "admin001",
    password: "admin123",
    name: "Dr. Lim Hui Shan",
    title: "Admin - Office Staff",
    initials: "LH",
  },
  [ROLE.RANGER]: {
    id: "RGR001",
    password: "ranger123",
    name: "Ahmad Razif",
    title: "Field Ranger",
    initials: "AR",
  },
  [ROLE.VISITOR]: {
    id: "visitor@gmail.com",
    password: "visitor123",
    name: "Visitor",
    title: "Taman Botani Johor",
    initials: "V",
  },
  [ROLE.IT_SUPPORT]: {
    id: "it001",
    password: "support123",
    name: "Nur Izzati",
    title: "IT Support",
    initials: "NI",
  },
};

export const ROLE_OPTIONS = [
  { id: ROLE.ADMIN, label: "Admin", icon: "A" },
  { id: ROLE.RANGER, label: "Ranger", icon: "R" },
  { id: ROLE.VISITOR, label: "Visitor", icon: "V" },
  { id: ROLE.IT_SUPPORT, label: "IT Support", icon: "IT" },
];
