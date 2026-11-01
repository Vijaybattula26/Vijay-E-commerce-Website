import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Card, fileToDataUrl } from "./ui";
import { btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { productsDb, useCategories } from "@/lib/db";
import type { CategoryId, Product } from "@/lib/products";

const split = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const categories = useCategories();
  const [f, setF] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? ("jewellery" as CategoryId),
    price: String(product?.price ?? ""),
    originalPrice: product?.originalPrice ? String(product.originalPrice) : "",
    stock: String(product?.stock ?? "10"),
    sku: product?.sku ?? "",
    sizes: product?.sizes.join(", ") ?? "",
    colors: product?.colors.join(", ") ?? "",
    active: product?.active ?? true,
    featured: product?.featured ?? false,
  });
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [url, setUrl] = useState("");

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({
        ...f,
        [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value,
      });

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(f.price);
    const stock = Number(f.stock);
    const orig = f.originalPrice ? Number(f.originalPrice) : undefined;
    if (f.name.trim().length < 2) {
      toast.error("Enter a product name");
      return;
    }
    if (!(price > 0)) {
      toast.error("Enter a valid selling price");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      toast.error("Stock must be a whole number, 0 or more");
      return;
    }
    if (orig !== undefined && !(orig > price)) {
      toast.error("Original price must be higher than selling price");
      return;
    }
    if (images.length === 0) {
      toast.error("Add at least one image");
      return;
    }
    const sku =
      f.sku.trim() ||
      `${f.category.slice(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    if (productsDb.get().some((p) => p.sku === sku && p.id !== product?.id)) {
      toast.error("SKU already used by another product");
      return;
    }

    const data: Product = {
      id: product?.id ?? `p${Date.now().toString(36)}`,
      name: f.name.trim(),
      description: f.description.trim(),
      category: f.category,
      price,
      originalPrice: orig,
      stock,
      sku,
      sizes: split(f.sizes),
      colors: split(f.colors),
      active: f.active,
      featured: f.featured,
      images,
      popularity: product?.popularity ?? 50,
      tags: product?.tags ?? ["new"],
      collection: product?.collection,
      createdAt: product?.createdAt ?? Date.now(),
    };
    productsDb.set((ps) =>
      product ? ps.map((p) => (p.id === product.id ? data : p)) : [data, ...ps],
    );
    toast.success(product ? "Product updated" : "Product added");
    void navigate({ to: "/admin/products" });
  };

  return (
    <form onSubmit={save} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="grid gap-4 sm:grid-cols-2">
        <L label="Product name" className="sm:col-span-2">
          <input value={f.name} onChange={set("name")} className={inputCls} />
        </L>
        <L label="Description" className="sm:col-span-2">
          <textarea
            rows={4}
            value={f.description}
            onChange={set("description")}
            className={inputCls}
          />
        </L>
        <L label="Category">
          <select value={f.category} onChange={set("category")} className={inputCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </L>
        <L label="SKU">
          <input
            value={f.sku}
            onChange={set("sku")}
            placeholder="Auto if blank"
            className={inputCls}
          />
        </L>
        <L label="Selling price (₹)">
          <input
            type="number"
            min={1}
            value={f.price}
            onChange={set("price")}
            className={inputCls}
          />
        </L>
        <L label="Original price (₹, optional)">
          <input
            type="number"
            min={1}
            value={f.originalPrice}
            onChange={set("originalPrice")}
            className={inputCls}
          />
        </L>
        <L label="Stock available">
          <input
            type="number"
            min={0}
            step={1}
            value={f.stock}
            onChange={set("stock")}
            className={inputCls}
          />
        </L>
        <div />
        <L label="Sizes (comma separated)">
          <input
            value={f.sizes}
            onChange={set("sizes")}
            placeholder="S, M, L"
            className={inputCls}
          />
        </L>
        <L label="Colours (comma separated)">
          <input
            value={f.colors}
            onChange={set("colors")}
            placeholder="Black, Gold"
            className={inputCls}
          />
        </L>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.active}
            onChange={set("active")}
            className="h-4 w-4 accent-primary"
          />{" "}
          Visible in store
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.featured}
            onChange={set("featured")}
            className="h-4 w-4 accent-primary"
          />{" "}
          Featured product
        </label>
      </Card>

      <div className="space-y-4">
        <Card>
          <p className="mb-3 text-sm font-medium">Images</p>
          <div className="grid grid-cols-3 gap-2">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                <img src={src} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() => setImages(images.filter((_, k) => k !== i))}
                  className="absolute top-1 right-1 rounded-full bg-background/90 p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted-foreground hover:border-gold">
              <ImagePlus className="mb-1 h-5 w-5" /> Upload
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  try {
                    const urls = await Promise.all(files.map((x) => fileToDataUrl(x)));
                    setImages((im) => [...im, ...urls]);
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="…or paste image URL"
              aria-label="Image URL"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => {
                if (/^https?:\/\//.test(url)) {
                  setImages([...images, url]);
                  setUrl("");
                } else toast.error("Enter a valid https:// URL");
              }}
              className="rounded-lg border border-border px-3 text-sm"
            >
              Add
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Uploaded images are resized and saved in this browser.
          </p>
        </Card>
        <button className={`${btnPrimary} w-full py-4`}>
          {product ? "Save changes" : "Add product"}
        </button>
      </div>
    </form>
  );
}

function L({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm ${className ?? ""}`}>
      <span className="mb-1 block font-medium">{label}</span>
      {children}
    </label>
  );
}
