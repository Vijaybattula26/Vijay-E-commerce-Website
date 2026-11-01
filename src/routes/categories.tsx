import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/store/SiteLayout";
import { CategoryTiles } from "@/components/store/Sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/categories")({
  head: () =>
    seo(
      "Categories",
      "Jewellery, clothing, watches, home & lifestyle, accessories and beauty — explore every category.",
    ),
  component: () => (
    <SiteLayout>
      <PageHeader eyebrow="Explore" title="All categories" />
      <div className="mx-auto max-w-7xl px-4 py-10">
        <CategoryTiles />
      </div>
    </SiteLayout>
  ),
});
