import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Cloud,
  Heart,
  LogIn,
  LogOut,
  Package,
  RefreshCw,
  ShoppingBag,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SiteLayout, btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { customerDb } from "@/lib/db";
import { isEmail, isIndianMobile } from "@/lib/commerce";
import { useHydrated, useMyOrders, useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/account")({
  head: () =>
    seo("My account", "Your profile, orders, wishlist and saved cart.", { robots: "noindex" }),
  component: Account,
});

function Account() {
  const hydrated = useHydrated();
  const { count, wishlist } = useStore();
  const orders = useMyOrders();
  const { user, loading, syncing, signInWithGoogle, signOut, syncWishlistNow } = useAuth();
  const [f, setF] = useState({ name: "", mobile: "", email: "" });
  const c = customerDb.use();

  useEffect(() => {
    if (c) {
      setF((prev) => ({
        name: c.name || prev.name,
        mobile: c.mobile || prev.mobile,
        email: c.email || prev.email,
      }));
    } else if (user) {
      setF((prev) => ({
        name: user.displayName || prev.name,
        mobile: prev.mobile,
        email: user.email || prev.email,
      }));
    }
  }, [c, user]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2 || !isIndianMobile(f.mobile) || !isEmail(f.email)) {
      toast.error("Please enter a valid name, 10-digit mobile number and email");
      return;
    }
    customerDb.set(() => ({ name: f.name.trim(), mobile: f.mobile.trim(), email: f.email.trim() }));
    toast.success("Profile saved on this device");
  };

  const last = orders[0];

  return (
    <SiteLayout>
      <PageHeader
        eyebrow="Account"
        title={
          hydrated && (c?.name || user?.displayName)
            ? `Hello, ${(c?.name || user?.displayName || "").split(" ")[0]}`
            : "My account"
        }
      >
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your saved profile, delivery addresses, and Cash on Delivery order history.
        </p>
      </PageHeader>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 md:grid-cols-3">
        {/* Account & Cloud Sync Banner */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:col-span-3">
          {hydrated && !loading && (
            <div>
              {user ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="h-12 w-12 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold font-semibold">
                        {(user.displayName || user.email || "U")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl">{user.displayName || "Shopper"}</h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Cloud Synced
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Your wishlist is synced in real time to your Cloud SQL account.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      disabled={syncing}
                      onClick={() => void syncWishlistNow()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium hover:border-gold disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${syncing ? "animate-spin text-gold" : ""}`}
                      />
                      <span>{syncing ? "Syncing..." : "Sync wishlist"}</span>
                    </button>
                    <button
                      onClick={() => void signOut()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 sm:items-center">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <Cloud className="h-6 w-6" />
                    </span>
                    <div>
                      <h2 className="font-display text-xl">Cloud Wishlist & Account</h2>
                      <p className="text-xs text-muted-foreground">
                        Sign in with Google to sync your wishlist across your phone, tablet and
                        desktop.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => void signInWithGoogle()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-xs font-semibold text-black hover:opacity-95"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Sign in with Google</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <Tile to="/orders" icon={<Package />} label="Orders" value={hydrated ? orders.length : 0} />
        <Tile
          to="/wishlist"
          icon={<Heart />}
          label="Wishlist"
          value={hydrated ? wishlist.length : 0}
        />
        <Tile to="/cart" icon={<ShoppingBag />} label="Saved cart" value={hydrated ? count : 0} />

        <form
          onSubmit={save}
          noValidate
          className="space-y-3 rounded-xl border border-border bg-card p-6 md:col-span-2"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Profile</h2>
            <span className="text-xs text-muted-foreground">Cash on Delivery details</span>
          </div>
          <input
            aria-label="Full name"
            placeholder="Full name"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            className={inputCls}
          />
          <input
            aria-label="Mobile number"
            type="tel"
            placeholder="Mobile number"
            value={f.mobile}
            onChange={(e) => setF({ ...f, mobile: e.target.value })}
            className={inputCls}
          />
          <input
            aria-label="Email"
            type="email"
            placeholder="Email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
            className={inputCls}
          />
          <button className={btnPrimary}>Save profile</button>
        </form>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-display text-2xl">Last delivery address</h2>
          {hydrated && last ? (
            <p className="mt-2 text-sm text-muted-foreground">
              {last.address.house}, {last.address.street}
              <br />
              {last.address.city}, {last.address.state} – {last.address.pin}
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              No address yet — it's saved when you place an order.
            </p>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function Tile({
  to,
  icon,
  label,
  value,
}: {
  to: "/orders" | "/wishlist" | "/cart";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:border-gold"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-gold [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </span>
      <span>
        <span className="block text-2xl font-semibold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}
