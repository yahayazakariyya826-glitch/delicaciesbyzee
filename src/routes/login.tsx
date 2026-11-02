import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Delicacies by Zee" },
      { name: "description", content: "Sign in to Delicacies by Zee with your password or a one-time email code." },
      { property: "og:title", content: "Sign in — Delicacies by Zee" },
      { property: "og:description", content: "Sign in with your password or a one-time email code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"password" | "code" | "reset">("password");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { toast.error("Incorrect email or password."); return; }
    const { data: admin } = await supabase.rpc("is_admin");
    navigate({ to: admin ? "/admin/dashboard" : "/" });
  };
  const reset = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setMessage("If this email has an account, a secure reset link has been sent. Check your inbox and spam folder.");
  };

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Code sent! Check your email.");
    setStep("code");
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
    setBusy(false);
    if (error) { toast.error("Invalid or expired code"); return; }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) {
      toast.success("Welcome, admin!");
      navigate({ to: "/admin" });
    } else {
      toast.message("Signed in — not authorized as admin.");
      navigate({ to: "/" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <Link to="/" className="mx-auto">
          <img src={logo} alt="Delicacies by Zee" width={80} height={80} className="h-20 w-20 rounded-full shadow-gold" />
        </Link>
        <h1 className="mt-5 text-center text-3xl font-bold text-gold-gradient">Sign in</h1>
        {mode !== "code" ? <form onSubmit={mode === "reset" ? reset : signIn} className="mt-6 space-y-3">
          <Input aria-label="Email" type="email" autoComplete="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          {mode === "password" && <Input aria-label="Password" type="password" autoComplete="current-password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />}
          <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "reset" ? "Send reset link" : "Sign in"}</Button>
          {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
        </form> : step === "email" ? (
          <form onSubmit={sendCode} className="mt-6 space-y-3">
            <Input type="email" required placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Sending…" : "Send 6-digit code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 flex flex-col items-center space-y-4">
            <p className="text-center text-sm text-muted-foreground">Enter the code sent to {email}</p>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
              {busy ? "Verifying…" : "Verify & sign in"}
            </Button>
            <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setStep("email")}>
              Use a different email
            </button>
          </form>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-1">
          <Button variant="link" size="sm" disabled={busy} onClick={() => { setMode(mode === "code" ? "password" : "code"); setStep("email"); setMessage(""); }}>{mode === "code" ? "Use password" : "Email me a code"}</Button>
          <Button variant="link" size="sm" disabled={busy} onClick={() => { setMode(mode === "reset" ? "password" : "reset"); setMessage(""); }}>{mode === "reset" ? "Use password" : "Forgot password?"}</Button>
        </div>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/checkout">Continue as guest</Link>
        </Button>
      </div>
      <SiteFooter showBanner={false} />
    </div>
  );
}
