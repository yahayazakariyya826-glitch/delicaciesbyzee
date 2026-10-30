import { createContext, useContext } from "react";
import type { Database } from "@/integrations/supabase/types";

export type Admin = Database["public"]["Tables"]["admins"]["Row"];
export const AdminContext = createContext<Admin | null>(null);

export function useAdmin() {
  const me = useContext(AdminContext);
  if (!me) throw new Error("useAdmin outside admin layout");
  return { me, isSuper: me.role === "Super Admin" };
}

export function adminHead(title: string) {
  return {
    meta: [
      { title: `${title} — Admin · Delicacies by Zee` },
      { name: "description", content: `Delicacies by Zee admin: ${title.toLowerCase()}.` },
      { property: "og:title", content: `${title} — Admin · Delicacies by Zee` },
      { property: "og:description", content: `Admin ${title.toLowerCase()}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  };
}
