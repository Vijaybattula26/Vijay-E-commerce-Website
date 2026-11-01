import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminTitle } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/ProductForm";
import { findProduct, useProducts } from "@/lib/db";

export const Route = createFileRoute("/admin/products/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const p = findProduct(useProducts(), id);
  if (!p)
    return (
      <p>
        Product not found.{" "}
        <Link to="/admin/products" className="text-gold underline">
          Back
        </Link>
      </p>
    );
  return (
    <>
      <AdminTitle title={`Edit: ${p.name}`}>
        <Link to="/product/$id" params={{ id: p.id }} className="text-sm text-gold underline">
          View in store
        </Link>
      </AdminTitle>
      <ProductForm key={p.id} product={p} />
    </>
  );
}
