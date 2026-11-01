import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SiteLayout } from "@/components/store/SiteLayout";
import { WhyUs } from "@/components/store/Sections";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    seo(
      "About us",
      "About THE VIJAY STORE — curated jewellery, fashion, watches and lifestyle essentials.",
    ),
  component: () => (
    <SiteLayout>
      <PageHeader eyebrow="About us" title="Our story" />
      <div className="mx-auto max-w-3xl px-4 py-12 text-center">
        <p className="text-muted-foreground">
          THE VIJAY STORE brings together jewellery, fashion, watches, home and beauty essentials in
          one elegant place.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          [Add your story, values and where you're based here.]
        </p>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-16">
        <WhyUs />
      </div>
    </SiteLayout>
  ),
});
