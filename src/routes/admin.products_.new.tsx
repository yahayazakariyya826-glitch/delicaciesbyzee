import { createFileRoute } from "@tanstack/react-router";
import { adminHead } from "@/components/admin/AdminContext";
import { ProductEditor } from "./admin.products";

export const Route = createFileRoute("/admin/products_/new")({
  head: () => adminHead("New product"),
  component: NewProduct,
});
function NewProduct() { return <ProductEditor createNew />; }