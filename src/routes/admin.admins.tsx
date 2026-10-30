import { createFileRoute } from "@tanstack/react-router";
import { AdminsTab } from "@/components/admin/sections";
import { adminHead, useAdmin } from "@/components/admin/AdminContext";

export const Route = createFileRoute("/admin/admins")({
  head: () => adminHead("Admins"),
  component: AdminsPage,
});

function AdminsPage() {
  const { me, isSuper } = useAdmin();
  if (!isSuper) return <p className="py-10 text-center text-muted-foreground">Only Super Admins can manage admins.</p>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gold-gradient">Admins</h1>
      <AdminsTab me={me} />
    </div>
  );
}
