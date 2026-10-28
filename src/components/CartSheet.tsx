import { Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { naira } from "@/lib/brand";

export function CartSheet() {
  const { items, setQty, subtotal, open, setOpen } = useCart();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl text-primary">Your Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto px-4">
          {items.length === 0 && <p className="py-10 text-center text-muted-foreground">Your cart is empty 🍽️</p>}
          {items.map((i) => (
            <div key={i.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
              <div>
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-primary">{naira(i.price * i.qty)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button aria-label="Decrease" onClick={() => setQty(i.id, i.qty - 1)} className="rounded-full border border-border p-1.5">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center">{i.qty}</span>
                <button aria-label="Increase" onClick={() => setQty(i.id, i.qty + 1)} className="rounded-full border border-border p-1.5">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border p-4">
            <div className="mb-3 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="text-primary">{naira(subtotal)}</span>
            </div>
            <Button asChild className="w-full" size="lg" onClick={() => setOpen(false)}>
              <Link to="/checkout">Checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
