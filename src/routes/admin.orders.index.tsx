import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Banknote, CheckCircle2, Clock, Filter } from "lucide-react";
import { AdminTitle, Card } from "@/components/admin/ui";
import { StatusBadge, PaymentStatusBadge, fmtDate } from "@/components/store/OrderDetails";
import { inputCls } from "@/components/store/SiteLayout";
import { ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/commerce";
import { useOrders } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/orders/")({
  component: Orders,
});

function Orders() {
  const orders = useOrders();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const term = q.toLowerCase().trim();
  const list = orders.filter(
    (o) =>
      (!status || o.status === status) &&
      (!paymentStatus || o.paymentStatus === paymentStatus) &&
      (!term ||
        [o.id, o.customer.name, o.customer.email, o.customer.mobile].some((v) =>
          v.toLowerCase().includes(term),
        )),
  );

  // Metrics
  const totalAmount = orders.reduce((s, o) => s + (o.status !== "Cancelled" ? o.total : 0), 0);
  const pendingCollectionOrders = orders.filter(
    (o) => o.paymentStatus === "pending_collection" && o.status !== "Cancelled",
  );
  const pendingCollectionAmount = pendingCollectionOrders.reduce((s, o) => s + o.total, 0);
  const collectedOrders = orders.filter((o) => o.paymentStatus === "collected");
  const collectedAmount = collectedOrders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <AdminTitle title="Orders & COD Collection" />
          <p className="text-xs text-muted-foreground -mt-4">
            Manage fulfillment, courier dispatches, and Cash on Delivery collections.
          </p>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-gold">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Pending Collection
            </p>
            <p className="text-xl font-bold text-foreground">
              {formatPrice(pendingCollectionAmount)}
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {pendingCollectionOrders.length} orders awaiting delivery
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Collected Cash (COD)
            </p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice(collectedAmount)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {collectedOrders.length} orders settled
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Banknote className="h-6 w-6 text-gold" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-medium">
              Total Orders Volume
            </p>
            <p className="text-xl font-bold text-foreground">{formatPrice(totalAmount)}</p>
            <p className="text-[11px] text-muted-foreground">{orders.length} total orders placed</p>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by Order ID, name, email or mobile..."
            aria-label="Search orders"
            className={inputCls}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by order status"
            className={cn(inputCls, "w-44 text-xs")}
          >
            <option value="">All Fulfillment Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            aria-label="Filter by payment status"
            className={cn(inputCls, "w-44 text-xs")}
          >
            <option value="">All Payment Statuses</option>
            <option value="pending_collection">Pending Collection</option>
            <option value="collected">Payment Collected</option>
            <option value="cancelled">Payment Cancelled</option>
          </select>
        </div>
      </Card>

      {list.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-base font-medium text-foreground">No orders found</p>
          <p className="text-xs text-muted-foreground mt-1">
            {orders.length
              ? "Try adjusting your search query or status filters."
              : "No orders have been placed yet. Place an order through checkout to test the COD flow."}
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground uppercase font-medium">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Date</th>
                <th className="p-3">Amount to Collect</th>
                <th className="p-3">COD Status</th>
                <th className="p-3">Fulfillment</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((o) => (
                <tr key={o.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="p-3">
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      className="font-mono text-xs font-semibold text-gold hover:underline"
                    >
                      {o.id}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className="font-medium text-foreground block">{o.customer.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {o.customer.mobile}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {fmtDate(o.createdAt)}
                  </td>
                  <td className="p-3 font-semibold text-foreground whitespace-nowrap">
                    {formatPrice(o.total)}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <PaymentStatusBadge paymentStatus={o.paymentStatus} />
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <StatusBadge status={o.status} />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <Link
                      to="/admin/orders/$id"
                      params={{ id: o.id }}
                      className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
