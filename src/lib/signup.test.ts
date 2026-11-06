import { expect, it } from "vitest";
import { signupSchema } from "./signup";
const valid = { full_name: " Zee ", email: "zee@example.com", phone: "08012345678", password: "abcdefgh", confirmation: "abcdefgh" };
it("accepts a private name and eleven-digit Nigerian phone", () => {
  expect(signupSchema.parse(valid).full_name).toBe("Zee");
  expect(signupSchema.safeParse({ ...valid, phone: "2348012345678" }).success).toBe(false);
});
it("requires at least eight password characters", () => {
  expect(signupSchema.safeParse({ ...valid, password: "abcdefg", confirmation: "abcdefg" }).success).toBe(false);
  expect(signupSchema.safeParse(valid).success).toBe(true);
});
it("requires matching confirmation", () => {
  expect(signupSchema.safeParse({ ...valid, confirmation: "different" }).success).toBe(false);
});