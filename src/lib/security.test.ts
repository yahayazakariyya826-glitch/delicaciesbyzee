import { describe, expect, it } from "vitest";
import { isAdminIdle, secureResponse } from "./security";
import { nameSchema, phoneSchema, productSchema, plainText, newPasswordSchema } from "./input-validation";

describe("security requirements", () => {
  it("expires at exactly thirty inactive minutes", () => {
    expect(isAdminIdle(1000, 1000 + 30 * 60 * 1000 - 1)).toBe(false);
    expect(isAdminIdle(1000, 1000 + 30 * 60 * 1000)).toBe(true);
  });
  it("caps names at 100 characters and trims text", () => {
    expect(nameSchema.parse(" Zee ")).toBe("Zee");
    expect(nameSchema.safeParse("a".repeat(100)).success).toBe(true);
    expect(nameSchema.safeParse("a".repeat(101)).success).toBe(false);
  });
  it("rejects HTML tags", () => { expect(plainText(100).safeParse("<script>x</script>").success).toBe(false); });
  it("validates Nigerian phone numbers", () => {
    expect(phoneSchema.parse("+234 813 999 1550")).toBe("+2348139991550");
    expect(phoneSchema.safeParse("12345").success).toBe(false);
  });
  it("requires a numeric product price greater than zero", () => {
    const product = { name: "Pizza", description: "", price: 1, old_price: null, stock: 1, category: "Pizza", images: [], available: true, featured: false };
    expect(productSchema.safeParse(product).success).toBe(true);
    for (const price of [0, -1, "10", NaN, Infinity]) expect(productSchema.safeParse({ ...product, price }).success).toBe(false);
  });
  it("requires strong new passwords", () => {
    expect(newPasswordSchema.safeParse("a".repeat(7)).success).toBe(false);
    expect(newPasswordSchema.safeParse("a".repeat(8)).success).toBe(false);
    expect(newPasswordSchema.safeParse("StrongPass123@").success).toBe(true);
  });
  it("adds response protections without blocking editor framing", () => {
    const response = secureResponse(new Response("OK"), new Request("https://delicaciesbyzee.lovable.app/admin"));
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Content-Security-Policy")).toContain("object-src 'none'");
    expect(response.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
  });
});