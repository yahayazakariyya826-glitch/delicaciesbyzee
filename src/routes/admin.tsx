import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Settings, ShieldCheck, MessageSquare,
  Menu, Sun, Moon, LogOut, ShieldAlert, Store, History,
} from "lucide-react";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { AdminContext, adminHead, type Admin } from "@/components/admin/AdminContext";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => adminHead("Dashboard"),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, loading } = useUser();
  const navigate = useNavigate();
  const [me, setMe] = useState<Admin | null | undefined>(undefined);

  useEffect(() => {
    if (loading) return;
    if (!user?.email) {
      navigate({ to: "/admin/login", replace: true });
      return;
    }
    supabase.from("admins").select("*").ilike("email", user.email).maybeSingle().then(({ data }) => setMe(data ?? null));
  }, [user, loading, navigate]);

  useEffect(() => {
    if (me === null) {
      const t = setTimeout(() => navigate({ to: "/", replace: true }), 2500);
      return () => clearTimeout(t);
    }
    if (me) {
      supabase.rpc("admin_heartbeat");
      const t = setInterval(() => supabase.rpc("admin_heartbeat"), 60_000);
      return () => clearInterval(t);
    }
    return undefined;
  }, [me, navigate]);

  if (me === undefined) return <div className="min-h-screen" />;
  if (me === null)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h1 className="text-3xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">This account is not an admin. Taking you home…</p>
      </div>
    );

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
  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
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
        <button onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-accent"><LogOut className="h-4 w-4" /> Sign out</button>
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
