import { MessageCircle } from "lucide-react";
import { useSetting } from "@/lib/auth";
import { BRAND } from "@/lib/brand";

export function PoweredBy() {
  const url = useSetting("powered_by_url", BRAND.channelUrl);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 font-bold text-primary hover:underline"
    >
      🚀 Powered by Cyber Scorer <MessageCircle className="h-4 w-4" />
    </a>
  );
}

export function SiteFooter({ showBanner = true }: { showBanner?: boolean }) {
  const url = useSetting("powered_by_url", BRAND.channelUrl);
  return (
    <footer className="mt-16">
      {showBanner && (
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border bg-accent p-5 text-center sm:flex-row sm:text-left">
            <p className="font-display text-lg text-accent-foreground">Follow Cyber Scorer Updates</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold"
            >
              <MessageCircle className="h-4 w-4" /> Join WhatsApp Channel
            </a>
          </div>
        </div>
      )}
      <div className="mt-8 border-t border-border px-4 py-6 pb-24 text-center text-sm text-muted-foreground">
        <p>© 2026 {BRAND.name} - {BRAND.tagline}. All rights reserved.</p>
        <p className="mt-2">
          <PoweredBy />
        </p>
      </div>
    </footer>
  );
}
