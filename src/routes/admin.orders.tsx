import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { naira } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { adminHead } from "@/components/admin/AdminContext";

type Order = Database["public"]["Tables"]["orders"]["Row"];

export const Route = createFileRoute("/admin/orders")({
  head: () => adminHead("Orders"),
  component: OrdersPage,
});

function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<Order | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const load = () => supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
  useEffect(() => { load(); }, []);

  const open = async (o: Order) => {
    setView(o);
    setProof(null);
    if (o.proof_path) {
      const { data } = await supabase.storage.from("proofs").createSignedUrl(o.proof_path, 600);
      setProof(data?.signedUrl ?? null);
    }
  };
  const update = async (id: string, patch: Partial<Order>) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Updated");
    setView((v) => (v && v.id === id ? { ...v, ...patch } : v));
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setView(null);
    load();
  };

  const shown = orders.filter((o) => {
    const s = q.toLowerCase();
    const matchQ = !s || o.customer_name.toLowerCase().includes(s) || o.customer_phone.includes(s);
    const matchF = filter === "all" || o.payment_status === filter || o.delivery_status === filter;
    return matchQ && matchF;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gold-gradient">Orders</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Search name or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Payment confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr>{["Order", "Customer", "Phone", "Total", "Payment", "Delivery", "Date"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map((o) => (
              <tr key={o.id} onClick={() => open(o)} className="cursor-pointer border-t border-border hover:bg-accent">
                <td className="p-3 font-mono text-xs">#{o.id.slice(0, 6)}</td>
                <td className="p-3">{o.customer_name}</td>
                <td className="p-3">{o.customer_phone}</td>
                <td className="p-3 text-primary">{naira(o.total)}</td>
                <td className="p-3 capitalize">{o.payment_status}</td>
                <td className="p-3 capitalize">{o.delivery_status}</td>
                <td className="p-3 text-xs">{new Date(o.created_at).toLocaleDateString("en-NG")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="p-6 text-center text-muted-foreground">No orders.</p>}
      </div>
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order #{view?.id.slice(0, 6)}</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-2 text-sm">
              {((view.items as { name: string; qty: number; price: number }[]) ?? []).map((i, n) => (
                <p key={n}>{i.qty}× {i.name} — {naira(i.price * i.qty)}</p>
              ))}
              <p><b>Total:</b> {naira(view.total)} (delivery {naira(view.delivery_fee)})</p>
              <p><b>Customer:</b> {view.customer_name} · {view.customer_phone}</p>
              <p><b>Address:</b> {view.address}</p>
              <p><b>Payment:</b> {view.payment_method} · <span className="capitalize">{view.payment_status}</span></p>
              {view.note && <p><b>Note:</b> {view.note}</p>}
              {proof ? <img src={proof} alt="Payment proof" className="max-h-72 rounded-xl" /> : <p className="text-muted-foreground">No payment proof uploaded.</p>}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button size="sm" onClick={() => update(view.id, { payment_status: "confirmed" })}>Confirm payment</Button>
                <Button size="sm" variant="outline" onClick={() => update(view.id, { delivery_status: "shipped" })}>Mark shipped</Button>
                <Button size="sm" variant="outline" onClick={() => update(view.id, { delivery_status: "delivered" })}>Mark delivered</Button>
                <Button size="sm" variant="destructive" onClick={() => remove(view.id)}>Delete</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
