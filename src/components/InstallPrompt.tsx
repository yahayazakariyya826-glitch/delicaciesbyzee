import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X } from "lucide-react";
import { isAppleMobile, shouldOfferInstall } from "@/lib/install-prompt";
import logo from "@/assets/logo.png";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const KEY = "dbz-install-dismissed";

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [apple, setApple] = useState(false);
  const [instructions, setInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    let dismissed = 0;
    try { dismissed = Number(localStorage.getItem(KEY) || 0); } catch { /* Storage can be unavailable in private browsers. */ }
    const ios = isAppleMobile(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
    setApple(ios);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const mobile = ios || /Android|Mobi/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 0 && window.matchMedia("(max-width: 768px)").matches);
    if (!shouldOfferInstall({ mobile, standalone, dismissedAt: dismissed, now: Date.now() })) return;
    const timer = setTimeout(() => setShow(true), 3000);
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
    };
    const installed = () => { setShow(false); setEvt(null); };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installed);
      clearTimeout(timer);
    };
  }, []);

  if (!show) return null;
  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch { /* Still allow dismissal. */ }
    setShow(false);
  };
  return (
    <section role="dialog" aria-label="Install Delicacies by Zee" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-gold motion-safe:animate-in motion-safe:slide-in-from-bottom">
      <div className="mx-auto flex max-w-md items-center gap-3">
        <img src={logo} alt="" width={48} height={48} className="h-12 w-12 rounded-xl" />
        <p className="min-w-0 flex-1 text-sm font-medium">Install Delicacies by Zee</p>
        <Button variant="ghost" size="icon" aria-label="Close install offer" title="Close" onClick={dismiss}><X className="h-4 w-4" /></Button>
      </div>
      {instructions && <p role="status" className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">{apple ? <><Share className="mr-1 inline h-4 w-4" />In Safari, tap Share, then Add to Home Screen, then Add.</> : <>Open your browser menu (⋮), then choose Install app or Add to Home screen. If the option is missing, open this page in Chrome.</>}</p>}
      <div className="mx-auto mt-3 flex max-w-md gap-2">
        <Button variant="outline" className="flex-1" onClick={dismiss}>
          Not now
        </Button>
        <Button
          className="flex-1"
          disabled={installing}
          onClick={async () => {
            if (!evt) { setInstructions(true); return; }
            setInstalling(true);
            try {
              await evt.prompt();
              const choice = await evt.userChoice;
              if (choice.outcome === "accepted") setShow(false);
              else dismiss();
              setEvt(null);
            } catch { setEvt(null); setInstructions(true); }
            finally { setInstalling(false); }
          }}
        >
          <Download className="mr-2 h-4 w-4" />{installing ? "Installing…" : "Install"}
        </Button>
      </div>
    </section>
  );
}
