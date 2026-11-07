import { describe, expect, it } from "vitest";
import { isStrongPassword, validResetPassword } from "./password";

describe("strong passwords", () => {
  it("accepts the requested strong password", () => {
    expect(isStrongPassword("StrongPass123@")).toBe(true);
    expect(validResetPassword("StrongPass123@", "StrongPass123@")).toBe(true);
  });
  it("requires at least eight characters", () => {
    expect(isStrongPassword("Aa1@")).toBe(false);
    expect(isStrongPassword("Aa1@aaaa")).toBe(true);
  });
  it("requires an uppercase letter", () => {
    expect(isStrongPassword("strongpass123@")).toBe(false);
  });
  it("requires a lowercase letter", () => {
    expect(isStrongPassword("STRONGPASS123@")).toBe(false);
  });
  it("requires a number", () => {
    expect(isStrongPassword("StrongPass@")).toBe(false);
  });
  it("requires a symbol", () => {
    expect(isStrongPassword("StrongPass123")).toBe(false);
  });
  it("requires matching confirmation", () => {
    expect(validResetPassword("StrongPass123@", "DifferentPass123@")).toBe(false);
  });
});
