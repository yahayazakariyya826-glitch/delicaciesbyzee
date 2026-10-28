import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { useCart } from "@/lib/cart";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { BRAND } from "@/lib/brand";

export function SiteHeader() {
  const { count, setOpen } = useCart();
  const { user } = useUser();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" width={36} height={36} className="h-9 w-9 rounded-full" />
          <span className="font-display text-lg font-semibold text-gold-gradient">{BRAND.name}</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden max-w-[160px] truncate text-xs text-muted-foreground sm:inline">{user.email}</span>
              <button
                aria-label="Log out"
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/", replace: true });
                }}
                className="rounded-full p-2 text-muted-foreground hover:text-primary"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
              Login
            </Link>
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open cart"
            className="relative rounded-full bg-primary p-2.5 text-primary-foreground shadow-gold"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
