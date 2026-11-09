import { expect, it } from "vitest";
import { isAppleMobile, shouldOfferInstall, INSTALL_DISMISS_MS } from "./install-prompt";

it("offers installation to phone browser visitors", () => {
  expect(shouldOfferInstall({ mobile: true, standalone: false, dismissedAt: 0, now: 1000 })).toBe(true);
  expect(shouldOfferInstall({ mobile: false, standalone: false, dismissedAt: 0, now: 1000 })).toBe(false);
});
it("does not offer installation when launched as an installed app", () => {
  expect(shouldOfferInstall({ mobile: true, standalone: true, dismissedAt: 0, now: 1000 })).toBe(false);
});
it("honors dismissal for one day", () => {
  expect(shouldOfferInstall({ mobile: true, standalone: false, dismissedAt: 1000, now: 1001 })).toBe(false);
  expect(shouldOfferInstall({ mobile: true, standalone: false, dismissedAt: 1000, now: 1000 + INSTALL_DISMISS_MS })).toBe(true);
});
it("recognizes iPhone and touch-enabled iPad browsers", () => {
  expect(isAppleMobile("iPhone", "iPhone", 1)).toBe(true);
  expect(isAppleMobile("Macintosh", "MacIntel", 5)).toBe(true);
  expect(isAppleMobile("Android", "Linux", 5)).toBe(false);
});