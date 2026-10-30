import { createFileRoute } from "@tanstack/react-router";
import { ChatsTab } from "@/components/admin/sections";
import { adminHead } from "@/components/admin/AdminContext";

export const Route = createFileRoute("/admin/chats")({
  head: () => adminHead("Live chat"),
  component: () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gold-gradient">Live chat</h1>
      <ChatsTab />
    </div>
  ),
});
