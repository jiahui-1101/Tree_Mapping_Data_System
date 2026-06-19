import test from "node:test";
import assert from "node:assert/strict";
import { DEMO_USERS, ROLE_OPTIONS } from "../src/config/demoUsers.js";
import { DEFAULT_PAGE, MOBILE_PAGES, NAVIGATION } from "../src/config/navigation.js";
import { authenticate, canAccessPage, createGuestVisitor } from "../src/services/mockAuthService.js";
import { ROLE } from "../src/models.js";

test("every configured role has a working demo login", () => {
  for (const option of ROLE_OPTIONS) {
    const demo = DEMO_USERS[option.id];
    const result = authenticate(option.id, demo.id, demo.password);
    assert.equal(result.ok, true);
    assert.equal(result.defaultPage, DEFAULT_PAGE[option.id]);
  }
});

test("every role can access its configured default page", () => {
  for (const role of Object.values(ROLE)) {
    assert.ok(NAVIGATION[role]?.length > 0);
    assert.equal(canAccessPage(role, DEFAULT_PAGE[role]), true);
    assert.ok(MOBILE_PAGES[role]?.length > 0);
  }
});

test("invalid credentials are rejected", () => {
  const result = authenticate(ROLE.ADMIN, "admin001", "wrong-password");
  assert.equal(result.ok, false);
});

test("guest visitor uses the visitor role", () => {
  const guest = createGuestVisitor();
  assert.equal(guest.role, ROLE.VISITOR);
  assert.equal(guest.guest, true);
});
