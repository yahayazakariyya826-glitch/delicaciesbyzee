import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { naira } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Admin = Database["public"]["Tables"]["admins"]["Row"];
type Chat = Database["public"]["Tables"]["chats"]["Row"];
type Order = Database["public"]["Tables"]["orders"]["Row"];

export function CustomersTab() {
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

export function AdminsTab({ me }: { me: Admin }) {
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

export function ChatsTab() {
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

