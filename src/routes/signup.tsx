import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { signupSchema } from "@/lib/signup";
import { validationMessage } from "@/lib/input-validation";
import { PasswordChecklist } from "@/components/PasswordChecklist";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [
    { title: "Create account — Delicacies by Zee" },
    { name: "description", content: "Create your Delicacies by Zee customer account." },
    { property: "og:title", content: "Create account — Delicacies by Zee" },
    { property: "og:description", content: "Join Delicacies by Zee with your name, email and phone." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirmation: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) { toast.error(validationMessage(parsed.error)); return; }
    setBusy(true);
    try {
      const { full_name, email, phone, password } = parsed.data;
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name, phone }, emailRedirectTo: window.location.origin } });
      if (error) throw error;
      setForm((value) => ({ ...value, password: "", confirmation: "" }));
      if (data.session) await navigate({ to: "/", replace: true });
      else setSent(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create your account."); }
    finally { setBusy(false); }
  };
  const fields = [
    { key: "full_name", label: "Full name", type: "text", autocomplete: "name", max: 100 },
    { key: "email", label: "Email", type: "email", autocomplete: "email", max: 255 },
    { key: "phone", label: "Phone", type: "tel", autocomplete: "tel-national", max: 11 },
    { key: "password", label: "Password", type: "password", autocomplete: "new-password", max: 256 },
    { key: "confirmation", label: "Confirm password", type: "password", autocomplete: "new-password", max: 256 },
  ] as const;
  return <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-8">
    <Link to="/" className="mx-auto"><img src={logo} alt="Delicacies by Zee" width={64} height={64} className="rounded-full" /></Link>
    <h1 className="mt-4 text-center text-3xl font-bold text-gold-gradient">Create account</h1>
    {sent ? <p role="status" className="mt-6 text-center">Check your email to confirm your account, then sign in. Check spam too.</p> : <form onSubmit={submit} className="mt-5 space-y-3">
      {fields.map((field) => <div key={field.key} className="space-y-1"><Label htmlFor={field.key}>{field.label}</Label><Input id={field.key} type={field.type} autoComplete={field.autocomplete} maxLength={field.max} minLength={field.type === "password" ? 8 : undefined} required disabled={busy} value={form[field.key]} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} /></div>)}
      <Button className="w-full" disabled={busy}>{busy ? "Creating account…" : "Create account"}</Button>
    </form>}
    <p className="mt-4 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="text-primary underline">Login</Link></p>
  </main>;
}