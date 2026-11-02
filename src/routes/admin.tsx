import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, ShieldCheck, MessageSquare,
  Menu, Sun, Moon, LogOut, Store, History,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminContext, adminHead, type Admin } from "@/components/admin/AdminContext";
import { clearAdminSession, isSuperAdminMembership } from "@/lib/admin-access";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => adminHead("Dashboard"),
  beforeLoad: async () => {
    const { data: identity, error } = await supabase.auth.getUser();
    if (error || !identity.user?.email) throw redirect({ to: "/admin/login", replace: true });
    const email = identity.user.email.toLowerCase();
    const { data: membership, error: membershipError } = await supabase.from("admin_users").select("role").eq("email", email).maybeSingle();
    if (membershipError || !isSuperAdminMembership(membership)) throw redirect({ to: "/admin/login", replace: true });
    const { data: me, error: adminError } = await supabase.from("admins").select("*").ilike("email", email).maybeSingle();
    if (adminError || !me) throw redirect({ to: "/admin/login", replace: true });
    return { me };
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { me } = Route.useRouteContext();
  useEffect(() => {
    void supabase.rpc("admin_heartbeat");
    const t = setInterval(() => { void supabase.rpc("admin_heartbeat"); }, 60_000);
    return () => clearInterval(t);
  }, [me]);

  return (
    <AdminContext.Provider value={me}>
      <Shell me={me} />
    </AdminContext.Provider>
  );
}

function useTheme() {
  const [light, setLight] = useState(() => typeof window !== "undefined" && localStorage.getItem("admin-theme") === "light");
  useEffect(() => {
    document.documentElement.classList.toggle("light", light);
    localStorage.setItem("admin-theme", light ? "light" : "dark");
    return () => document.documentElement.classList.remove("light");
  }, [light]);
  return { light, toggle: () => setLight((v) => !v) };
}

function Shell({ me }: { me: Admin }) {
  const isSuper = me.role === "Super Admin";
  const [open, setOpen] = useState(false);
  const { light, toggle } = useTheme();
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const [signingOut, setSigningOut] = useState(false);
  const signOut = async () => {
    setSigningOut(true);
    try {
      await clearAdminSession(queryClient, () => supabase.auth.signOut());
      await navigate({ to: "/admin/login", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign out.");
    } finally { setSigningOut(false); }
  };

  const links = [
    { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, show: true },
    { to: "/admin/orders", label: "Orders", icon: ShoppingBag, show: true },
    { to: "/admin/products", label: "Products", icon: UtensilsCrossed, show: true },
    { to: "/admin/customers", label: "Customers", icon: Users, show: true },
    { to: "/admin/chats", label: "Live chat", icon: MessageSquare, show: true },
    { to: "/admin/activity", label: "Activity log", icon: History, show: true },
    { to: "/admin/admins", label: "Admins", icon: ShieldCheck, show: isSuper },
    { to: "/admin/settings", label: "Settings", icon: Settings, show: isSuper },
  ] as const;

  const nav = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <Link to="/" className="mb-4 flex items-center gap-2 px-2">
        <img src={logo} alt="" width={36} height={36} className="h-9 w-9 rounded-full" />
        <span className="font-display text-lg font-bold text-gold-gradient">Zee Admin</span>
      </Link>
      {links.filter((l) => l.show).map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent"
          activeProps={{ className: "bg-primary text-primary-foreground hover:bg-primary" }}
        >
          <l.icon className="h-4 w-4" /> {l.label}
        </Link>
      ))}
      <div className="mt-auto space-y-1 border-t border-border pt-3">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent"><Store className="h-4 w-4" /> View store</Link>
        <Button variant="ghost" disabled={signingOut} onClick={signOut} className="w-full justify-start gap-3 px-3"><LogOut className="h-4 w-4" /> {signingOut ? "Signing out…" : "Sign out"}</Button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-card md:block">{nav}</aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Admin menu</SheetTitle>
          {nav}
        </SheetContent>
      </Sheet>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
          <Button size="icon" variant="ghost" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></Button>
          <p className="truncate text-sm text-muted-foreground"><span className="font-semibold text-primary">{me.role}</span> · {me.email}</p>
          <Button size="icon" variant="ghost" className="ml-auto" onClick={toggle} aria-label="Toggle theme">
            {light ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
