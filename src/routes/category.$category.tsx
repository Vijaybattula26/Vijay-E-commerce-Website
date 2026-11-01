import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/store/SiteLayout";
import { Catalogue, parseCatalogueSearch } from "@/components/store/Catalogue";
import { categories as seedCategories, type CategoryId } from "@/lib/products";
import { useCategories } from "@/lib/db";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/category/$category")({
  validateSearch: parseCatalogueSearch,
  beforeLoad: ({ params }) => {
    if (!seedCategories.some((c) => c.id === params.category)) throw notFound();
  },
  head: ({ params }) => {
    const c = seedCategories.find((x) => x.id === params.category);
    return c
      ? seo(c.name, `Shop ${c.name.toLowerCase()} at THE VIJAY STORE — ${c.blurb.toLowerCase()}.`)
      : seo("Category not found", "This category does not exist.", { robots: "noindex" });
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="py-24 text-center">
        <h1 className="font-display text-4xl">Category not found</h1>
        <Link to="/categories" className="mt-4 inline-block text-gold underline">
          See all categories
        </Link>
      </div>
    </SiteLayout>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const search = Route.useSearch();
  const c = useCategories().find((x) => x.id === category);
  return (
    <SiteLayout>
      <PageHeader eyebrow="Category" title={c?.name ?? category}>
        <nav aria-label="Breadcrumb" className="mt-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-gold">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/categories" className="hover:text-gold">
            Categories
          </Link>{" "}
          / <span>{c?.name}</span>
        </nav>
      </PageHeader>
      <Catalogue search={search} fixedCategory={category as CategoryId} />
    </SiteLayout>
  );
}
