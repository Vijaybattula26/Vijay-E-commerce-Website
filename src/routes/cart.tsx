import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import {
  PageHeader,
  SiteLayout,
  EmptyState,
  btnOutline,
  btnPrimary,
} from "@/components/store/SiteLayout";
import { ConfirmButton } from "@/components/store/ConfirmButton";
import { totals } from "@/lib/commerce";
import { useSettings } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { useHydrated, useStore } from "@/lib/store";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cart")({
  head: () => seo("Your cart", "Review the items in your shopping cart.", { robots: "noindex" }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQty, remove, clearCart } = useStore();
  const settings = useSettings();
  const hydrated = useHydrated();
  const t = totals(
    lines.map((l) => ({ price: l.product.price, qty: l.line.qty })),
    "standard",
    settings,
  );

  return (
    <SiteLayout>
      <PageHeader eyebrow="Shopping bag" title="Your cart" />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {!hydrated ? null : lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="Your cart is empty"
            text="Discover something you'll love."
            action={
              <Link to="/shop" className={btnPrimary}>
                Continue shopping
              </Link>
            }
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                {lines.map(({ line, key, product: p }) => (
                  <li key={key} className="flex gap-4 p-4">
                    <Link to="/product/$id" params={{ id: p.id }} className="shrink-0">
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-24 w-24 rounded-lg object-cover"
                      />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link
                          to="/product/$id"
                          params={{ id: p.id }}
                          className="font-display text-lg leading-tight hover:text-gold"
                        >
                          {p.name}
                        </Link>
                        <button
                          aria-label={`Remove ${p.name}`}
                          onClick={() => remove(key)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[line.size && `Size ${line.size}`, line.color]
                          .filter(Boolean)
                          .join(" · ") || "\u00a0"}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatPrice(p.price)} each</p>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            aria-label="Decrease quantity"
                            className="p-2"
                            onClick={() => setQty(key, line.qty - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{line.qty}</span>
                          <button
                            aria-label="Increase quantity"
                            className="p-2"
                            onClick={() => setQty(key, line.qty + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="font-semibold">{formatPrice(p.price * line.qty)}</span>
                      </div>
                      {p.stock < line.qty && (
                        <p className="mt-1 text-xs text-destructive">
                          Only {p.stock} in stock — please reduce quantity.
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap justify-between gap-3">
                <Link to="/shop" className="text-sm text-gold underline underline-offset-4">
                  ← Continue shopping
                </Link>
                <ConfirmButton
                  title="Clear your cart?"
                  description="All items will be removed from your cart."
                  confirmLabel="Clear cart"
                  onConfirm={clearCart}
                  className="text-sm text-muted-foreground underline"
                >
                  Clear cart
                </ConfirmButton>
              </div>
            </div>
            <aside className="h-fit space-y-3 rounded-xl border border-border bg-card p-6 text-sm lg:sticky lg:top-24">
              <h2 className="font-display text-2xl">Summary</h2>
              <Row label={`Items (${t.items})`} value={formatPrice(t.subtotal)} />
              <Row
                label="Standard delivery"
                value={t.delivery === 0 ? "Free" : formatPrice(t.delivery)}
              />
              {t.delivery > 0 && (
                <p className="text-xs text-muted-foreground">
                  Add {formatPrice(settings.freeDeliveryThreshold - t.subtotal)} more for free
                  standard delivery.
                </p>
              )}
              <div className="border-t border-border pt-3">
                <Row label="Total payable" value={formatPrice(t.total)} bold />
              </div>
              <Link to="/checkout" className={cn(btnPrimary, "w-full py-4")}>
                Proceed to checkout (Cash on Delivery)
              </Link>
              <p className="text-center text-[11px] text-muted-foreground">
                Pay in cash or digital UPI upon doorstep delivery.
              </p>
              <Link to="/shop" className={cn(btnOutline, "w-full")}>
                Continue shopping
              </Link>
            </aside>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between", bold && "text-base font-semibold")}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
