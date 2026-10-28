import shawarma from "@/assets/cat-shawarma.jpg";
import pizza from "@/assets/cat-pizza.jpg";
import rice from "@/assets/cat-rice.jpg";
import snacks from "@/assets/cat-snacks.jpg";

export const BRAND = {
  name: "Delicacies by Zee",
  tagline: "love in every bite",
  instagram: "Zee_Abubakar",
  instagramUrl: "https://instagram.com/Zee_Abubakar",
  whatsapp: "2348139991550",
  whatsappDisplay: "0813 999 1550",
  address: "New Layout, Bukuru, Jos",
  owner: "Zainab Abubakar",
  channelUrl: "https://whatsapp.com/channel/0029VbEEm1929754BJhF591p",
};

export const CATEGORIES = ["Shawarma", "Pizza", "Rice", "Snacks", "Drinks"] as const;

export const CATEGORY_IMAGES: Record<string, string> = {
  Shawarma: shawarma,
  Pizza: pizza,
  Rice: rice,
  Snacks: snacks,
  Drinks: snacks,
};

export const ORDER_STATUSES = ["pending", "cooking", "on delivery", "delivered"] as const;

/** Opening hours 14:00–19:00 Africa/Lagos. */
export const OPEN_HOUR = 14;
export const CLOSE_HOUR = 19;

export function lagosHour(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lagos",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h + m / 60;
}

export function isOpenNow(date = new Date()): boolean {
  const h = lagosHour(date);
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

/** Delivery fee: Bukuru area ₦1,000, elsewhere in Jos ₦1,500. */
export function deliveryFee(address: string): number {
  if (!address.trim()) return 0;
  return /bukuru/i.test(address) ? 1000 : 1500;
}

export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

export function productImage(p: { image_url: string | null; category: string }) {
  return p.image_url || CATEGORY_IMAGES[p.category] || snacks;
}
