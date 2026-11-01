import { createFileRoute } from "@tanstack/react-router";
import { AdminTitle, Card } from "@/components/admin/ui";
import { fmtDate } from "@/components/store/OrderDetails";
import { useOrders } from "@/lib/db";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/admin/customers")({
  component: Customers,
});

function Customers() {
  const orders = useOrders();
  const map = new Map<
    string,
    {
      name: string;
      email: string;
      mobile: string;
      city: string;
      orders: number;
      total: number;
      last: string;
    }
  >();
  for (const o of orders) {
    const k = o.customer.email.toLowerCase();
    const c = map.get(k) ?? {
      ...o.customer,
      city: o.address.city,
      orders: 0,
      total: 0,
      last: o.createdAt,
    };
    c.orders += 1;
    if (o.status !== "Cancelled") c.total += o.total;
    if (o.createdAt > c.last) c.last = o.createdAt;
    map.set(k, c);
  }
  const list = [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  return (
    <>
      <AdminTitle title="Customers" />
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        Built from demo orders placed in this browser.
      </p>
      {list.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">No customers yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-secondary text-left text-xs text-muted-foreground uppercase">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Contact</th>
                <th className="p-3">City</th>
                <th className="p-3">Orders</th>
                <th className="p-3">Order value</th>
                <th className="p-3">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map((c) => (
                <tr key={c.email}>
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-xs">
                    {c.email}
                    <br />
                    {c.mobile}
                  </td>
                  <td className="p-3">{c.city}</td>
                  <td className="p-3">{c.orders}</td>
                  <td className="p-3">{formatPrice(c.total)}</td>
                  <td className="p-3 text-xs">{fmtDate(c.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
