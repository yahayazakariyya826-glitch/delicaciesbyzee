export const INSTALL_DISMISS_MS = 24 * 60 * 60 * 1000;

export function shouldOfferInstall({ mobile, standalone, dismissedAt, now }: { mobile: boolean; standalone: boolean; dismissedAt: number; now: number }) {
  return mobile && !standalone && (!dismissedAt || now - dismissedAt >= INSTALL_DISMISS_MS);
}

export function isAppleMobile(userAgent: string, platform: string, touchPoints: number) {
  return /iPhone|iPad|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1);
}