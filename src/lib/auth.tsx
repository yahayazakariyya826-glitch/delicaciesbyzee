import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, loading };
}

export function useSetting(key: string, fallback: string) {
  const [value, setValue] = useState(fallback);
  useEffect(() => {
    supabase
      .from("public_payment_info")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        const v = (data as Record<string, unknown> | null)?.[key];
        if (typeof v === "string" && v) setValue(v);
      });
  }, [key]);
  return value;
}
