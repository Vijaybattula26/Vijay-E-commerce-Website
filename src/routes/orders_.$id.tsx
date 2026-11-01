import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, btnPrimary } from "@/components/store/SiteLayout";
import { CodInstructions, OrderDetails } from "@/components/store/OrderDetails";
import { useOrders } from "@/lib/db";
import { useHydrated } from "@/lib/store";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/orders_/$id")({
  head: () =>
    seo("Order details", "Details of your order at THE VIJAY STORE.", { robots: "noindex" }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const hydrated = useHydrated();
  const orders = useOrders();
  const order = orders.find((o) => o.id === id);

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/orders" className="text-sm text-gold underline underline-offset-4">
          ← All orders
        </Link>
        {!hydrated ? null : !order ? (
          <div className="py-16 text-center">
            <h1 className="font-display text-3xl">Order not found</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              We couldn't find an order matching reference "{id}".
            </p>
            <Link to="/orders" className={`${btnPrimary} mt-6`}>
              Back to orders
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-4">
              <h1 className="font-display text-3xl md:text-4xl">Order {order.id}</h1>
              <span className="text-xs text-muted-foreground">Cash on Delivery</span>
            </div>
            <CodInstructions order={order} />
            <OrderDetails order={order} />
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
