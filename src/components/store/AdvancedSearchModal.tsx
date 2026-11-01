import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, ArrowRight, TrendingUp, Tag, ShoppingBag, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useCategories, useProducts } from "@/lib/db";
import { formatPrice, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const TRENDING_SEARCHES = [
  "Gold Earrings",
  "Chronograph Watch",
  "Linen Shirt",
  "Scented Candle",
  "Silk Scarf",
  "Face Serum",
];

export function AdvancedSearchModal({
  isOpen,
  onClose,
  initialQuery = "",
}: AdvancedSearchModalProps) {
  const [q, setQ] = useState(initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("tvs:recent-searches");
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const products = useProducts();
  const categories = useCategories();
  const navigate = useNavigate();
  const { add } = useStore();

  useEffect(() => {
    if (isOpen) {
      setQ(initialQuery);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen, initialQuery]);

  // Keyboard navigation: Escape closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const next = [
      trimmed,
      ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase()),
    ].slice(0, 5);
    setRecentSearches(next);
    try {
      localStorage.setItem("tvs:recent-searches", JSON.stringify(next));
    } catch {
      // storage unavailable or full
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem("tvs:recent-searches");
    } catch {
      // storage unavailable
    }
  };

  const term = q.trim().toLowerCase();

  // Matched categories
  const matchedCategories = useMemo(() => {
    if (!term) return [];
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.blurb.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term),
    );
  }, [categories, term]);

  // Matched products
  const matchedProducts = useMemo(() => {
    if (!term) return [];
    return products.filter((p) => {
      if (!p.active) return false;
      const catName = categories.find((c) => c.id === p.category)?.name ?? "";
      return (
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        catName.toLowerCase().includes(term) ||
        p.colors.some((col) => col.toLowerCase().includes(term)) ||
        p.sizes.some((sz) => sz.toLowerCase().includes(term))
      );
    });
  }, [products, categories, term]);

  const handleSelectSearch = (queryText: string) => {
    saveRecentSearch(queryText);
    onClose();
    void navigate({ to: "/shop", search: { q: queryText } });
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const err = add({
      productId: product.id,
      qty: 1,
      size: product.sizes[0],
      color: product.colors[0],
    });
    if (err) {
      toast.error(err);
    } else {
      toast.success(`${product.name} added to cart!`);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search catalogue"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 backdrop-blur-sm sm:pt-20 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-border p-4 bg-secondary/30">
          <Search className="h-5 w-5 text-gold shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && q.trim()) {
                handleSelectSearch(q.trim());
              }
            }}
            placeholder="Search watches, jewellery, clothing, home decor..."
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground text-foreground"
            aria-label="Search query"
          />

          {q && (
            <button
              onClick={() => {
                setQ("");
                inputRef.current?.focus();
              }}
              className="mr-2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Clear search input"
              aria-label="Clear search input"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Content Area */}
        <div className="max-h-[68vh] overflow-y-auto p-4 space-y-5">
          {/* Matched Categories */}
          {matchedCategories.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                <Tag className="h-3 w-3" /> Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {matchedCategories.map((c) => {
                  const count = products.filter((p) => p.active && p.category === c.id).length;
                  return (
                    <Link
                      key={c.id}
                      to="/category/$category"
                      params={{ category: c.id }}
                      onClick={onClose}
                      className="group flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-xs hover:border-gold hover:bg-gold/10 transition-colors"
                    >
                      <span className="font-medium text-foreground group-hover:text-gold">
                        {c.name}
                      </span>
                      <span className="rounded-full bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {count} items
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Results count & Product list */}
          {term ? (
            <div>
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Found <strong className="text-foreground">{matchedProducts.length}</strong>{" "}
                  matching products
                </span>
                {matchedProducts.length > 0 && (
                  <button
                    onClick={() => handleSelectSearch(term)}
                    className="text-gold font-medium hover:underline flex items-center gap-1"
                  >
                    View all in catalogue <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              {matchedProducts.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm font-medium text-foreground">No products matched "{q}"</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Try searching for another category or style like "Watches", "Gold", or "Dress".
                  </p>
                  <button
                    onClick={() => setQ("")}
                    className="mt-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-medium text-gold hover:bg-gold/20 transition-colors"
                  >
                    Clear search query
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                  {matchedProducts.slice(0, 6).map((p) => (
                    <li key={p.id}>
                      <Link
                        to="/product/$id"
                        params={{ id: p.id }}
                        onClick={() => {
                          saveRecentSearch(p.name);
                          onClose();
                        }}
                        className="group flex items-center gap-3.5 p-3 hover:bg-secondary/50 transition-colors"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="h-14 w-14 rounded-lg object-cover border border-border shrink-0 group-hover:border-gold transition-colors"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gold uppercase font-medium">
                              {p.category}
                            </span>
                            {p.stock > 0 ? (
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                                • In stock
                              </span>
                            ) : (
                              <span className="text-[10px] text-destructive">• Out of stock</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-gold">
                            {p.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground">
                            {formatPrice(p.price)}
                          </p>
                          <button
                            onClick={(e) => handleQuickAdd(e, p)}
                            disabled={p.stock <= 0}
                            title="Add to cart"
                            className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] font-medium text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-40 transition-colors"
                          >
                            <ShoppingBag className="h-3 w-3 text-gold" />
                            Add
                          </button>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            // Default view before typing: Recent & Trending suggestions
            <div className="space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <Clock className="h-3 w-3 text-gold" /> Recent Searches
                    </span>
                    <button
                      onClick={clearRecentSearches}
                      className="text-[10px] text-muted-foreground hover:text-destructive underline"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSearch(term)}
                        className="rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-foreground hover:border-gold hover:text-gold transition-colors flex items-center gap-1"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gold flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3" /> Trending Searches
                </p>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_SEARCHES.map((item) => (
                    <button
                      key={item}
                      onClick={() => handleSelectSearch(item)}
                      className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground hover:border-gold hover:bg-gold/5 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-gold" /> Explore by Category
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {categories.map((c) => {
                    const count = products.filter((p) => p.active && p.category === c.id).length;
                    return (
                      <Link
                        key={c.id}
                        to="/category/$category"
                        params={{ category: c.id }}
                        onClick={onClose}
                        className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-2.5 hover:border-gold hover:bg-card transition-all"
                      >
                        <img
                          src={c.image}
                          alt={c.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{count} items</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          <span>Press Enter to search all products</span>
          <button
            onClick={() => handleSelectSearch(q.trim() || "")}
            className="text-gold font-medium hover:underline flex items-center gap-1"
          >
            Browse full collection →
          </button>
        </div>
      </div>
    </div>
  );
}
