import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Clock, Package, RotateCcw, Truck, XCircle } from "lucide-react";
import { AdminTitle, Card } from "@/components/admin/ui";
import {
  OrderDetails,
  StatusBadge,
  PaymentStatusBadge,
  fmtDate,
} from "@/components/store/OrderDetails";
import { ConfirmButton } from "@/components/store/ConfirmButton";
import { inputCls } from "@/components/store/SiteLayout";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/commerce";
import { updateOrderStatus, updatePaymentStatus, useOrders } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/admin/orders/$id")({
  component: AdminOrder,
});

function AdminOrder() {
  const { id } = Route.useParams();
  const order = useOrders().find((o) => o.id === id);

  if (!order) {
    return (
      <Card className="py-12 text-center">
        <p className="text-base font-medium">Order not found.</p>
        <Link to="/admin/orders" className="mt-3 inline-block text-sm text-gold underline">
          ← Back to all orders
        </Link>
      </Card>
    );
  }

  const isCollected = order.paymentStatus === "collected";
  const isCancelled = order.status === "Cancelled";

  const handleMarkCollected = () => {
    updatePaymentStatus(order.id, "collected");
    toast.success(`Payment of ${formatPrice(order.total)} marked as Collected!`);
  };

  const handleRevertCollection = () => {
    updatePaymentStatus(order.id, "pending_collection");
    toast.info("Payment status reverted to Pending Collection.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/orders" className="text-xs text-gold hover:underline">
            ← Back to all orders
          </Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="font-display text-2xl font-semibold text-foreground">
              Order {order.id}
            </h1>
            <StatusBadge status={order.status} />
            <PaymentStatusBadge paymentStatus={order.paymentStatus} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Placed on {fmtDate(order.createdAt)} • Cash on Delivery
          </p>
        </div>
      </div>

      {/* Admin Action Center */}
      <Card className="space-y-5 border-gold/30 p-5">
        <div className="border-b border-border pb-3">
          <h2 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" /> Order & Payment Control Panel
          </h2>
          <p className="text-xs text-muted-foreground">
            Update delivery progress and record actual cash collection upon courier receipt.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Section 1: Fulfillment Status */}
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
              1. Fulfillment Progress
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="status"
                value={order.status}
                onChange={(e) => {
                  const nextStatus = e.target.value as OrderStatus;
                  updateOrderStatus(order.id, nextStatus);
                  toast.success(`Order status updated to "${nextStatus}"`);
                }}
                className={`${inputCls} max-w-xs text-sm`}
              >
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {!isCancelled && (
                <ConfirmButton
                  title="Cancel this order?"
                  description="All items will be immediately returned to warehouse inventory stock."
                  confirmLabel="Yes, cancel order"
                  onConfirm={() => {
                    updateOrderStatus(order.id, "Cancelled");
                    toast.success("Order cancelled and inventory restored.");
                  }}
                  className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <XCircle className="inline-block mr-1 h-3.5 w-3.5" /> Cancel Order
                </ConfirmButton>
              )}
            </div>

            {/* Quick Progression Buttons */}
            {!isCancelled && (
              <div className="flex flex-wrap gap-2 pt-1 text-xs">
                {order.status === "Pending" && (
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, "Confirmed");
                      toast.success("Order Confirmed!");
                    }}
                    className="rounded-md bg-secondary px-3 py-1.5 font-medium hover:bg-accent text-foreground"
                  >
                    Confirm Order →
                  </button>
                )}
                {order.status === "Confirmed" && (
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, "Processing");
                      toast.success("Order moved to Processing!");
                    }}
                    className="rounded-md bg-secondary px-3 py-1.5 font-medium hover:bg-accent text-foreground"
                  >
                    Start Processing →
                  </button>
                )}
                {order.status === "Processing" && (
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, "Shipped");
                      toast.success("Order marked as Shipped!");
                    }}
                    className="rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-400 px-3 py-1.5 font-medium hover:bg-blue-500/25"
                  >
                    <Truck className="inline mr-1 h-3.5 w-3.5" /> Mark Shipped →
                  </button>
                )}
                {order.status === "Shipped" && (
                  <button
                    onClick={() => {
                      updateOrderStatus(order.id, "Delivered");
                      toast.success("Order marked as Delivered!");
                    }}
                    className="rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 font-medium hover:bg-emerald-500/25"
                  >
                    <CheckCircle2 className="inline mr-1 h-3.5 w-3.5" /> Mark Delivered →
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 2: COD Payment Collection */}
          <div className="space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>2. Cash on Delivery (COD) Collection</span>
              <span className="font-semibold text-foreground">{formatPrice(order.total)}</span>
            </label>

            {isCollected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    Payment collected: {formatPrice(order.total)}
                  </span>
                </div>
                {order.collectedAt && (
                  <p className="text-xs text-muted-foreground">
                    Recorded on {fmtDate(order.collectedAt)}
                  </p>
                )}
                <button
                  onClick={handleRevertCollection}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground underline"
                >
                  <RotateCcw className="h-3 w-3" /> Revert to Pending Collection
                </button>
              </div>
            ) : isCancelled ? (
              <p className="text-xs text-muted-foreground">
                This order was cancelled. No payment collection is due.
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-muted-foreground">
                  The customer will pay <strong>{formatPrice(order.total)}</strong> in cash or UPI
                  QR upon delivery. Click below only after the courier confirms the payment was
                  collected.
                </p>
                <button
                  type="button"
                  onClick={handleMarkCollected}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Banknote className="h-4 w-4" /> Mark COD Payment as Collected
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Complete Order Details view */}
      <OrderDetails order={order} />
    </div>
  );
}
