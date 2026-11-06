import { expect, it } from "vitest";
import { productSchema } from "./input-validation";
const product = { name: "Shawarma", description: "", price: 1000, old_price: null, stock: 1, category: "Shawarma", images: [], available: true, featured: false };
it("requires a numeric product price greater than zero", () => {
  expect(productSchema.safeParse(product).success).toBe(true);
  for (const price of [0, -1, "1000", NaN]) expect(productSchema.safeParse({ ...product, price }).success).toBe(false);
});