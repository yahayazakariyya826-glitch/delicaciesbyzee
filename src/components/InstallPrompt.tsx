import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
const KEY = "dbz-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - dismissed < 24 * 60 * 60 * 1000) return;
    let timer: ReturnType<typeof setTimeout>;
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      timer = setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  if (!show || !evt) return null;
  const dismiss = () => {
    localStorage.setItem(KEY, String(Date.now()));
    setShow(false);
  };
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 animate-in slide-in-from-bottom border-t border-border bg-card p-4 shadow-gold">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <img src={logo} alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
        <p className="flex-1 text-sm font-medium">Install Delicacies by Zee App 📱 - Order faster!</p>
      </div>
      <div className="mx-auto mt-3 flex max-w-md gap-2">
        <Button variant="outline" className="flex-1" onClick={dismiss}>
          Not now
        </Button>
        <Button
          className="flex-1"
          onClick={async () => {
            await evt.prompt();
            setShow(false);
            setEvt(null);
          }}
        >
          Install
        </Button>
      </div>
    </div>
  );
}
