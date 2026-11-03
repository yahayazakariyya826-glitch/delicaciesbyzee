import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Mail, UserRound, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminHead, useAdmin } from "@/components/admin/AdminContext";
import { ProfilePasswordInput } from "@/components/admin/ProfilePasswordInput";
import { supabase } from "@/integrations/supabase/client";
import { emailChangeError, passwordChangeError } from "@/lib/admin-profile";

export const Route = createFileRoute("/admin/profile")({
  head: () => adminHead("My profile"),
  component: AdminProfile,
});

function AdminProfile() {
  const { me, isSuper } = useAdmin();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [busy, setBusy] = useState<"password" | "email" | null>(null);
  const [passwordError, setPasswordError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setPendingEmail(data.user?.new_email ?? "");
    });
    return () => { active = false; };
  }, [me.email]);

  const verifiedIdentity = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email) throw new Error("Your session expired. Please sign in again.");
    const { data: admin, error: membershipError } = await supabase.from("admins").select("role").eq("auth_user_id", data.user.id).maybeSingle();
    if (membershipError || admin?.role !== "Super Admin") throw new Error("Access denied - not super admin");
    return data.user;
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(""); setPasswordMessage("");
    const validation = passwordChangeError(currentPassword, password, confirmation);
    if (validation) { setPasswordError(validation); return; }
    setBusy("password");
    try {
      await verifiedIdentity();
      const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
      if (error) throw error;
      setCurrentPassword(""); setPassword(""); setConfirmation("");
      setPasswordMessage("Password changed. Use your new password the next time you sign in.");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "Unable to change password. Please try again.");
    } finally { setBusy(null); }
  };

  const changeEmail = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError(""); setEmailMessage("");
    const validation = emailChangeError(me.email, email, emailPassword);
    if (validation) { setEmailError(validation); return; }
    setBusy("email");
    try {
      const user = await verifiedIdentity();
      const { error: verificationError } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: emailPassword });
      if (verificationError) throw new Error("Current password could not be verified. Please try again.");
      await verifiedIdentity();
      const nextEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.updateUser({ email: nextEmail }, { emailRedirectTo: `${window.location.origin}/login` });
      if (error) throw error;
      setEmailPassword(""); setEmail("");
      setPendingEmail(data.user.new_email ?? "");
      setEmailMessage(data.user.email?.toLowerCase() === nextEmail
        ? "Email changed. Your Super Admin access is unchanged."
        : "Confirmation requested. Check your new and current inboxes and complete the required confirmations. Your sign-in email stays unchanged until confirmed.");
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Unable to change email. Please try again.");
    } finally { setBusy(null); }
  };

  if (!isSuper) return <p role="alert">Access denied - not super admin</p>;
  return <div className="max-w-3xl space-y-8">
    <header className="space-y-4">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-primary"><UserRound className="h-6 w-6" /> My profile</h1>
      <dl className="grid gap-4 border-b border-border pb-6 sm:grid-cols-2">
        <div><dt className="text-sm text-muted-foreground">Signed-in email</dt><dd className="mt-1 break-all font-medium">{me.email}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Role</dt><dd className="mt-1 font-medium">{me.role}</dd></div>
      </dl>
    </header>
    <section className="space-y-5 border-b border-border pb-8">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><KeyRound className="h-5 w-5 text-primary" /> Change password</h2>
      <form onSubmit={changePassword} className="max-w-md space-y-4">
        <ProfilePasswordInput id="profile-current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} disabled={busy !== null} />
        <ProfilePasswordInput id="profile-new-password" label="New password" value={password} onChange={setPassword} disabled={busy !== null} autoComplete="new-password" />
        <ProfilePasswordInput id="profile-confirm-password" label="Confirm new password" value={confirmation} onChange={setConfirmation} disabled={busy !== null} autoComplete="new-password" />
        {passwordError && <p role="alert" className="text-sm text-destructive">{passwordError}</p>}
        {passwordMessage && <p role="status" className="text-sm text-primary">{passwordMessage}</p>}
        <Button type="submit" disabled={busy !== null}><Save className="h-4 w-4" />{busy === "password" ? "Changing password…" : "Change password"}</Button>
      </form>
    </section>
    <section className="space-y-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Mail className="h-5 w-5 text-primary" /> Change email</h2>
      {pendingEmail && <p role="status" className="break-words text-sm text-primary">Awaiting confirmation: {pendingEmail}</p>}
      <form onSubmit={changeEmail} className="max-w-md space-y-4">
        <div className="space-y-2"><Label htmlFor="profile-new-email">New email</Label><Input id="profile-new-email" type="email" autoComplete="email" required disabled={busy !== null} value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <ProfilePasswordInput id="profile-email-password" label="Current password for email change" value={emailPassword} onChange={setEmailPassword} disabled={busy !== null} />
        {emailError && <p role="alert" className="text-sm text-destructive">{emailError}</p>}
        {emailMessage && <p role="status" className="text-sm text-primary">{emailMessage}</p>}
        <Button type="submit" disabled={busy !== null}><Mail className="h-4 w-4" />{busy === "email" ? "Requesting change…" : "Change email"}</Button>
      </form>
    </section>
  </div>;
}