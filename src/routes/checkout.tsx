import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter, PoweredBy } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { useSetting, useUser } from "@/lib/auth";
import { BRAND, deliveryFee, naira } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Delicacies by Zee" },
      { name: "description", content: "Complete your Delicacies by Zee order with delivery across Jos and Bukuru." },
      { property: "og:title", content: "Checkout — Delicacies by Zee" },
      { property: "og:description", content: "Complete your order: pay on delivery, transfer or Paystack." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Checkout,
});

const PAYMENTS = ["Pay on Delivery", "Bank Transfer", "Paystack"] as const;

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { user } = useUser();
  const bank = useSetting("bank_details", "Bank details coming soon");
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", note: "" });
  const [pay, setPay] = useState<(typeof PAYMENTS)[number]>("Pay on Delivery");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (user?.email) setForm((f) => (f.email ? f : { ...f, email: user.email! }));
  }, [user?.email]);

  const fee = deliveryFee(form.address);
  const total = subtotal + fee;
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setBusy(true);
    const { error } = await supabase.from("orders").insert({
      customer_name: form.name,
      customer_phone: form.phone,
      customer_email: form.email || null,
      address: form.address,
      items: items,
      total,
      delivery_fee: fee,
      payment_method: pay,
      note: form.note || null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not place order. Please try again.");
      return;
    }
    const list = items.map((i) => `${i.qty}x ${i.name} (${naira(i.price * i.qty)})`).join(", ");
    const msg = `New Order Delicacies by Zee: ${list} Total: ${naira(total)} Name: ${form.name} Phone: ${form.phone} Address: ${form.address}${
      form.note ? ` Note: ${form.note}` : ""
    } Payment: ${pay}`;
    window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    clear();
    setDone(true);
  };

  if (done)
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-4 text-3xl font-bold text-gold-gradient">Order placed!</h1>
          <p className="mt-2 text-muted-foreground">Na gode! We've received your order and will confirm on WhatsApp shortly.</p>
          {pay === "Bank Transfer" && <p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm">{bank}</p>}
          <Button asChild className="mt-6">
            <Link to="/">Back to menu</Link>
          </Button>
          <p className="mt-10 text-sm">
            <PoweredBy />
          </p>
        </div>
        <SiteFooter showBanner={false} />
      </div>
    );

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-3xl font-bold text-gold-gradient">Checkout</h1>
        {!user && (
          <p className="mt-2 text-sm text-muted-foreground">
            Checking out as guest ·{" "}
            <Link to="/login" className="text-primary underline">
              Sign in instead
            </Link>
          </p>
        )}
        {items.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            Your cart is empty.{" "}
            <Link to="/" className="text-primary underline">
              Browse the menu
            </Link>
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-5">
            <div className="rounded-2xl border border-border bg-card p-4 text-sm">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between py-1">
                  <span>
                    {i.qty}× {i.name}
                  </span>
                  <span>{naira(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name"><Input required value={form.name} onChange={set("name")} /></Field>
              <Field label="Phone"><Input required type="tel" value={form.phone} onChange={set("phone")} placeholder="080..." /></Field>
            </div>
            <Field label="Email"><Input type="email" value={form.email} onChange={set("email")} /></Field>
            <Field label="Full delivery address (Bukuru / Jos)">
              <Textarea required value={form.address} onChange={set("address")} placeholder="House no, street, area, Bukuru/Jos" />
            </Field>
            <Field label="Note (optional)"><Textarea value={form.note} onChange={set("note")} placeholder="Extra pepper, no onions…" /></Field>
            <div>
              <Label>Payment</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {PAYMENTS.map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => setPay(p)}
                    className={`rounded-xl border px-2 py-3 text-xs font-medium sm:text-sm ${pay === p ? "border-primary bg-accent text-accent-foreground" : "border-border"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {pay === "Bank Transfer" && <p className="mt-2 rounded-xl border border-border bg-card p-3 text-sm">{bank}</p>}
              {pay === "Paystack" && (
                <p className="mt-2 text-xs text-muted-foreground">We'll send you a secure Paystack payment link on WhatsApp after confirming your order.</p>
              )}
            </div>
            <div className="space-y-1 rounded-2xl border border-border bg-card p-4 text-sm">
              <Row label="Subtotal" value={naira(subtotal)} />
              <Row label="Delivery" value={form.address ? naira(fee) : "Enter address"} />
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                <span>Total</span>
                <span className="text-primary">{naira(total)}</span>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>
              {busy ? "Placing order…" : `Place order · ${naira(total)}`}
            </Button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
