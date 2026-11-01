import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AdminTitle } from "@/components/admin/ui";
import { inputCls } from "@/components/store/SiteLayout";
import { productsDb, useProducts } from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/inventory")({
  component: Inventory,
});

function Inventory() {
  const products = useProducts();
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");
  const list = products.filter((p) =>
    filter === "out" ? p.stock === 0 : filter === "low" ? p.stock > 0 && p.stock <= 3 : true,
  );
  const setStock = (id: string, stock: number) => {
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stock must be 0 or more");
      return;
    }
    productsDb.set((ps) => ps.map((p) => (p.id === id ? { ...p, stock } : p)));
  };
  return (
    <>
      <AdminTitle title="Inventory">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-sm">
          {(["all", "low", "out"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={cn(
                "rounded-md px-3 py-1.5",
                filter === k && "bg-primary text-primary-foreground",
              )}
            >
              {k === "all" ? "All" : k === "low" ? "Low stock" : "Out of stock"}
            </button>
          ))}
        </div>
      </AdminTitle>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-secondary text-left text-xs text-muted-foreground uppercase">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Update</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.map((p) => (
              <tr key={p.id}>
                <td className="p-3">{p.name}</td>
                <td className="p-3 font-mono text-xs">{p.sku}</td>
                <td
                  className={cn(
                    "p-3 font-medium",
                    p.stock === 0 ? "text-destructive" : p.stock <= 3 ? "text-gold" : "",
                  )}
                >
                  {p.stock}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label={`Decrease stock of ${p.name}`}
                      onClick={() => setStock(p.id, Math.max(0, p.stock - 1))}
                      className="h-8 w-8 rounded border border-border"
                    >
                      −
                    </button>
                    <input
                      key={p.stock}
                      type="number"
                      min={0}
                      defaultValue={p.stock}
                      aria-label={`Stock for ${p.name}`}
                      onBlur={(e) =>
                        Number(e.target.value) !== p.stock && setStock(p.id, Number(e.target.value))
                      }
                      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                      className={cn(inputCls, "w-20 py-1.5")}
                    />
                    <button
                      aria-label={`Increase stock of ${p.name}`}
                      onClick={() => setStock(p.id, p.stock + 1)}
                      className="h-8 w-8 rounded border border-border"
                    >
                      +
                    </button>
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
