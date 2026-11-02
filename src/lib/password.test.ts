import { expect, it } from "vitest";
import { validResetPassword } from "./password";
it("requires a matching password of at least eight characters", () => {
  expect(validResetPassword("abcdefgh", "abcdefgh")).toBe(true);
  expect(validResetPassword("abcdefg", "abcdefg")).toBe(false);
  expect(validResetPassword("abcdefgh", "different")).toBe(false);
});