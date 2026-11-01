import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTitle, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/store/ConfirmButton";
import { btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { productsDb, useCategories, useProducts } from "@/lib/db";
import { formatPrice } from "@/lib/products";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/products/")({
  component: ManageProducts,
});

function ManageProducts() {
  const products = useProducts();
  const categories = useCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const list = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!q || `${p.name} ${p.sku}`.toLowerCase().includes(q.toLowerCase())),
  );

  return (
    <>
      <AdminTitle title="Products">
        <Link to="/admin/products/new" className={btnPrimary}>
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </AdminTitle>
      <Card className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or SKU"
          aria-label="Search products"
          className={inputCls}
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value)}
          aria-label="Filter by category"
          className={cn(inputCls, "sm:w-56")}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Card>
      <p className="mb-2 text-sm text-muted-foreground">{list.length} products</p>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img src={p.images[0]} alt="" className="h-10 w-10 rounded object-cover" />
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td className="p-3">{categories.find((c) => c.id === p.category)?.name}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className={cn("p-3", p.stock === 0 && "text-destructive")}>{p.stock}</td>
                <td className="p-3">{p.active ? "Visible" : "Hidden"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <button
                      aria-label={p.featured ? "Unmark featured" : "Mark featured"}
                      title="Featured"
                      onClick={() =>
                        productsDb.set((ps) =>
                          ps.map((x) => (x.id === p.id ? { ...x, featured: !x.featured } : x)),
                        )
                      }
                      className="rounded p-2 hover:bg-secondary"
                    >
                      <Star className={cn("h-4 w-4", p.featured && "fill-gold text-gold")} />
                    </button>
                    <Link
                      to="/admin/products/$id"
                      params={{ id: p.id }}
                      aria-label={`Edit ${p.name}`}
                      className="rounded p-2 hover:bg-secondary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <ConfirmButton
                      ariaLabel={`Delete ${p.name}`}
                      title={`Delete "${p.name}"?`}
                      description="This removes the product from the store on this device. Existing orders keep their copy of the item."
                      confirmLabel="Delete"
                      onConfirm={() => {
                        productsDb.set((ps) => ps.filter((x) => x.id !== p.id));
                        toast.success("Product deleted");
                      }}
                      className="rounded p-2 text-destructive hover:bg-secondary"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
