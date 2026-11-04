import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/my-profile")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/profile", replace: true });
  },
});
