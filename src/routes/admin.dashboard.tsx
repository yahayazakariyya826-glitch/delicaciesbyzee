import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { naira } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { adminHead } from "@/components/admin/AdminContext";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Product = Database["public"]["Tables"]["products"]["Row"];
export const LOW_STOCK = 5;

export const Route = createFileRoute("/admin/dashboard")({
  head: () => adminHead("Overview"),
  component: Overview,
});

function Overview() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
    supabase.from("products").select("*").then(({ data }) => setProducts(data ?? []));
  }, []);
  const revenue = orders.filter((o) => o.payment_status === "confirmed").reduce((s, o) => s + o.total, 0);
  const pending = orders.filter((o) => o.delivery_status !== "delivered").length;
  const low = products.filter((p) => p.stock <= LOW_STOCK);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gold-gradient">Overview</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Total orders", String(orders.length)],
          ["Revenue (paid)", naira(revenue)],
          ["Products", String(products.length)],
          ["Pending orders", String(pending)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm text-primary underline">All orders</Link>
          </div>
          {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex justify-between border-t border-border py-2 text-sm">
              <span>{o.customer_name}<span className="block text-xs capitalize text-muted-foreground">{o.payment_status} · {o.delivery_status}</span></span>
              <span className="text-primary">{naira(o.total)}</span>
            </div>
          ))}
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-primary" /> Low stock (≤ {LOW_STOCK})</h2>
          {low.length === 0 && <p className="text-sm text-muted-foreground">All products well stocked.</p>}
          {low.map((p) => (
            <div key={p.id} className="flex justify-between border-t border-border py-2 text-sm">
              <span>{p.name}</span>
              <span className={p.stock === 0 ? "text-destructive" : "text-primary"}>{p.stock} left</span>
            </div>
          ))}
        </section>
      </div>
      <PasswordCard />
    </div>
  );
}

function PasswordCard() {
  const [pw, setPw] = useState("");
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Use at least 8 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message);
    else { toast.success("Password saved — you can now sign in with it."); setPw(""); }
  };
  return (
    <form onSubmit={save} className="flex max-w-lg flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <p className="text-sm font-medium sm:w-40">Set my password</p>
      <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password" />
      <Button type="submit">Save</Button>
    </form>
  );
}
