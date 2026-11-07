import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isStrongPassword, STRONG_PASSWORD_MESSAGE, validResetPassword } from "@/lib/password";
import { PasswordChecklist } from "@/components/PasswordChecklist";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({ meta: [
    { title: "Reset password — Delicacies by Zee" },
    { name: "description", content: "Securely reset your Delicacies by Zee password." },
    { property: "og:title", content: "Reset password — Delicacies by Zee" },
    { property: "og:description", content: "Secure password recovery for Delicacies by Zee." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ResetPassword,
});

function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // An ordinary signed-in session does not unlock this recovery form.
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.get("error_description")) setError("This reset link is invalid or expired. Request a new link.");
    return () => data.subscription.unsubscribe();
  }, []);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || !validResetPassword(password, confirmation)) { setError("Use at least 8 characters and matching passwords."); return; }
    setBusy(true); setError("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSaved(true); setPassword(""); setConfirmation("");
    await supabase.auth.signOut();
  };
  return <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-4 px-4 py-12">
    <h1 className="text-3xl font-bold text-gold-gradient">Reset password</h1>
    {saved ? <p role="status">Password saved. You can now sign in.</p> : ready ? <form onSubmit={save} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
    </form> : <p className="text-muted-foreground">Open the secure reset link in your email to choose a new password.</p>}
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <Button asChild variant="outline"><Link to="/login">Back to sign in</Link></Button>
  </main>;
}