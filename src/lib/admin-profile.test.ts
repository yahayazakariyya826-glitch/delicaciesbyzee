import { expect, it } from "vitest";
import { emailChangeError, passwordChangeError } from "./admin-profile";

it("requires the current password for a signed-in password change", () => {
  expect(passwordChangeError("", "new-password", "new-password")).toBe("Enter your current password.");
  expect(passwordChangeError("old-password", "new-password", "new-password")).toBeNull();
});
it("requires matching new passwords of at least eight characters", () => {
  expect(passwordChangeError("old-password", "1234567", "1234567")).not.toBeNull();
  expect(passwordChangeError("old-password", "12345678", "12345678")).toBeNull();
  expect(passwordChangeError("old-password", "12345678", "different")).not.toBeNull();
});
it("rejects reusing the current password", () => {
  expect(passwordChangeError("same-password", "same-password", "same-password")).not.toBeNull();
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