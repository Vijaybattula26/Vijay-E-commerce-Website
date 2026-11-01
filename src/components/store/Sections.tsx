import { Link } from "@tanstack/react-router";
import { Truck, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { useCategories } from "@/lib/db";

export function CategoryTiles() {
  const categories = useCategories();
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      {categories.map((c) => (
        <Link
          key={c.id}
          to="/category/$category"
          params={{ category: c.id }}
          className="group relative aspect-[4/3] overflow-hidden rounded-xl text-left"
        >
          <img
            src={c.image}
            alt={c.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-overlay/80 via-overlay/20 to-transparent" />
          <div className="absolute bottom-0 p-3 text-overlay-foreground sm:p-4">
            <h3 className="font-display text-lg sm:text-2xl">{c.name}</h3>
            <p className="hidden text-xs opacity-80 sm:block">{c.blurb}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function WhyUs() {
  const items = [
    [Truck, "Fast Delivery", "Free standard delivery on orders over ₹1,999 across India."],
    [ShieldCheck, "Cash on Delivery", "Doorstep payment with cash or UPI QR scan across India."],
    [RotateCcw, "Easy Returns", "Hassle-free 7-day exchange and return policy."],
    [Headphones, "Dedicated Support", "Friendly customer service ready to assist you."],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map(([I, t, d]) => (
        <div key={t} className="rounded-xl border border-border bg-card p-5 text-center sm:p-6">
          <I className="mx-auto h-8 w-8 text-gold" />
          <h3 className="mt-3 font-display text-lg">{t}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{d}</p>
        </div>
      ))}
    </div>
  );
}
