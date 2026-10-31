import type { Json } from "@/integrations/supabase/types";
import type { AuthChangeEvent } from "@supabase/supabase-js";

export function shouldRecordSignIn(event: AuthChangeEvent, hasSession: boolean) {
  return hasSession && (event === "SIGNED_IN" || event === "INITIAL_SESSION");
}

export function changedFields(before: Json | null, after: Json | null) {
  const old = before && typeof before === "object" && !Array.isArray(before) ? before : {};
  const next = after && typeof after === "object" && !Array.isArray(after) ? after : {};
  return [...new Set([...Object.keys(old), ...Object.keys(next)])]
    .filter((key) => JSON.stringify(old[key]) !== JSON.stringify(next[key]))
    .map((key) => ({ key, before: old[key], after: next[key] }));
}

export function auditValue(value: Json | undefined) {
  if (value == null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}