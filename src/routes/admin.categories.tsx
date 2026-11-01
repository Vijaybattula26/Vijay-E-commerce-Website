import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminTitle, Card } from "@/components/admin/ui";
import { inputCls } from "@/components/store/SiteLayout";
import { categoriesDb, useCategories, useProducts } from "@/lib/db";

export const Route = createFileRoute("/admin/categories")({
  component: Categories,
});

function Categories() {
  const categories = useCategories();
  const products = useProducts();
  return (
    <>
      <AdminTitle title="Categories" />
      <p className="-mt-4 mb-6 text-sm text-muted-foreground">
        Edit category names, descriptions and cover images. The six category links stay fixed.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex gap-4">
            <img src={c.image} alt={c.name} className="h-24 w-24 rounded-lg object-cover" />
            <form
              className="flex-1 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const name = String(fd.get("name") ?? "").trim();
                const image = String(fd.get("image") ?? "").trim();
                if (name.length < 2) {
                  toast.error("Enter a name");
                  return;
                }
                categoriesDb.set((cs) =>
                  cs.map((x) =>
                    x.id === c.id
                      ? {
                          ...x,
                          name,
                          blurb: String(fd.get("blurb") ?? ""),
                          image: image || x.image,
                        }
                      : x,
                  ),
                );
                toast.success("Category saved");
              }}
            >
              <input
                name="name"
                defaultValue={c.name}
                aria-label="Category name"
                className={inputCls}
              />
              <input
                name="blurb"
                defaultValue={c.blurb}
                aria-label="Category description"
                className={inputCls}
              />
              <input
                name="image"
                defaultValue={c.image}
                aria-label="Cover image URL"
                className={inputCls}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {products.filter((p) => p.category === c.id).length} products
                </span>
                <button className="rounded-lg bg-primary px-4 py-2 text-xs text-primary-foreground">
                  Save
                </button>
              </div>
            </form>
          </Card>
        ))}
      </div>
    </>
  );
}
