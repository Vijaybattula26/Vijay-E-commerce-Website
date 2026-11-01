import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Cloud, Heart, LogIn, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout, EmptyState, btnPrimary } from "@/components/store/SiteLayout";
import { findProduct, useProducts } from "@/lib/db";
import { formatPrice, type Product } from "@/lib/products";
import { useHydrated, useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/wishlist")({
  head: () => seo("Wishlist", "Your saved favourites at THE VIJAY STORE.", { robots: "noindex" }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist, toggleWish, add } = useStore();
  const products = useProducts();
  const hydrated = useHydrated();
  const { user, loading, syncing, signInWithGoogle, syncWishlistNow } = useAuth();

  const items = wishlist
    .map((id) => findProduct(products, id))
    .filter((p): p is Product => !!p && p.active);

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Saved"
        title={`Wishlist${hydrated && items.length ? ` (${items.length})` : ""}`}
      />
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Cloud Sync Status Banner */}
        {hydrated && !loading && (
          <div className="mb-8 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            {user ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        Cloud Wishlist Active
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-500 uppercase">
                        Synced
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Linked to {user.email || user.displayName}. Synced across all your devices.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    disabled={syncing}
                    onClick={() => void syncWishlistNow()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-gold disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-gold" : ""}`}
                    />
                    <span>{syncing ? "Syncing..." : "Sync Now"}</span>
                  </button>
                  <Link
                    to="/account"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-gold hover:underline"
                  >
                    View Account
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 sm:items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                    <Cloud className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      Sync your wishlist across devices
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Sign in with your Google account to save your favourites securely to the
                      cloud.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-95"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign in with Google</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!hydrated ? null : items.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-10 w-10" />}
            title="No favourites yet"
            text="Tap the heart on any product to save it here."
            action={
              <Link to="/shop" className={btnPrimary}>
                Discover products
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => {
              const needsChoice = p.sizes.length > 0 || p.colors.length > 0;
              return (
                <li key={p.id} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                  <Link to="/product/$id" params={{ id: p.id }}>
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      to="/product/$id"
                      params={{ id: p.id }}
                      className="font-display text-lg leading-tight hover:text-gold"
                    >
                      {p.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{formatPrice(p.price)}</p>
                    {p.stock === 0 && <p className="text-xs text-destructive">Out of stock</p>}
                    <div className="mt-auto flex gap-4 pt-2 text-sm">
                      {needsChoice ? (
                        <Link
                          to="/product/$id"
                          params={{ id: p.id }}
                          className="font-medium text-gold"
                        >
                          Choose options
                        </Link>
                      ) : (
                        <button
                          disabled={p.stock === 0}
                          className="font-medium text-gold disabled:opacity-40"
                          onClick={() => {
                            const err = add({ productId: p.id, qty: 1 });
                            if (err) {
                              toast.error(err);
                              return;
                            }
                            toggleWish(p.id);
                            toast.success("Moved to cart", { description: p.name });
                          }}
                        >
                          Move to cart
                        </button>
                      )}
                      <button
                        onClick={() => toggleWish(p.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}
