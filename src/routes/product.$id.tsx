import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout, btnOutline, btnPrimary } from "@/components/store/SiteLayout";
import { ProductGrid } from "@/components/store/ProductCard";
import { findProduct, useCategories, useProducts } from "@/lib/db";
import { qtyInCart } from "@/lib/commerce";
import { formatPrice, products as seedProducts } from "@/lib/products";
import { useHydrated, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  head: ({ params }) => {
    const p = seedProducts.find((x) => x.id === params.id);
    return p
      ? seo(p.name, `${p.description} ${formatPrice(p.price)} at THE VIJAY STORE.`)
      : seo("Product", "Product details at THE VIJAY STORE.");
  },
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const products = useProducts();
  const categories = useCategories();
  const hydrated = useHydrated();
  const p = findProduct(products, id);
  const store = useStore();
  const navigate = useNavigate();
  const [img, setImg] = useState(0);
  const [size, setSize] = useState<string>();
  const [color, setColor] = useState<string>();
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setImg(0);
    setSize(undefined);
    setColor(undefined);
    setQty(1);
    if (p) store.viewed(p.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!p || !p.active) {
    return (
      <SiteLayout>
        <div className="py-24 text-center">
          <h1 className="font-display text-4xl">Product not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been removed from the store.
          </p>
          <Link to="/shop" className={cn(btnPrimary, "mt-6")}>
            Continue shopping
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const cat = categories.find((c) => c.id === p.category);
  const inCart = hydrated ? qtyInCart(store.cart, p.id) : 0;
  const available = Math.max(0, p.stock - inCart);
  const wished = hydrated && store.wishlist.includes(p.id);
  const related = products
    .filter((x) => x.active && x.category === p.category && x.id !== p.id)
    .slice(0, 4);

  const add = (buyNow: boolean) => {
    if (p.sizes.length && !size) {
      toast.error("Please select a size");
      return;
    }
    if (p.colors.length && !color) {
      toast.error("Please select a colour");
      return;
    }
    const err = store.add({ productId: p.id, qty, size, color });
    if (err) {
      toast.error(err);
      return;
    }
    if (buyNow) void navigate({ to: "/checkout" });
    else
      toast.success("Added to cart", {
        description: `${p.name} × ${qty}`,
        action: { label: "View cart", onClick: () => void navigate({ to: "/cart" }) },
      });
    setQty(1);
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-gold">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/shop" className="hover:text-gold">
            Shop
          </Link>{" "}
          /{" "}
          <Link
            to="/category/$category"
            params={{ category: p.category }}
            className="hover:text-gold"
          >
            {cat?.name}
          </Link>{" "}
          / <span className="text-foreground">{p.name}</span>
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <div
              className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl bg-muted"
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({
                  x: ((e.clientX - r.left) / r.width) * 100,
                  y: ((e.clientY - r.top) / r.height) * 100,
                });
              }}
              onMouseLeave={() => setZoom(null)}
            >
              <img
                src={p.images[img] ?? p.images[0]}
                alt={`${p.name} — image ${img + 1}`}
                className="h-full w-full object-cover transition-transform duration-200"
                style={
                  zoom
                    ? { transform: "scale(2)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                    : undefined
                }
              />
            </div>
            {p.images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {p.images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setImg(i)}
                    aria-label={`Show image ${i + 1}`}
                    className={cn(
                      "h-20 w-20 overflow-hidden rounded-lg border-2",
                      i === img ? "border-gold" : "border-transparent",
                    )}
                  >
                    <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs tracking-widest text-gold uppercase">{cat?.name}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{p.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-semibold">{formatPrice(p.price)}</span>
              {p.originalPrice && p.originalPrice > p.price && (
                <>
                  <s className="text-muted-foreground">{formatPrice(p.originalPrice)}</s>
                  <span className="rounded bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">
                    {Math.round((1 - p.price / p.originalPrice) * 100)}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">SKU {p.sku} · Demo item</p>
            <p className="mt-5 text-muted-foreground">{p.description}</p>

            <p
              className={cn(
                "mt-5 text-sm font-medium",
                p.stock === 0 ? "text-destructive" : p.stock <= 3 ? "text-gold" : "",
              )}
            >
              {p.stock === 0
                ? "Out of stock"
                : p.stock <= 3
                  ? `Only ${p.stock} left in stock`
                  : "In stock"}
              {inCart > 0 && (
                <span className="font-normal text-muted-foreground"> · {inCart} in your cart</span>
              )}
            </p>

            {p.sizes.length > 0 && (
              <Options label="Size" options={p.sizes} value={size} onChange={setSize} />
            )}
            {p.colors.length > 0 && (
              <Options label="Colour" options={p.colors} value={color} onChange={setColor} />
            )}

            <div className="mt-6">
              <p className="mb-2 text-[11px] tracking-widest text-gold uppercase">Quantity</p>
              <div className="inline-flex items-center rounded-lg border border-border">
                <button
                  aria-label="Decrease quantity"
                  className="p-3"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center" aria-live="polite">
                  {qty}
                </span>
                <button
                  aria-label="Increase quantity"
                  className="p-3 disabled:opacity-30"
                  disabled={qty >= available}
                  onClick={() => setQty((q) => Math.min(available, q + 1))}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                disabled={available <= 0}
                onClick={() => add(false)}
                className={cn(btnPrimary, "flex-1 py-4")}
              >
                <ShoppingBag className="h-4 w-4" /> Add to cart
              </button>
              <button
                disabled={available <= 0}
                onClick={() => add(true)}
                className={cn(btnOutline, "flex-1 py-4")}
              >
                <Zap className="h-4 w-4" /> Buy now
              </button>
              <button
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() => {
                  store.toggleWish(p.id);
                  toast(wished ? "Removed from wishlist" : "Saved to wishlist");
                }}
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-4 hover:border-gold"
              >
                <Heart className={cn("h-5 w-5", wished && "fill-gold text-gold")} />
              </button>
            </div>
            {p.stock > 0 && available <= 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                You already have all available stock in your cart.
              </p>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 font-display text-3xl">You may also like</h2>
            <ProductGrid items={related} />
          </section>
        )}
      </div>
    </SiteLayout>
  );
}

function Options({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-[11px] tracking-widest text-gold uppercase">
        {label}
        {value && <span className="ml-2 text-foreground normal-case">{value}</span>}
      </p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            role="radio"
            aria-checked={value === o}
            onClick={() => onChange(o)}
            className={cn(
              "min-w-12 rounded-lg border px-4 py-2.5 text-sm",
              value === o
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-gold",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
