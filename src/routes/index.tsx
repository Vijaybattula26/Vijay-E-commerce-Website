import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { CategoryTiles, WhyUs } from "@/components/store/Sections";
import { toast } from "sonner";
import { SiteLayout, btnOutline, btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { ProductGrid } from "@/components/store/ProductCard";
import { useCategories, useProducts, findProduct } from "@/lib/db";
import { isEmail } from "@/lib/commerce";
import { useHydrated, useStore } from "@/lib/store";
import type { Product } from "@/lib/products";
import { cn } from "@/lib/utils";

const TITLE = "THE VIJAY STORE — Jewellery, Fashion, Watches & Lifestyle";
const DESC =
  "Shop jewellery, clothing, watches, home decor, accessories and beauty at THE VIJAY STORE. Demo store with demo products.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const products = useProducts().filter((p) => p.active);
  const categories = useCategories();
  const { recent } = useStore();
  const hydrated = useHydrated();
  const recentItems = hydrated
    ? recent.map((id) => findProduct(products, id)).filter((p): p is Product => !!p)
    : [];
  const catImg = (i: number) => categories[i]?.image ?? "";

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs tracking-[0.3em] text-gold uppercase">New season edit</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Timeless pieces for <em className="text-gold">every</em> moment
            </h1>
            <p className="mt-6 max-w-md text-muted-foreground">
              Discover jewellery, fashion, watches and lifestyle essentials — thoughtfully curated
              in one elegant place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className={cn(btnPrimary, "px-8 py-4 shadow-elegant")}>
                Shop now
              </Link>
              <Link to="/categories" className={cn(btnOutline, "px-8 py-4")}>
                Browse categories
              </Link>
            </div>
          </div>
          <div className="relative grid grid-cols-2 gap-4">
            <img
              src={catImg(0)}
              alt="Pearl necklace"
              className="aspect-[3/4] w-full rounded-2xl object-cover shadow-elegant"
            />
            <div className="mt-10 space-y-4">
              <img
                src={catImg(2)}
                alt="Watch"
                className="aspect-square w-full rounded-2xl object-cover shadow-elegant"
              />
              <img
                src={catImg(4)}
                alt="Handbag"
                className="aspect-square w-full rounded-2xl object-cover shadow-elegant"
              />
            </div>
          </div>
        </div>
      </section>

      <Section eyebrow="Explore" title="Shop by category">
        <CategoryTiles />
      </Section>

      <Section eyebrow="Handpicked" title="Featured products" more>
        <ProductGrid items={products.filter((p) => p.featured).slice(0, 8)} />
      </Section>

      <Section
        eyebrow="Most loved (demo ranking)"
        title="Best sellers"
        className="bg-secondary/50"
        more
      >
        <ProductGrid items={products.filter((p) => p.tags.includes("bestseller")).slice(0, 8)} />
      </Section>

      {/* Promo */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground">
          <img
            src={catImg(3)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
          <div className="relative px-6 py-16 text-center md:py-24">
            <p className="text-xs tracking-[0.3em] text-gold uppercase">Limited edit</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl">The Festive Collection</h2>
            <p className="mx-auto mt-3 max-w-md text-sm opacity-80">
              Statement jewellery, evening clutches and occasion wear.
            </p>
            <a
              href="#collections"
              className="mt-6 inline-block rounded-lg bg-gold px-8 py-3 text-sm font-medium text-gold-foreground"
            >
              Explore collection
            </a>
          </div>
        </div>
      </section>

      <Section eyebrow="Just in" title="New arrivals" more>
        <ProductGrid items={[...products].sort((a, b) => b.createdAt - a.createdAt).slice(0, 8)} />
      </Section>

      <Collections products={products} />

      {recentItems.length > 0 && (
        <Section eyebrow="For you" title="Recently viewed">
          <ProductGrid items={recentItems.slice(0, 4)} />
        </Section>
      )}

      <Section eyebrow="Why us" title="Why choose THE VIJAY STORE">
        <WhyUs />
      </Section>

      <Newsletter />

      <section className="mx-auto max-w-7xl px-4 pb-16 text-center">
        <p className="text-sm text-muted-foreground">Questions about a product or order?</p>
        <Link to="/contact" className={cn(btnOutline, "mt-4")}>
          Contact us
        </Link>
      </section>
    </SiteLayout>
  );
}

function Section({
  eyebrow,
  title,
  children,
  className,
  more,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
  more?: boolean;
}) {
  return (
    <section className={cn("py-14 md:py-16", className)}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 text-center md:mb-10">
          <p className="text-xs tracking-[0.3em] text-gold uppercase">{eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl">{title}</h2>
        </div>
        {children}
        {more && (
          <div className="mt-8 text-center">
            <Link to="/shop" className="text-sm text-gold underline underline-offset-4">
              View all products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

const COLLECTIONS = [
  ["festive", "Festive"],
  ["everyday", "Everyday"],
  ["gifting", "Gifting"],
] as const;

function Collections({ products }: { products: Product[] }) {
  const [c, setC] = useState<(typeof COLLECTIONS)[number][0]>("festive");
  return (
    <section id="collections" className="scroll-mt-20 bg-secondary/50 py-14 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-8 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Curated</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl md:text-5xl">Collections</h2>
          <div className="mt-6 inline-flex rounded-full border border-border bg-card p-1">
            {COLLECTIONS.map(([id, label]) => (
              <button
                key={id}
                onClick={() => setC(id)}
                className={cn(
                  "rounded-full px-5 py-2 text-sm",
                  c === id ? "bg-primary text-primary-foreground" : "hover:text-gold",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <ProductGrid items={products.filter((p) => p.collection === c).slice(0, 8)} />
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  return (
    <section className="mx-auto max-w-3xl px-4 pb-14">
      <div className="rounded-2xl border border-gold/40 bg-card p-8 text-center md:p-12">
        <h2 className="font-display text-3xl md:text-4xl">Join our newsletter</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Demo sign-up — no emails are stored or sent yet.
        </p>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!isEmail(email)) {
              toast.error("Please enter a valid email");
              return;
            }
            toast.success("Thanks for subscribing (demo)");
            setEmail("");
          }}
          className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row"
        >
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            aria-label="Email address"
            placeholder="Your email"
            className={cn(inputCls, "flex-1 py-3")}
          />
          <button className={btnPrimary}>Subscribe</button>
        </form>
      </div>
    </section>
  );
}
