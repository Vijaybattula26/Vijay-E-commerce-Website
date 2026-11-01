import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, PackageCheck, ShoppingBag } from "lucide-react";
import { SiteLayout, btnOutline, btnPrimary } from "@/components/store/SiteLayout";
import { CodInstructions, OrderDetails } from "@/components/store/OrderDetails";
import { useOrders } from "@/lib/db";
import { useHydrated } from "@/lib/store";
import { formatPrice } from "@/lib/products";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/order-confirmation/$id")({
  head: () =>
    seo("Order Confirmed", "Your Cash on Delivery order confirmation.", { robots: "noindex" }),
  component: Confirmation,
});

function Confirmation() {
  const { id } = Route.useParams();
  const order = useOrders().find((o) => o.id === id);
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <SiteLayout>
        <div className="py-24" />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-12">
        {!order ? (
          <div className="py-16 text-center">
            <h1 className="font-display text-4xl">Order not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't locate this order reference on your current session.
            </p>
            <Link to="/orders" className={`${btnPrimary} mt-6`}>
              View my orders
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h1 className="mt-4 font-display text-4xl md:text-5xl">
                Thank you, {order.customer.name.split(" ")[0]}!
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Your order{" "}
                <span className="font-mono font-semibold text-foreground">{order.id}</span> has been
                confirmed.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1 text-xs font-medium text-gold">
                <span>Payment Method: Cash on Delivery</span>
                <span>•</span>
                <span>Amount: {formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="space-y-6">
              <CodInstructions order={order} />

              <OrderDetails order={order} />

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Link to="/orders" className={btnOutline}>
                  <PackageCheck className="mr-1.5 h-4 w-4" /> View order history
                </Link>
                <Link to="/shop" className={btnPrimary}>
                  <ShoppingBag className="mr-1.5 h-4 w-4" /> Continue shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
