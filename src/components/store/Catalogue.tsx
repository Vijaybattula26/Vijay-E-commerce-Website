import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  PackageSearch,
  X,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ProductGrid } from "./ProductCard";
import { EmptyState, inputCls } from "./SiteLayout";
import { filterProducts, type SortKey } from "@/lib/commerce";
import { useCategories, useProducts } from "@/lib/db";
import { formatPrice, type CategoryId } from "@/lib/products";
import { cn } from "@/lib/utils";

export interface CatalogueSearch {
  q?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  stock?: boolean | undefined;
  size?: string | undefined;
  color?: string | undefined;
  sort?: SortKey | undefined;
  cat?: CategoryId | undefined;
}

const SORTS: [SortKey, string][] = [
  ["featured", "Featured"],
  ["price-asc", "Price: Low to High"],
  ["price-desc", "Price: High to Low"],
  ["newest", "Newest First"],
  ["name", "Name: A to Z"],
];

const PRICE_PRESETS: { label: string; min?: number; max?: number }[] = [
  { label: "Under ₹1,500", max: 1500 },
  { label: "₹1,500 – ₹3,000", min: 1500, max: 3000 },
  { label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { label: "Above ₹6,000", min: 6000 },
];

export function parseCatalogueSearch(s: Record<string, unknown>): CatalogueSearch {
  const num = (v: unknown) =>
    v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v);
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  const sort = str(s["sort"]);
  return {
    q: str(s["q"]),
    min: num(s["min"]),
    max: num(s["max"]),
    stock: s["stock"] === true || s["stock"] === "true" ? true : undefined,
    size: str(s["size"]),
    color: str(s["color"]),
    sort: SORTS.some(([k]) => k === sort) ? (sort as SortKey) : undefined,
    cat: str(s["cat"]) as CategoryId | undefined,
  };
}

/** Search + smart category filters + sort UI. `fixedCategory` locks the category on category pages. */
export function Catalogue({
  search,
  fixedCategory,
}: {
  search: CatalogueSearch;
  fixedCategory?: CategoryId;
}) {
  const navigate = useNavigate();
  const products = useProducts();
  const categories = useCategories();
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [q, setQ] = useState(search.q ?? "");
  const category = fixedCategory ?? search.cat;

  const update = (patch: Partial<CatalogueSearch>) =>
    void navigate({
      to: ".",
      search: (prev: CatalogueSearch) => ({ ...prev, ...patch }),
      replace: true,
    });

  // Base active catalogue pool
  const pool = useMemo(
    () => products.filter((p) => p.active && (!category || p.category === category)),
    [products, category],
  );

  // Available unique sizes and colors in the current scope
  const sizes = useMemo(() => [...new Set(pool.flatMap((p) => p.sizes))].sort(), [pool]);
  const colors = useMemo(() => [...new Set(pool.flatMap((p) => p.colors))].sort(), [pool]);

  // Dynamic filter counts
  const counts = useMemo(() => {
    const activeProducts = products.filter((p) => p.active);
    const catCounts: Record<string, number> = {};
    for (const c of categories) {
      catCounts[c.id] = activeProducts.filter((p) => p.category === c.id).length;
    }

    const sizeCounts: Record<string, number> = {};
    for (const s of sizes) {
      sizeCounts[s] = pool.filter((p) => p.sizes.includes(s)).length;
    }

    const colorCounts: Record<string, number> = {};
    for (const col of colors) {
      colorCounts[col] = pool.filter((p) => p.colors.includes(col)).length;
    }

    const inStockCount = pool.filter((p) => p.stock > 0).length;

    return {
      all: activeProducts.length,
      categories: catCounts,
      sizes: sizeCounts,
      colors: colorCounts,
      inStock: inStockCount,
    };
  }, [products, categories, sizes, colors, pool]);

  // Filtered results
  const results = useMemo(
    () =>
      filterProducts(
        products,
        { ...search, category, inStock: search.stock },
        (id) => categories.find((c) => c.id === id)?.name ?? id,
      ),
    [products, categories, search, category],
  );

  // Whether any filter is actively applied
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (search.q) count++;
    if (search.min != null || search.max != null) count++;
    if (search.stock) count++;
    if (search.size) count++;
    if (search.color) count++;
    if (!fixedCategory && search.cat) count++;
    return count;
  }, [search, fixedCategory]);

  const clearAllFilters = () => {
    setQ("");
    void navigate({
      to: ".",
      search: fixedCategory ? { sort: search.sort } : {},
      replace: true,
    });
  };

  const removeFilter = (key: keyof CatalogueSearch) => {
    if (key === "q") setQ("");
    if (key === "min" || key === "max") {
      update({ min: undefined, max: undefined });
    } else {
      update({ [key]: undefined });
    }
  };

  const handlePricePreset = (preset: { min?: number; max?: number }) => {
    const isCurrent = search.min === preset.min && search.max === preset.max;
    if (isCurrent) {
      update({ min: undefined, max: undefined });
    } else {
      update({ min: preset.min, max: preset.max });
    }
  };

  // Shared Filter controls component
  const FilterControls = () => (
    <div className="space-y-6">
      {/* Category Filter (if not on a fixed category page) */}
      {!fixedCategory && (
        <FilterGroup title="Categories">
          <div className="space-y-1.5">
            <button
              onClick={() => update({ cat: undefined, size: undefined, color: undefined })}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                !search.cat
                  ? "bg-gold/15 font-semibold text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <span>All Categories</span>
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">
                {counts.all}
              </span>
            </button>
            {categories.map((c) => {
              const count = counts.categories[c.id] ?? 0;
              const isSelected = search.cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    update({
                      cat: isSelected ? undefined : c.id,
                      size: undefined,
                      color: undefined,
                    })
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left",
                    isSelected
                      ? "bg-gold/15 font-semibold text-gold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  <span>{c.name}</span>
                  <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Price Range */}
      <FilterGroup title="Price Range (₹)">
        <div className="space-y-3">
          {/* Quick Price Bracket Chips */}
          <div className="grid grid-cols-2 gap-1.5">
            {PRICE_PRESETS.map((p) => {
              const isSelected = search.min === p.min && search.max === p.max;
              return (
                <button
                  key={p.label}
                  onClick={() => handlePricePreset(p)}
                  className={cn(
                    "rounded-lg border px-2 py-1.5 text-[11px] text-center transition-colors truncate",
                    isSelected
                      ? "border-gold bg-gold/15 font-semibold text-gold"
                      : "border-border text-muted-foreground hover:border-gold hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Min / Max Inputs */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Min"
                aria-label="Minimum price"
                value={search.min ?? ""}
                onChange={(e) =>
                  update({ min: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                className={cn(inputCls, "pl-6 text-xs")}
              />
            </div>
            <span className="text-xs text-muted-foreground">–</span>
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ₹
              </span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Max"
                aria-label="Maximum price"
                value={search.max ?? ""}
                onChange={(e) =>
                  update({ max: e.target.value === "" ? undefined : Number(e.target.value) })
                }
                className={cn(inputCls, "pl-6 text-xs")}
              />
            </div>
          </div>
        </div>
      </FilterGroup>

      {/* Availability */}
      <FilterGroup title="Availability">
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-2.5 text-xs hover:border-gold transition-colors">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!search.stock}
              onChange={(e) => update({ stock: e.target.checked || undefined })}
              className="h-4 w-4 rounded accent-gold"
            />
            <span className="text-foreground font-medium">In stock only</span>
          </div>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            {counts.inStock}
          </span>
        </label>
      </FilterGroup>

      {/* Size Filter */}
      {sizes.length > 0 && (
        <FilterGroup title="Size">
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => {
              const isSelected = search.size === s;
              const sizeCount = counts.sizes[s] ?? 0;
              return (
                <button
                  key={s}
                  onClick={() => update({ size: isSelected ? undefined : s })}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border text-foreground hover:border-gold",
                  )}
                >
                  <span>{s}</span>
                  <span className="opacity-60 text-[10px]">({sizeCount})</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Colour Filter */}
      {colors.length > 0 && (
        <FilterGroup title="Colour">
          <div className="flex flex-wrap gap-1.5">
            {colors.map((col) => {
              const isSelected = search.color === col;
              const colorCount = counts.colors[col] ?? 0;
              return (
                <button
                  key={col}
                  onClick={() => update({ color: isSelected ? undefined : col })}
                  className={cn(
                    "flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground font-medium"
                      : "border-border text-foreground hover:border-gold",
                  )}
                >
                  <span>{col}</span>
                  <span className="opacity-60 text-[10px]">({colorCount})</span>
                </button>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {/* Clear all in sidebar */}
      {activeFiltersCount > 0 && (
        <button
          onClick={clearAllFilters}
          className="w-full rounded-lg border border-border py-2 text-xs font-medium hover:border-gold hover:text-gold transition-colors"
        >
          Clear all filters ({activeFiltersCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Interactive Category Navigation Bar */}
      {!fixedCategory && (
        <div className="mb-6 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2">
            <button
              onClick={() => update({ cat: undefined, size: undefined, color: undefined })}
              className={cn(
                "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-all shadow-sm",
                !search.cat
                  ? "border-gold bg-gold text-gold-foreground font-semibold"
                  : "border-border bg-card text-foreground hover:border-gold hover:bg-gold/5",
              )}
            >
              All Products ({counts.all})
            </button>
            {categories.map((c) => {
              const isSelected = search.cat === c.id;
              const count = counts.categories[c.id] ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() =>
                    update({
                      cat: isSelected ? undefined : c.id,
                      size: undefined,
                      color: undefined,
                    })
                  }
                  className={cn(
                    "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-medium transition-all shadow-sm",
                    isSelected
                      ? "border-gold bg-gold text-gold-foreground font-semibold"
                      : "border-border bg-card text-foreground hover:border-gold hover:bg-gold/5",
                  )}
                >
                  {c.name} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Input, Sort & Filter Trigger Bar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        {/* Search Input */}
        <form
          className="relative flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: q.trim() || undefined });
          }}
        >
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              update({ q: e.target.value.trim() || undefined });
            }}
            placeholder="Search products by name, description or keywords…"
            aria-label="Search catalogue"
            className={cn(inputCls, "pl-10 text-sm")}
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                update({ q: undefined });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              title="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>

        {/* Sort & Mobile Filter Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex-1 md:w-56">
            <select
              value={search.sort ?? "featured"}
              onChange={(e) => update({ sort: e.target.value as SortKey })}
              aria-label="Sort products"
              className={cn(inputCls, "w-full text-xs font-medium")}
            >
              {SORTS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setMobileFilterOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground hover:border-gold md:hidden shadow-sm shrink-0"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="h-4 w-4 text-gold" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="rounded-full bg-gold px-1.5 py-0.2 text-[10px] font-bold text-gold-foreground">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Filter Chips / Pills Bar */}
      {activeFiltersCount > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
          <span className="text-xs font-medium text-muted-foreground mr-1">Active filters:</span>

          {search.q && (
            <FilterPill label={`Search: "${search.q}"`} onRemove={() => removeFilter("q")} />
          )}

          {!fixedCategory && search.cat && (
            <FilterPill
              label={`Category: ${categories.find((c) => c.id === search.cat)?.name ?? search.cat}`}
              onRemove={() => removeFilter("cat")}
            />
          )}

          {(search.min != null || search.max != null) && (
            <FilterPill
              label={`Price: ${search.min ? `₹${search.min}` : "₹0"} – ${search.max ? `₹${search.max}` : "any"}`}
              onRemove={() => removeFilter("min")}
            />
          )}

          {search.stock && (
            <FilterPill label="In stock only" onRemove={() => removeFilter("stock")} />
          )}

          {search.size && (
            <FilterPill label={`Size: ${search.size}`} onRemove={() => removeFilter("size")} />
          )}

          {search.color && (
            <FilterPill label={`Colour: ${search.color}`} onRemove={() => removeFilter("color")} />
          )}

          <button
            onClick={clearAllFilters}
            className="ml-auto text-xs font-medium text-gold underline hover:text-gold/80"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Main Grid: Desktop Sidebar Filters + Product Catalogue */}
      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block self-start rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-display text-base font-semibold text-foreground flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gold" /> Filter Collection
            </h3>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-[11px] text-muted-foreground hover:text-gold underline"
              >
                Reset
              </button>
            )}
          </div>
          <FilterControls />
        </aside>

        {/* Mobile Filter Sheet Drawer */}
        <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
          <SheetContent side="right" className="w-80 flex flex-col p-0">
            <SheetHeader className="p-4 border-b border-border">
              <SheetTitle className="flex items-center justify-between">
                <span className="font-display text-lg flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-gold" /> Filter Collection
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-gold underline font-normal"
                  >
                    Clear all ({activeFiltersCount})
                  </button>
                )}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4">
              <FilterControls />
            </div>

            <div className="border-t border-border p-4 bg-card flex items-center gap-3">
              <button
                onClick={clearAllFilters}
                disabled={activeFiltersCount === 0}
                className="flex-1 rounded-lg border border-border py-2.5 text-xs font-medium hover:bg-secondary disabled:opacity-40"
              >
                Clear All
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Show {results.length} Results
              </button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Product Catalogue Grid */}
        <div>
          <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground">
            <p aria-live="polite">
              Showing <strong className="text-foreground">{results.length}</strong> of {pool.length}{" "}
              items
              {category && (
                <span> in {categories.find((c) => c.id === category)?.name ?? category}</span>
              )}
            </p>
            <span className="text-[11px] text-gold font-medium">Cash on Delivery on all items</span>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={<PackageSearch className="h-10 w-10 text-muted-foreground" />}
              title="No products match your criteria"
              text="Try adjusting your price range, choosing another category, or clearing active filters."
              action={
                <button
                  onClick={clearAllFilters}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Clear all filters
                </button>
              }
            />
          ) : (
            <ProductGrid items={results} />
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold tracking-widest text-gold uppercase">{title}</p>
      {children}
    </div>
  );
}

function FilterPill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-xs text-foreground font-medium">
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 hover:bg-gold/20 text-muted-foreground hover:text-foreground"
        title="Remove filter"
        aria-label={`Remove filter ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
