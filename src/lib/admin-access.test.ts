import { describe, expect, it } from "vitest";
import { clearAdminSession, isSuperAdminMembership } from "./admin-access";

describe("super-admin access", () => {
  it("accepts the requested super_admin role", () => {
    expect(isSuperAdminMembership({ role: "super_admin" })).toBe(true);
  });
  it("rejects other roles", () => {
    expect(isSuperAdminMembership({ role: "staff" })).toBe(false);
  });
  it("rejects missing membership", () => {
    expect(isSuperAdminMembership(null)).toBe(false);
  });
  it("clears protected requests and data before signing out", async () => {
    const events: string[] = [];
    await clearAdminSession({
      cancelQueries: async () => { events.push("cancel"); },
      clear: () => { events.push("clear"); },
    }, async () => { events.push("signOut"); return { error: null }; });
    expect(events).toEqual(["cancel", "clear", "signOut"]);
  });
  it("reports sign-out failures instead of pretending to sign out", async () => {
    await expect(clearAdminSession({ cancelQueries: async () => {}, clear: () => {} },
      async () => ({ error: { message: "Unable to sign out" } }),
    )).rejects.toThrow("Unable to sign out");
  });
});