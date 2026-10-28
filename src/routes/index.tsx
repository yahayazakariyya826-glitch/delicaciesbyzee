import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Instagram, MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import hero from "@/assets/hero.jpg";
import logo from "@/assets/logo.png";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { OpenBadge } from "@/components/OpenBadge";
import { useProducts } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { BRAND, CATEGORIES, naira, productImage } from "@/lib/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Delicacies by Zee — Order food in Bukuru, Jos" },
      { name: "description", content: "Shawarma, pizza, jollof rice, meat pie & chicken delivered across Jos and Bukuru. Open 2PM–7PM." },
      { property: "og:title", content: "Delicacies by Zee — love in every bite" },
      { property: "og:description", content: "Shawarma, pizza, jollof & snacks delivered in Jos and Bukuru." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { products, loading } = useProducts();
  const { add } = useCart();
  const [cat, setCat] = useState<string>("All");
  const shown = cat === "All" ? products : products.filter((p) => p.category === cat);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="relative overflow-hidden">
        <img src={hero} alt="" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-14 pt-12 text-center">
          <img src={logo} alt="Delicacies by Zee logo" width={110} height={110} className="h-24 w-24 rounded-full border border-border shadow-gold" />
          <h1 className="mt-5 text-4xl font-bold text-gold-gradient sm:text-6xl">{BRAND.name}</h1>
          <p className="mt-2 font-display text-xl italic text-foreground/90">{BRAND.tagline}</p>
          <div className="mt-5">
            <OpenBadge />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" /> {BRAND.address}
            </span>
            <a href={BRAND.instagramUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary">
              <Instagram className="h-4 w-4 text-primary" /> @{BRAND.instagram}
            </a>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4">
        <div className="sticky top-[61px] z-30 -mx-4 flex gap-2 overflow-x-auto bg-background/90 px-4 py-3 backdrop-blur">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-60 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">Nothing here yet — check back soon 🍽️</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-3 md:grid-cols-3 lg:grid-cols-4">
            {shown.map((p) => (
              <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
                <div className="aspect-square overflow-hidden">
                  <img src={productImage(p)} alt={p.name} loading="lazy" width={400} height={400} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <h3 className="font-sans text-sm font-semibold sm:text-base">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="font-bold text-primary">{naira(p.price)}</span>
                    <button
                      onClick={() => {
                        add(p);
                        toast.success(`${p.name} added to cart`);
                      }}
                      className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-gold active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
