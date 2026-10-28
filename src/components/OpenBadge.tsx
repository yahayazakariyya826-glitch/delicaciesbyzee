import { useEffect, useState } from "react";
import { isOpenNow } from "@/lib/brand";

export function useIsOpen() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const tick = () => setOpen(isOpenNow());
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, []);
  return open;
}

export function OpenBadge() {
  const open = useIsOpen();
  if (open === null) return null;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wider ${
        open ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
      }`}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
      {open ? "OPEN NOW" : "CLOSED"} · 2PM–7PM
    </span>
  );
}
