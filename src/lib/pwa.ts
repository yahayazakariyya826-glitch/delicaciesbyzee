// Single registration point for the offline service worker.
// Never registers in dev, iframes, or Lovable preview hosts.
function isBlockedHost(host: string) {
  const first = host.split(".")[0];
  if (/(\.lovable\.app|\.gpt-eng\.com|\.gptengineer\.run)$/.test(host)) {
    if (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(first)) return true;
    if (/^project--.+-dev$/.test(first)) return true;
  }
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  return false;
}

async function unregisterAppSW() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs.filter((r) => r.active?.scriptURL.endsWith("/sw.js")).map((r) => r.unregister()),
  );
}

export async function registerPWA() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const host = window.location.hostname.toLowerCase();
  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }
  const off = new URLSearchParams(window.location.search).get("sw") === "off";
  if (!import.meta.env.PROD || inIframe || off || isBlockedHost(host)) {
    await unregisterAppSW();
    return;
  }
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}
