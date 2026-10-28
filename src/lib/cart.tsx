import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; name: string; price: number; qty: number };

type CartCtx = {
  items: CartItem[];
  add: (p: { id: string; name: string; price: number }, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
  open: boolean;
  setOpen: (o: boolean) => void;
};

const Ctx = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dbz-cart");
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("dbz-cart", JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = (p, qty = 1) =>
    setItems((cur) => {
      const ex = cur.find((i) => i.id === p.id);
      if (ex) return cur.map((i) => (i.id === p.id ? { ...i, qty: i.qty + qty } : i));
      return [...cur, { id: p.id, name: p.name, price: p.price, qty }];
    });
  const setQty = (id: string, qty: number) =>
    setItems((cur) => (qty <= 0 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, qty } : i))));

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ items, add, setQty, clear: () => setItems([]), subtotal, count, open, setOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside provider");
  return c;
}
