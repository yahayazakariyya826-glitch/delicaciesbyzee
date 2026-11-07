import { expect, it } from "vitest";
import { emailChangeError, passwordChangeError } from "./admin-profile";

it("requires the current password for a signed-in password change", () => {
  expect(passwordChangeError("", "NewPass123@", "NewPass123@")).toBe("Enter your current password.");
  expect(passwordChangeError("old-password", "NewPass123@", "NewPass123@")).toBeNull();
});
it("requires matching strong new passwords", () => {
  expect(passwordChangeError("old-password", "1234567", "1234567")).not.toBeNull();
  expect(passwordChangeError("old-password", "12345678", "12345678")).not.toBeNull();
  expect(passwordChangeError("old-password", "NewPass123@", "NewPass123@")).toBeNull();
  expect(passwordChangeError("old-password", "NewPass123@", "DifferentPass123@")).not.toBeNull();
});
it("rejects reusing the current password", () => {
  expect(passwordChangeError("SamePass1@", "SamePass1@", "SamePass1@")).not.toBeNull();
});
it("requires the current password for email changes", () => {
  expect(emailChangeError("admin@example.com", "new@example.com", "")).not.toBeNull();
  expect(emailChangeError("admin@example.com", "new@example.com", "current-password")).toBeNull();
});
it("requires a valid different email ignoring case and surrounding spaces", () => {
  expect(emailChangeError("admin@example.com", " ADMIN@example.com ", "password")).not.toBeNull();
  expect(emailChangeError("admin@example.com", "invalid", "password")).not.toBeNull();
  expect(emailChangeError("admin@example.com", " NEW@example.com ", "password")).toBeNull();
});
