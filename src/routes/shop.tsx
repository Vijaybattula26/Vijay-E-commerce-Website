import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/store/SiteLayout";
import { Catalogue, parseCatalogueSearch } from "@/components/store/Catalogue";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/shop")({
  validateSearch: parseCatalogueSearch,
  head: () =>
    seo(
      "Shop all products",
      "Browse jewellery, clothing, watches, home decor, accessories and beauty. Search, filter and sort the full collection.",
    ),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  return (
    <SiteLayout>
      <PageHeader eyebrow="The collection" title="Shop all products" />
      <Catalogue search={search} />
    </SiteLayout>
  );
}
