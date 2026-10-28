import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Send, X, Plus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askZee } from "@/lib/ai.functions";
import { useProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { useUser } from "@/lib/auth";
import { isOpenNow, naira } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };
const GREETING = "Sannu! Ni ne Zee Assistant, powered by Meta AI. Me kike so ki ci yau? 😊";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"ai" | "live">("ai");
  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 animate-gold-pulse rounded-full bg-gold-gradient px-5 py-3 font-semibold text-primary-foreground shadow-gold"
        >
          Chat with Zee 💬
        </button>
      )}
      {open && (
        <div className="fixed inset-x-2 bottom-2 z-50 flex h-[78vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-gold sm:inset-x-auto sm:right-5 sm:w-[380px]">
          <div className="flex items-start justify-between bg-gold-gradient p-4 text-primary-foreground">
            <div>
              <p className="font-display text-lg font-bold">Zee Assistant</p>
              <p className="text-xs">Powered by Meta AI ✨ You're the best</p>
            </div>
            <button aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 border-b border-border text-sm">
            {(["ai", "live"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`py-2.5 font-medium ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}
              >
                {t === "ai" ? "Meta AI Assistant" : "Live Assistant"}
              </button>
            ))}
          </div>
          {tab === "ai" ? <AiChat /> : <LiveChat />}
        </div>
      )}
    </>
  );
}

function AiChat() {
  const [msgs, setMsgs] = useState<Msg[]>([{ role: "assistant", content: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const { products } = useProducts();
  const { add } = useCart();
  const ask = useServerFn(askZee);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    const next = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const { reply } = await ask({
        data: {
          messages: next.slice(-20),
          menu: products.map((p) => ({ id: p.id, name: p.name, price: p.price, category: p.category, description: p.description })),
          isOpen: isOpenNow(),
          lagosTime: new Date().toLocaleTimeString("en-NG", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" }),
        },
      });
      setMsgs((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Kai, network wahala 😅 Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {msgs.map((m, i) => {
          const ids = [...m.content.matchAll(/\[\[ADD:([\w-]+)\]\]/g)].map((x) => x[1]);
          const text = m.content.replace(/\[\[ADD:[\w-]+\]\]/g, "").trim();
          const recs = products.filter((p) => ids.includes(p.id));
          return (
            <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[90%]"}>
              <div
                className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {text}
              </div>
              {recs.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {recs.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        add(p);
                        toast.success(`${p.name} added to cart`);
                      }}
                      className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span>
                        {p.name} · <span className="text-primary">{naira(p.price)}</span>
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                        <Plus className="h-3 w-3" /> Add
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {busy && <div className="w-16 rounded-2xl bg-muted px-3 py-2 text-sm">…</div>}
        <div ref={end} />
      </div>
      <Composer value={input} onChange={setInput} onSend={send} disabled={busy} />
    </>
  );
}

type ChatRow = { id: string; message: string; is_admin: boolean; created_at: string };

function LiveChat() {
  const { user, loading } = useUser();
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [online, setOnline] = useState(false);
  const [input, setInput] = useState("");
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.rpc("any_admin_online").then(({ data }) => setOnline(!!data));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;
    supabase
      .from("chats")
      .select("id,message,is_admin,created_at")
      .eq("customer_email", email)
      .order("created_at")
      .then(({ data }) => setRows(data ?? []));
    const ch = supabase
      .channel(`chat-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chats" }, (p) => {
        const r = p.new as ChatRow & { customer_email: string };
        if (r.customer_email.toLowerCase() === email.toLowerCase())
          setRows((cur) => (cur.some((c) => c.id === r.id) ? cur : [...cur, r]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.email]);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [rows]);

  if (loading) return <div className="flex-1" />;
  if (!user)
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-sm">
        <p>Sign in with your email to chat live with the Zee team.</p>
        <Link to="/login" className="rounded-full bg-primary px-5 py-2 font-semibold text-primary-foreground">
          Sign in
        </Link>
      </div>
    );

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const { error } = await supabase.from("chats").insert({
      customer_email: user.email!,
      customer_name: user.email!.split("@")[0] ?? null,
      message: text,
    });
    if (error) toast.error("Message not sent");
  };

  return (
    <>
      <div className={`px-3 py-1.5 text-center text-xs ${online ? "text-success" : "text-muted-foreground"}`}>
        {online ? "● Admin is online" : "Leave message, we will reply on WhatsApp"}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              r.is_admin ? "bg-muted" : "ml-auto bg-primary text-primary-foreground"
            }`}
          >
            {r.message}
          </div>
        ))}
        <div ref={end} />
      </div>
      <Composer value={input} onChange={setInput} onSend={send} />
    </>
  );
}

function Composer({ value, onChange, onSend, disabled }: { value: string; onChange: (v: string) => void; onSend: () => void; disabled?: boolean }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="flex gap-2 border-t border-border p-3"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message…"
        className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
      />
      <button disabled={disabled} aria-label="Send" className="rounded-full bg-primary p-2.5 text-primary-foreground disabled:opacity-50">
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
