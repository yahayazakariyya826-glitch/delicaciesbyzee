import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Pencil, ShieldAlert } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/lib/auth";
import { useProducts, type Product } from "@/lib/products";
import { CATEGORIES, ORDER_STATUSES, naira, productImage } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type Admin = Database["public"]["Tables"]["admins"]["Row"];
type Chat = Database["public"]["Tables"]["chats"]["Row"];

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Delicacies by Zee" },
      { name: "description", content: "Manage orders, menu, admins and chats." },
      { property: "og:title", content: "Admin — Delicacies by Zee" },
      { property: "og:description", content: "Admin dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [me, setMe] = useState<Admin | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user?.email) {
      setMe(null);
      return;
    }
    supabase
      .from("admins")
      .select("*")
      .ilike("email", user.email)
      .maybeSingle()
      .then(({ data }) => setMe(data ?? null));
  }, [user, loading]);

  useEffect(() => {
    if (me === null) {
      const t = setTimeout(() => navigate({ to: "/login" }), 2500);
      return () => clearTimeout(t);
    }
    if (me) {
      supabase.rpc("admin_heartbeat");
      const t = setInterval(() => supabase.rpc("admin_heartbeat"), 60_000);
      return () => clearInterval(t);
    }
    return undefined;
  }, [me, navigate]);

  if (me === undefined) return <div className="min-h-screen" />;
  if (me === null)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only Delicacies by Zee admins can open this page. Redirecting to sign in…</p>
        <Link to="/login" className="text-primary underline">Sign in</Link>
      </div>
    );

  const isSuper = me.role === "Super Admin";
  return <Dashboard me={me} isSuper={isSuper} />;
}

type Section = "products" | "orders" | "customers" | "admins" | "chats" | "settings";

function Dashboard({ me, isSuper }: { me: Admin; isSuper: boolean }) {
  const [section, setSection] = useState<Section>(isSuper ? "products" : "orders");
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total,status"),
    ]).then(([p, o]) => {
      const rows = o.data ?? [];
      setStats({
        products: p.count ?? 0,
        orders: rows.length,
        revenue: rows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + (r.total ?? 0), 0),
      });
    });
  }, [section]);
  const items: { id: Section; label: string; show: boolean }[] = [
    { id: "products", label: "Products", show: isSuper },
    { id: "orders", label: "Orders", show: true },
    { id: "customers", label: "Customers", show: true },
    { id: "chats", label: "Chats", show: true },
    { id: "admins", label: "Admins", show: isSuper },
    { id: "settings", label: "Settings", show: isSuper },
  ];
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gold-gradient sm:text-3xl">
          Welcome {me.role} - {me.email}
        </h1>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Total Products", String(stats.products)],
            ["Total Orders", String(stats.orders)],
            ["Revenue", naira(stats.revenue)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-[200px_1fr]">
          <nav className="flex gap-1 overflow-x-auto md:flex-col">
            {items.filter((i) => i.show).map((i) => (
              <button
                key={i.id}
                onClick={() => setSection(i.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-sm font-medium ${section === i.id ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-accent"}`}
              >
                {i.label}
              </button>
            ))}
          </nav>
          <section>
            {section === "products" && isSuper && <ProductsTab />}
            {section === "orders" && <OrdersTab />}
            {section === "customers" && <CustomersTab />}
            {section === "chats" && <ChatsTab />}
            {section === "admins" && isSuper && <AdminsTab me={me} />}
            {section === "settings" && isSuper && <SettingsTab />}
          </section>
        </div>
      </main>
      <SiteFooter showBanner={false} />
    </div>
  );
}

function CustomersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
  }, []);
  const customers = useMemo(() => {
    const m = new Map<string, { name: string; phone: string; email: string | null; orders: number; spent: number }>();
    orders.forEach((o) => {
      const c = m.get(o.customer_phone) ?? { name: o.customer_name, phone: o.customer_phone, email: o.customer_email, orders: 0, spent: 0 };
      c.orders++;
      c.spent += o.total;
      m.set(o.customer_phone, c);
    });
    return [...m.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);
  if (!customers.length) return <p className="py-10 text-center text-muted-foreground">No customers yet.</p>;
  return (
    <div className="space-y-2">
      {customers.map((c) => (
        <div key={c.phone} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
          <div>
            <p className="font-medium">{c.name}</p>
            <p className="text-xs text-muted-foreground">{c.phone}{c.email ? ` · ${c.email}` : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-primary">{naira(c.spent)}</p>
            <p className="text-xs text-muted-foreground">{c.orders} order{c.orders > 1 ? "s" : ""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<Order | null>(null);
  useEffect(() => {
    const load = () =>
      supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setOrders(data ?? []));
    load();
    const ch = supabase
      .channel(`orders-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  const update = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error("Update failed");
    else setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)));
  };
  if (!orders.length) return <p className="py-10 text-center text-muted-foreground">No orders yet.</p>;
  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const items = (o.items as { name: string; qty: number }[]) ?? [];
        return (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{o.customer_name} · <span className="text-primary">{naira(o.total)}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })}</p>
                <p className="mt-1 text-sm">{items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={o.status}
                  onChange={(e) => update(o.id, e.target.value)}
                  className="rounded-lg border border-input bg-background px-2 py-1.5 text-sm capitalize"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <Button size="sm" variant="outline" onClick={() => setView(o)}>Details</Button>
              </div>
            </div>
          </div>
        );
      })}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Customer details</DialogTitle></DialogHeader>
          {view && (
            <div className="space-y-1.5 text-sm">
              <p><b>Name:</b> {view.customer_name}</p>
              <p><b>Phone:</b> <a className="text-primary" href={`tel:${view.customer_phone}`}>{view.customer_phone}</a></p>
              <p><b>Email:</b> {view.customer_email || "—"}</p>
              <p><b>Address:</b> {view.address}</p>
              <p><b>Payment:</b> {view.payment_method}</p>
              <p><b>Delivery fee:</b> {naira(view.delivery_fee)}</p>
              {view.note && <p><b>Note:</b> {view.note}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const emptyProduct = { name: "", price: 0, description: "", image_url: "", category: "Shawarma", available: true };

function ProductsTab() {
  const { products } = useProducts(true);
  const [edit, setEdit] = useState<(typeof emptyProduct & { id?: string }) | null>(null);
  const [uploading, setUploading] = useState(false);

  const save = async () => {
    if (!edit) return;
    const row = { ...edit, price: Number(edit.price) || 0, image_url: edit.image_url || null };
    const { id, ...data } = row;
    const { error } = id ? await supabase.from("products").update(data).eq("id", id) : await supabase.from("products").insert(data);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEdit(null);
  };
  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
  };
  const upload = async (file: File) => {
    setUploading(true);
    const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (data?.signedUrl) setEdit((e) => (e ? { ...e, image_url: data.signedUrl } : e));
  };

  return (
    <div>
      <Button onClick={() => setEdit({ ...emptyProduct })}>+ Add product</Button>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <img src={productImage(p)} alt="" className="h-16 w-16 rounded-xl object-cover" width={64} height={64} loading="lazy" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-primary">{naira(p.price)}</p>
              <p className="text-xs text-muted-foreground">{p.category} · {p.available ? "Available" : "Hidden"}</p>
            </div>
            <div className="flex flex-col gap-1">
              <button aria-label="Edit" onClick={() => setEdit({ id: p.id, name: p.name, price: p.price, description: p.description ?? "", image_url: p.image_url ?? "", category: p.category, available: p.available })}><Pencil className="h-4 w-4" /></button>
              <button aria-label="Delete" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Price (₦)</Label><Input type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
              <div><Label>Description</Label><Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <div>
                <Label>Category</Label>
                <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                <Input placeholder="…or paste image URL" value={edit.image_url} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} />
                {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
              </div>
              <div className="flex items-center justify-between"><Label>Available</Label><Switch checked={edit.available} onCheckedChange={(v) => setEdit({ ...edit, available: v })} /></div>
              <Button className="w-full" onClick={save} disabled={!edit.name || uploading}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminsTab({ me }: { me: Admin }) {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Staff");
  const load = () => supabase.from("admins").select("*").order("created_at").then(({ data }) => setAdmins(data ?? []));
  useEffect(() => {
    load();
  }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("admins").insert({ email: email.trim().toLowerCase(), role, created_by: me.email });
    if (error) { toast.error(error.message); return; }
    toast.success("Admin added — they can sign in with an email code.");
    setEmail("");
    load();
  };
  const remove = async (a: Admin) => {
    if (!confirm(`Remove ${a.email}?`)) return;
    const { error } = await supabase.from("admins").delete().eq("id", a.id);
    if (error) toast.error(error.message);
    load();
  };
  return (
    <div className="space-y-5">
      <form onSubmit={add} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4 sm:flex-row">
        <Input type="email" required placeholder="new.admin@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option>Staff</option>
          <option>Super Admin</option>
        </select>
        <Button type="submit">Add admin</Button>
      </form>
      <div className="space-y-2">
        {admins.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
            <div>
              <p className="font-medium">{a.email}</p>
              <p className="text-xs text-muted-foreground">{a.role}</p>
            </div>
            {a.email.toLowerCase() !== me.email.toLowerCase() && (
              <button aria-label="Remove" onClick={() => remove(a)}><Trash2 className="h-4 w-4 text-destructive" /></button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatsTab() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    supabase.from("chats").select("*").order("created_at").then(({ data }) => setChats(data ?? []));
    const ch = supabase
      .channel(`admin-chats-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, (p) =>
        setChats((c) => (c.some((x) => x.id === (p.new as Chat).id) ? c : [...c, p.new as Chat])),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const threads = useMemo(() => {
    const m = new Map<string, { email: string; name: string; unread: number; last: string }>();
    chats.forEach((c) => {
      const t = m.get(c.customer_email) ?? { email: c.customer_email, name: c.customer_name ?? c.customer_email, unread: 0, last: c.created_at };
      if (!c.is_admin && !c.read) t.unread++;
      t.last = c.created_at;
      m.set(c.customer_email, t);
    });
    return [...m.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [chats]);

  const open = async (email: string) => {
    setActive(email);
    await supabase.from("chats").update({ read: true }).eq("customer_email", email).eq("is_admin", false);
    setChats((c) => c.map((x) => (x.customer_email === email && !x.is_admin ? { ...x, read: true } : x)));
  };
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active || !reply.trim()) return;
    const { error } = await supabase.from("chats").insert({ customer_email: active, message: reply.trim(), is_admin: true, customer_name: "Zee" });
    if (error) toast.error(error.message);
    setReply("");
  };

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0);
  return (
    <div className="grid gap-3 md:grid-cols-[260px_1fr]">
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">{totalUnread} unread</p>
        {threads.length === 0 && <p className="text-sm text-muted-foreground">No chats yet.</p>}
        {threads.map((t) => (
          <button key={t.email} onClick={() => open(t.email)} className={`flex w-full items-center justify-between rounded-xl border p-3 text-left text-sm ${active === t.email ? "border-primary bg-accent" : "border-border bg-card"}`}>
            <span className="truncate">{t.email}</span>
            {t.unread > 0 && <span className="rounded-full bg-primary px-2 text-xs font-bold text-primary-foreground">{t.unread}</span>}
          </button>
        ))}
      </div>
      <div className="flex h-[60vh] flex-col rounded-2xl border border-border bg-card">
        {!active ? (
          <p className="m-auto text-sm text-muted-foreground">Select a conversation</p>
        ) : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {chats.filter((c) => c.customer_email === active).map((c) => (
                <div key={c.id} className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${c.is_admin ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"}`}>{c.message}</div>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
              <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply…" />
              <Button type="submit">Send</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [vals, setVals] = useState<Record<string, string>>({});
  useEffect(() => {
    supabase.from("settings").select("*").then(({ data }) => setVals(Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]))));
  }, []);
  const save = async () => {
    const rows = Object.entries(vals).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from("settings").upsert(rows);
    if (error) toast.error(error.message);
    else toast.success("Settings saved");
  };
  return (
    <div className="max-w-lg space-y-4">
      <div><Label>"Powered by Cyber Scorer" link</Label><Input value={vals["powered_by_url"] ?? ""} onChange={(e) => setVals({ ...vals, powered_by_url: e.target.value })} /></div>
      <div><Label>Bank transfer details</Label><Textarea value={vals["bank_details"] ?? ""} onChange={(e) => setVals({ ...vals, bank_details: e.target.value })} /></div>
      <Button onClick={save}>Save settings</Button>
    </div>
  );
}
