import { describe, expect, it } from "vitest";
import { changedFields, shouldRecordSignIn } from "./audit";

describe("Admin audit records", () => {
  it("records successful sign-ins and existing sessions, not refreshes or sign-outs", () => {
    expect(shouldRecordSignIn("SIGNED_IN", true)).toBe(true);
    expect(shouldRecordSignIn("INITIAL_SESSION", true)).toBe(true);
    expect(shouldRecordSignIn("TOKEN_REFRESHED", true)).toBe(false);
    expect(shouldRecordSignIn("SIGNED_OUT", false)).toBe(false);
    expect(shouldRecordSignIn("SIGNED_IN", false)).toBe(false);
  });
  it("shows product changes with original and new values", () => {
    expect(changedFields({ name: "Shawarma", price: 2500, stock: 8 }, { name: "Shawarma", price: 3000, stock: 8 }))
      .toEqual([{ key: "price", before: 2500, after: 3000 }]);
  });
  it("shows order payment and delivery changes", () => {
    expect(changedFields({ payment_status: "pending", delivery_status: "pending" }, { payment_status: "confirmed", delivery_status: "shipped" }))
      .toEqual([{ key: "payment_status", before: "pending", after: "confirmed" }, { key: "delivery_status", before: "pending", after: "shipped" }]);
  });
});