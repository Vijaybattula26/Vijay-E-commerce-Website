import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, Package, Search } from "lucide-react";
import {
  PageHeader,
  SiteLayout,
  EmptyState,
  btnPrimary,
  inputCls,
} from "@/components/store/SiteLayout";
import { StatusBadge, PaymentStatusBadge, fmtDate } from "@/components/store/OrderDetails";
import { formatPrice } from "@/lib/products";
import { useHydrated, useMyOrders } from "@/lib/store";
import { useOrders } from "@/lib/db";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/orders")({
  head: () => seo("My orders", "Your order history at THE VIJAY STORE.", { robots: "noindex" }),
  component: OrdersList,
});

function OrdersList() {
  const hydrated = useHydrated();
  const myOrders = useMyOrders();
  const allOrders = useOrders();
  const [search, setSearch] = useState("");

  // Prefer matched profile orders, but if none, show all orders placed on this device
  const baseOrders = myOrders.length > 0 ? myOrders : allOrders;

  const term = search.trim().toLowerCase();
  const displayedOrders = term
    ? allOrders.filter(
        (o) =>
          o.id.toLowerCase().includes(term) ||
          o.customer.mobile.includes(term) ||
          o.customer.email.toLowerCase().includes(term) ||
          o.customer.name.toLowerCase().includes(term),
      )
    : baseOrders;

  return (
    <SiteLayout>
      <PageHeader eyebrow="Account" title="Order history">
        <p className="mt-2 text-sm text-muted-foreground">
          Track fulfillment status and doorstep Cash on Delivery collections.
        </p>
      </PageHeader>

      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        {allOrders.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Order ID (e.g. ORD-...), name or mobile..."
              className={`${inputCls} pl-10 text-sm`}
            />
          </div>
        )}

        {!hydrated ? null : displayedOrders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-10 w-10" />}
            title={term ? "No matching orders found" : "No orders yet"}
            text={
              term
                ? `No orders matched "${search}". Check the Order ID or phone number.`
                : "Your placed Cash on Delivery orders will appear here."
            }
            action={
              <Link to="/shop" className={btnPrimary}>
                Start shopping
              </Link>
            }
          />
        ) : (
          <ul className="space-y-4">
            {displayedOrders.map((o) => (
              <li key={o.id}>
                <Link
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="block rounded-xl border border-border bg-card p-5 hover:border-gold transition-all shadow-soft"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <span className="font-mono text-sm font-semibold text-foreground block">
                        {o.id}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Placed on {fmtDate(o.createdAt)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <PaymentStatusBadge paymentStatus={o.paymentStatus} />
                      <StatusBadge status={o.status} />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {o.items.slice(0, 3).map((i, k) => (
                          <img
                            key={k}
                            src={i.image}
                            alt=""
                            className="h-12 w-12 rounded-lg border-2 border-card object-cover"
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {o.items[0]?.name}
                          {o.items.length > 1 ? ` +${o.items.length - 1} more` : ""}
                        </p>
                        <p className="flex items-center gap-1 mt-0.5">
                          <Banknote className="h-3 w-3 text-gold" /> Cash on Delivery ·{" "}
                          {o.items.reduce((s, i) => s + i.qty, 0)} item(s)
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Amount to pay</p>
                      <p className="text-base font-bold text-foreground">{formatPrice(o.total)}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}
