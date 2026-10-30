import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminHead, useAdmin } from "@/components/admin/AdminContext";

export const Route = createFileRoute("/admin/settings")({
  head: () => adminHead("Settings"),
  component: SettingsPage,
});

const FIELDS = [
  ["store_name", "Store name"],
  ["whatsapp", "WhatsApp number (e.g. 2348139991550)"],
  ["bank_name", "Bank name"],
  ["account_name", "Account name"],
  ["account_number", "Account number"],
  ["powered_by_url", "“Powered by Cyber Scorer” link"],
] as const;
type Key = (typeof FIELDS)[number][0];

function SettingsPage() {
  const { isSuper } = useAdmin();
  const [vals, setVals] = useState<Record<Key, string>>({ store_name: "", whatsapp: "", bank_name: "", account_name: "", account_number: "", powered_by_url: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("public_payment_info").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) setVals((v) => Object.fromEntries(FIELDS.map(([k]) => [k, (data[k] as string | null) ?? v[k]])) as Record<Key, string>);
    });
  }, []);

  if (!isSuper) return <p className="py-10 text-center text-muted-foreground">Only Super Admins can change store settings.</p>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const bank_details = vals.bank_name || vals.account_number ? `${vals.bank_name} · ${vals.account_number} · ${vals.account_name}` : null;
    const [a, b] = await Promise.all([
      supabase.from("public_payment_info").upsert({ id: 1, ...vals, bank_details, updated_at: new Date().toISOString() }),
      supabase.from("settings").upsert([
        ...FIELDS.map(([k]) => ({ key: k, value: vals[k] })),
        { key: "bank_details", value: bank_details },
      ]),
    ]);
    setBusy(false);
    if (a.error || b.error) toast.error((a.error ?? b.error)!.message);
    else toast.success("Settings saved");
  };

  return (
    <form onSubmit={save} className="max-w-lg space-y-4">
      <h1 className="text-2xl font-bold text-gold-gradient">Store settings</h1>
      {FIELDS.map(([k, label]) => (
        <div key={k} className="space-y-1.5">
          <Label>{label}</Label>
          <Input value={vals[k]} onChange={(e) => setVals({ ...vals, [k]: e.target.value })} />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Bank details show to customers on the checkout page.</p>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save settings"}</Button>
    </form>
  );
}
