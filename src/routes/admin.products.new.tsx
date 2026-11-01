import { createFileRoute } from "@tanstack/react-router";
import { AdminTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/admin/products/new")({
  component: () => (
    <>
      <AdminTitle title="Add product" />
      <ProductForm />
    </>
  ),
});
