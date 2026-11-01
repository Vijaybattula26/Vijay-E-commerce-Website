import { Link } from "@tanstack/react-router";
import { Banknote, CheckCircle2, Clock, Truck, ShieldAlert } from "lucide-react";
import type { Order, PaymentStatus } from "@/lib/commerce";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: Order["status"] }) {
  const isCancelled = status === "Cancelled";
  const isDelivered = status === "Delivered";
  const isShipped = status === "Shipped";
  const isProcessing = status === "Processing";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
        isCancelled && "bg-destructive/15 text-destructive",
        isDelivered && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold",
        isShipped && "bg-blue-500/15 text-blue-700 dark:text-blue-400",
        isProcessing && "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
        !isCancelled && !isDelivered && !isShipped && !isProcessing && "bg-gold/15 text-gold",
      )}
    >
      {isDelivered ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : isShipped ? (
        <Truck className="h-3 w-3" />
      ) : (
        <Clock className="h-3 w-3" />
      )}
      {status}
    </span>
  );
}

export function PaymentStatusBadge({
  paymentStatus,
}: {
  paymentStatus?: PaymentStatus | undefined;
}) {
  const status = paymentStatus ?? "pending_collection";

  if (status === "collected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Payment Collected
      </span>
    );
  }

  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-medium text-destructive">
        <ShieldAlert className="h-3 w-3" /> Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
      <Banknote className="h-3 w-3" /> Pending Collection (COD)
    </span>
  );
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

export function OrderDetails({ order }: { order: Order }) {
  const a = order.address;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Info title="Order reference">
          <p className="font-mono text-sm font-semibold text-foreground">{order.id}</p>
          <p className="text-xs text-muted-foreground">{fmtDate(order.createdAt)}</p>
        </Info>
        <Info title="Fulfillment status">
          <div className="mt-1">
            <StatusBadge status={order.status} />
          </div>
        </Info>
        <Info title="Payment">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">Cash on Delivery (COD)</p>
            <div>
              <PaymentStatusBadge paymentStatus={order.paymentStatus} />
            </div>
            {order.collectedAt && (
              <p className="text-[11px] text-muted-foreground">
                Collected: {fmtDate(order.collectedAt)}
              </p>
            )}
          </div>
        </Info>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Info title="Customer details">
          <p className="text-sm font-medium text-foreground">{order.customer.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mobile:{" "}
            <a href={`tel:${order.customer.mobile}`} className="hover:text-gold">
              {order.customer.mobile}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">
            Email:{" "}
            <a href={`mailto:${order.customer.email}`} className="hover:text-gold">
              {order.customer.email}
            </a>
          </p>
        </Info>
        <Info title="Delivery address">
          <p className="text-sm text-foreground">
            {a.house}, {a.street}
            {a.landmark ? `, near ${a.landmark}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {a.city}, {a.state} – {a.pin}
          </p>
          <p className="text-[11px] text-gold mt-1">
            Delivery mode: {order.delivery === "express" ? "Express Dispatch" : "Standard Delivery"}
          </p>
        </Info>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-4">
          <h3 className="font-display text-lg">
            Order items ({order.items.reduce((s, i) => s + i.qty, 0)})
          </h3>
        </div>
        <ul className="divide-y divide-border">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-center gap-4 p-4">
              <img
                src={i.image}
                alt={i.name}
                className="h-16 w-16 rounded-lg object-cover border border-border"
              />
              <div className="flex-1">
                <Link
                  to="/product/$id"
                  params={{ id: i.productId }}
                  className="font-medium hover:text-gold"
                >
                  {i.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {[i.size && `Size ${i.size}`, i.color].filter(Boolean).join(" · ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatPrice(i.price)} × {i.qty}
                </p>
              </div>
              <span className="font-semibold text-foreground">{formatPrice(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-1.5 border-t border-border p-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Delivery</span>
            <span>{order.deliveryFee ? formatPrice(order.deliveryFee) : "Free"}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-border text-base font-semibold text-foreground">
            <span>Amount to pay at delivery</span>
            <span className="text-gold">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="mb-1.5 text-[11px] tracking-widest text-gold uppercase font-semibold">
        {title}
      </p>
      {children}
    </div>
  );
}

export function CodInstructions({ order }: { order?: Order }) {
  return (
    <div className="rounded-xl border border-gold/40 bg-gold/5 p-5 text-sm space-y-2">
      <div className="flex items-center gap-2">
        <Banknote className="h-5 w-5 text-gold shrink-0" />
        <h3 className="font-semibold text-foreground text-base">Cash on Delivery Instructions</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Your order is placed under <strong>Cash on Delivery (COD)</strong>.
        {order ? (
          <>
            {" "}
            Please keep exact cash of <strong>{formatPrice(order.total)}</strong> or prepare your
            mobile UPI app to scan the courier associate's QR code upon delivery.
          </>
        ) : (
          <>
            {" "}
            Please keep the total order amount ready in cash or digital UPI upon doorstep delivery.
          </>
        )}
      </p>
      <div className="grid gap-2 sm:grid-cols-3 pt-2 text-xs border-t border-gold/20">
        <div>
          <span className="font-medium text-foreground block">1. Verification</span>
          <span className="text-muted-foreground">
            Our team confirms your order before dispatch.
          </span>
        </div>
        <div>
          <span className="font-medium text-foreground block">2. Fast Dispatch</span>
          <span className="text-muted-foreground">
            Shipped with secure tamper-evident packaging.
          </span>
        </div>
        <div>
          <span className="font-medium text-foreground block">3. Doorstep Payment</span>
          <span className="text-muted-foreground">
            Pay cash or UPI scan when parcel is handed over.
          </span>
        </div>
      </div>
    </div>
  );
}

/** Backward compatibility alias */
export function DemoNotice() {
  return <CodInstructions />;
}
