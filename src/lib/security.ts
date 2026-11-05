export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
export function isAdminIdle(lastActivity: number, now: number) {
  return now - lastActivity >= ADMIN_IDLE_TIMEOUT_MS;
}

export function secureResponse(response: Response, request: Request) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // Allow the editor preview to embed the app; disallow framing elsewhere.
  headers.set("Content-Security-Policy", "object-src 'none'; base-uri 'self'; frame-ancestors 'self' https://*.lovable.dev https://*.lovable.app https://*.lovableproject.com");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000");
  if (/^\/admin(?:\/|$)/.test(new URL(request.url).pathname)) headers.set("Cache-Control", "no-store");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}