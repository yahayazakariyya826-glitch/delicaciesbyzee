import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminHead } from "@/components/admin/AdminContext";
import { clearAdminSession, isSuperAdminMembership } from "@/lib/admin-access";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => adminHead("Sign in"),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const signInPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (loginError) { setError(loginError.message); return; }
      const { data: identity, error: identityError } = await supabase.auth.getUser();
      if (identityError || !identity.user?.email) {
        await clearAdminSession(queryClient, () => supabase.auth.signOut());
        setError("Unable to verify your account. Please sign in again."); return;
      }
      const { data: admin, error: membershipError } = await supabase.from("admin_users")
        .select("role").eq("id", identity.user.id).maybeSingle();
      if (membershipError || !isSuperAdminMembership(admin)) {
        await clearAdminSession(queryClient, () => supabase.auth.signOut());
        setError(membershipError ? "Unable to verify admin access. Please try again." : "Access denied - not super admin"); return;
      }
      setPassword("");
      await navigate({ to: "/admin", replace: true });
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to sign in. Please try again.");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm py-10">
        <Link to="/" className="mx-auto block w-fit"><img src={logo} alt="Delicacies by Zee" width={64} height={64} className="h-16 w-16 rounded-full" /></Link>
        <h1 className="mt-4 text-center text-2xl font-bold text-gold-gradient">Admin sign in</h1>
        <form onSubmit={signInPassword} className="mt-6 space-y-4">
          <div className="space-y-1.5"><Label htmlFor="admin-email">Email</Label><Input id="admin-email" type="email" autoComplete="username" required disabled={busy} value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Password</Label>
            <div className="relative">
              <Input id="admin-password" className="pr-12" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={busy} value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button type="button" size="icon" variant="ghost" className="absolute right-0 top-0 h-10 w-10" aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}><LogIn className="h-4 w-4" />{busy ? "Signing in…" : "Login"}</Button>
        </form>
        <Button asChild variant="link" className="mt-4 w-full"><Link to="/login">Forgot password?</Link></Button>
      </div>
    </div>
  );
}
