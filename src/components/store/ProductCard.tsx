import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, type Product } from "@/lib/products";
import { useCategories } from "@/lib/db";
import { useHydrated, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { add, toggleWish, wishlist } = useStore();
  const hydrated = useHydrated();
  const wished = hydrated && wishlist.includes(product.id);
  const cat = useCategories().find((c) => c.id === product.category)?.name;
  const needsChoice = product.sizes.length > 0 || product.colors.length > 0;
  const out = product.stock <= 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-elegant">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          className={cn(
            "h-full w-full object-cover transition-transform duration-700 group-hover:scale-110",
            out && "opacity-60",
          )}
        />
        <span className="absolute top-3 left-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          {out ? "Out of stock" : product.stock <= 3 ? `Only ${product.stock} left` : "Demo item"}
        </span>
      </Link>
      <button
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => {
          toggleWish(product.id);
          toast(wished ? "Removed from wishlist" : "Saved to wishlist", {
            description: product.name,
          });
        }}
        className="absolute top-3 right-3 rounded-full bg-background/90 p-2 transition-colors hover:bg-background"
      >
        <Heart className={cn("h-4 w-4", wished ? "fill-gold text-gold" : "text-foreground")} />
      </button>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <p className="text-[10px] tracking-widest text-gold uppercase sm:text-[11px]">{cat}</p>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="mt-1 font-display text-base leading-tight hover:text-gold sm:text-lg"
        >
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 hidden text-xs text-muted-foreground sm:block">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="flex flex-col leading-tight sm:flex-row sm:items-baseline sm:gap-2">
            <span className="font-semibold">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <s className="text-xs text-muted-foreground">{formatPrice(product.originalPrice)}</s>
            )}
          </div>
          {needsChoice ? (
            <Link
              to="/product/$id"
              params={{ id: product.id }}
              className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-gold hover:text-gold"
            >
              Options
            </Link>
          ) : (
            <button
              disabled={out}
              aria-label={`Add ${product.name} to cart`}
              onClick={() => {
                const err = add({ productId: product.id, qty: 1 });
                if (err) toast.error(err);
                else toast.success("Added to cart", { description: product.name });
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-gold hover:text-gold-foreground disabled:opacity-40"
            >
              <ShoppingBag className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ items }: { items: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
