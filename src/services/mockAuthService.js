import { DEFAULT_PAGE, NAVIGATION } from "../config/navigation.js";
import { DEMO_USERS } from "../config/demoUsers.js";
import { ROLE } from "../models.js";

export function authenticate(role, id, password) {
  const user = DEMO_USERS[role];
  if (!user || user.id.toLowerCase() !== id.trim().toLowerCase() || user.password !== password) {
    return { ok: false, message: "Invalid credentials. Please try again." };
  }
  return { ok: true, user: { ...user, role }, defaultPage: DEFAULT_PAGE[role] };
}

export function createGuestVisitor() {
  return { ...DEMO_USERS[ROLE.VISITOR], role: ROLE.VISITOR, guest: true };
}

export function canAccessPage(role, page) {
  return NAVIGATION[role].some((section) => section.items.some((item) => item.id === page));
}