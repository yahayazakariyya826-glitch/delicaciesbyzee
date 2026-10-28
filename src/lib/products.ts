import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Product = Database["public"]["Tables"]["products"]["Row"];

export function useProducts(includeUnavailable = false) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      let q = supabase.from("products").select("*").order("created_at");
      if (!includeUnavailable) q = q.eq("available", true);
      const { data } = await q;
      if (alive) {
        setProducts(data ?? []);
        setLoading(false);
      }
    };
    load();
    const ch = supabase
      .channel(`products-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, load)
      .subscribe();
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [includeUnavailable]);

  return { products, loading };
}
