import { describe, expect, it } from "vitest";
import { deliveryFee, isOpenNow } from "./brand";

describe("opening hours (2PM–7PM Lagos)", () => {
  it("is open at 3PM Lagos (14:00 UTC)", () => {
    expect(isOpenNow(new Date("2026-10-28T14:00:00Z"))).toBe(true);
  });
  it("is closed at 1:30PM Lagos", () => {
    expect(isOpenNow(new Date("2026-10-28T12:30:00Z"))).toBe(false);
  });
  it("is closed at 7PM Lagos", () => {
    expect(isOpenNow(new Date("2026-10-28T18:00:00Z"))).toBe(false);
  });
});

describe("delivery fee", () => {
  it("charges 1000 in Bukuru", () => expect(deliveryFee("New Layout, Bukuru")).toBe(1000));
  it("charges 1500 elsewhere in Jos", () => expect(deliveryFee("Rayfield, Jos")).toBe(1500));
});
