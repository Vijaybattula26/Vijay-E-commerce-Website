import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminTitle, Card, Stat } from "@/components/admin/ui";
import { StatusBadge, fmtDate } from "@/components/store/OrderDetails";
import { ORDER_STATUSES } from "@/lib/commerce";
import { useOrders, useProducts } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const products = useProducts();
  const orders = useOrders();
  const live = orders.filter((o) => o.status !== "Cancelled");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const customers = new Set(orders.map((o) => o.customer.email)).size;
  const low = products.filter((p) => p.stock > 0 && p.stock <= 3);
  const out = products.filter((p) => p.stock === 0);

  return (
    <>
      <AdminTitle title="Dashboard overview" />
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        Real-time overview of Cash on Delivery orders, delivery stages, and warehouse inventory.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Active Products"
          value={products.length}
          note={`${products.filter((p) => p.active).length} visible in storefront`}
        />
        <Stat
          label="Total Orders"
          value={orders.length}
          note={`${live.length} active · ${orders.length - live.length} cancelled`}
        />
        <Stat
          label="COD Orders Value"
          value={formatPrice(revenue)}
          note={`${orders.filter((o) => o.paymentStatus === "collected").length} payments collected`}
        />
        <Stat label="Customers" value={customers} note="Unique customer profiles" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex justify-between">
            <h2 className="font-display text-xl">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs text-gold underline">
              View all
            </Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders placed yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <Link
                    to="/admin/orders/$id"
                    params={{ id: o.id }}
                    className="flex items-center gap-3 py-2.5 text-sm hover:text-gold"
                  >
                    <span className="flex-1">
                      <span className="block font-mono text-xs">{o.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {o.customer.name} · {fmtDate(o.createdAt)}
                      </span>
                    </span>
                    <StatusBadge status={o.status} />
                    <span className="w-20 text-right font-medium">{formatPrice(o.total)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="mb-3 flex justify-between">
            <h2 className="font-display text-xl">Stock alerts</h2>
            <Link to="/admin/inventory" className="text-xs text-gold underline">
              Inventory
            </Link>
          </div>
          {low.length + out.length === 0 ? (
            <p className="text-sm text-muted-foreground">All products are well stocked.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...out, ...low].map((p) => (
                <li key={p.id} className="flex justify-between">
                  <Link to="/admin/products/$id" params={{ id: p.id }} className="hover:text-gold">
                    {p.name}
                  </Link>
                  <span className={p.stock === 0 ? "text-destructive" : "text-gold"}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="mb-3 font-display text-xl">Orders by status</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="rounded-lg bg-secondary p-3 text-center">
                <p className="text-2xl font-semibold">
                  {orders.filter((o) => o.status === s).length}
                </p>
                <p className="text-xs text-muted-foreground">{s}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
