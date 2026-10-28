import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(30),
  menu: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        category: z.string(),
        description: z.string().nullable(),
      }),
    )
    .max(200),
  isOpen: z.boolean(),
  lagosTime: z.string().max(40),
});

export const askZee = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { reply: "Sorry, assistant is unavailable right now. Please WhatsApp 0813 999 1550 🙏" };

    const menu = data.menu
      .map((m) => `- ${m.name} (id: ${m.id}) — ₦${m.price} [${m.category}] ${m.description ?? ""}`)
      .join("\n");

    const system = `You are "Zee Assistant", the warm, witty, intelligent food assistant for Delicacies by Zee ("love in every bite"), owned by Zainab Abubakar. Personality: like Meta AI — friendly, helpful, a little funny. You mix Hausa and English naturally (e.g. "Sannu!", "Na gode", "Yauwa", "Me kike so?"). Keep replies short (2–5 sentences), use emojis sparingly.

FACTS:
- Address: New Layout, Bukuru, Jos. Delivery across Jos and Bukuru (Bukuru ₦1,000, elsewhere in Jos ₦1,500).
- Hours: 2PM–7PM daily (Africa/Lagos). Current Lagos time: ${data.lagosTime}. We are currently ${data.isOpen ? "OPEN" : "CLOSED"}.
- Payment: Pay on Delivery, Bank Transfer, or Paystack.
- How to order: add items to cart, tap the cart, fill name/phone/address, checkout — the order is also sent to WhatsApp 0813 999 1550. Instagram @Zee_Abubakar.

MENU (NGN):
${menu}

RULES:
- Recommend food, explain likely ingredients, calculate totals clearly.
- Only mention items from the menu. Never invent prices.
- Whenever you recommend specific items or the user wants to order, add a token [[ADD:<id>]] for each item on its own line at the end, so the app shows Add to Cart buttons. Use exact ids.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });
    if (res.status === 429) return { reply: "Too many messages right now — please wait a moment and try again 🙏" };
    if (res.status === 402) return { reply: "The assistant is resting for now. Please WhatsApp us on 0813 999 1550 😊" };
    if (!res.ok) return { reply: "Hmm, something went wrong. Please try again." };
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return { reply: json.choices?.[0]?.message?.content ?? "..." };
  });
