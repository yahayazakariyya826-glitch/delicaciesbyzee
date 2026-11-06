import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { emailSchema, loginSchema, validationMessage } from "@/lib/input-validation";
import { isSuperAdminMembership } from "@/lib/admin-access";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Delicacies by Zee" },
      { name: "description", content: "Sign in to Delicacies by Zee with your email and password." },
      { property: "og:title", content: "Sign in — Delicacies by Zee" },
      { property: "og:description", content: "Sign in with your email and password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"password" | "reset">("password");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { toast.error(validationMessage(parsed.error)); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) throw error;
      const { data: identity, error: identityError } = await supabase.auth.getUser();
      if (identityError || !identity.user) throw new Error("Unable to verify your account.");
      const { data: admin, error: membershipError } = await supabase.from("admin_users").select("role").eq("id", identity.user.id).maybeSingle();
      if (membershipError) throw new Error("Unable to check admin access. Please try again.");
      setPassword("");
      await navigate({ to: isSuperAdminMembership(admin) ? "/admin" : "/", replace: true });
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to sign in."); }
    finally { setBusy(false); }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) { toast.error(validationMessage(parsed.error)); return; }
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setMessage("If this email has an account, a secure reset link has been sent. Check your inbox and spam folder.");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mx-auto">
          <img src={logo} alt="Delicacies by Zee" width={80} height={80} className="h-20 w-20 rounded-full shadow-gold" />
        </Link>
        <h1 className="mt-5 text-center text-3xl font-bold text-gold-gradient">{mode === "reset" ? "Reset password" : "Sign in"}</h1>
        <form onSubmit={mode === "reset" ? reset : signIn} className="mt-6 space-y-3">
          <Input aria-label="Email" type="email" autoComplete="email" maxLength={255} disabled={busy} required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode === "password" && <Input aria-label="Password" type="password" autoComplete="current-password" maxLength={256} disabled={busy} required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "reset" ? "Send reset link" : "Sign in"}</Button>
          {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        </form>
        <div className="mt-3 flex justify-center">
          <Button variant="link" size="sm" disabled={busy} onClick={() => { setMode(mode === "reset" ? "password" : "reset"); setMessage(""); }}>{mode === "reset" ? "Back to sign in" : "Forgot password?"}</Button>
        </div>
        <p className="mt-3 text-center text-sm text-muted-foreground">No account? <Link to="/signup" className="text-primary underline">Create one</Link></p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/checkout">Continue as guest</Link>
        </Button>
      </div>
      <SiteFooter showBanner={false} />
    </div>
  );
}
