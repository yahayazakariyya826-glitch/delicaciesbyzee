import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { adminHead } from "@/components/admin/AdminContext";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => adminHead("Sign in"),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (isAdmin) {
      toast.success("Welcome back!");
      navigate({ to: "/admin/dashboard", replace: true });
    } else {
      await supabase.auth.signOut();
      toast.error("This email is not on the admin list.");
      navigate({ to: "/", replace: true });
    }
  };

  const signInPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { toast.error("Wrong email or password. First time? Use “Email me a code”, then set a password."); return; }
    finish();
  };
  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Code sent — check your email.");
    setCodeSent(true);
  };
  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
    setBusy(false);
    if (error) { toast.error("Invalid or expired code"); return; }
    finish();
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-gold">
        <Link to="/" className="mx-auto block w-fit"><img src={logo} alt="Delicacies by Zee" width={64} height={64} className="h-16 w-16 rounded-full" /></Link>
        <h1 className="mt-4 text-center text-2xl font-bold text-gold-gradient">Admin sign in</h1>
        {mode === "password" ? (
          <form onSubmit={signInPassword} className="mt-6 space-y-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Password</Label><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        ) : !codeSent ? (
          <form onSubmit={sendCode} className="mt-6 space-y-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send 6-digit code"}</Button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-6 flex flex-col items-center space-y-4">
            <p className="text-center text-sm text-muted-foreground">Code sent to {email}</p>
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>{Array.from({ length: 6 }).map((_, i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
            </InputOTP>
            <Button type="submit" className="w-full" disabled={busy || code.length < 6}>Verify & sign in</Button>
          </form>
        )}
        <button type="button" className="mt-4 w-full text-center text-xs text-muted-foreground underline" onClick={() => { setMode(mode === "password" ? "code" : "password"); setCodeSent(false); }}>
          {mode === "password" ? "Email me a code instead" : "Use password instead"}
        </button>
      </div>
    </div>
  );
}
