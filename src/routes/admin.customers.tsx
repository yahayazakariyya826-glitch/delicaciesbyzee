import { createFileRoute } from "@tanstack/react-router";
import { CustomersTab } from "@/components/admin/sections";
import { adminHead } from "@/components/admin/AdminContext";

export const Route = createFileRoute("/admin/customers")({
  head: () => adminHead("Customers"),
  component: () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gold-gradient">Customers</h1>
      <CustomersTab />
    </div>
  ),
});
