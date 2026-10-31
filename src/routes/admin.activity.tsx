import { createFileRoute } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { adminHead, useAdmin } from "@/components/admin/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { auditValue, changedFields } from "@/lib/audit";

type Audit = Database["public"]["Tables"]["audit_logs"]["Row"];
const PAGE_SIZE = 30;
const verbs: Record<string, string> = { created: "Created", updated: "Updated", deleted: "Deleted", signed_in: "Signed in" };

export const Route = createFileRoute("/admin/activity")({
  head: () => adminHead("Activity log"),
  component: ActivityPage,
});

function ActivityPage() {
  const { me } = useAdmin();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Audit | null>(null);
  const { data, isPending, isFetching, error, refetch } = useQuery({
    queryKey: ["admin-audit", me.email, category, search, page],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      let query = supabase.from("audit_logs").select("*", { count: "exact" })
        .order("created_at", { ascending: false }).order("id", { ascending: false });
      if (category !== "all") query = query.eq("entity_type", category);
      const term = search.replace(/[^a-zA-Z0-9@ .+\-]/g, "").trim();
      if (term) query = query.or(`actor_email.ilike.%${term}%,entity_label.ilike.%${term}%`);
      const result = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      if (result.error) throw result.error;
      return { rows: result.data ?? [], count: result.count ?? 0 };
    },
  });
  const rows = data?.rows ?? [];
  const count = data?.count ?? 0;
  const changes = selected ? changedFields(selected.before_data, selected.after_data) : [];
  const when = (value: string) => new Date(value).toLocaleString("en-NG", { timeZone: "Africa/Lagos", dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gold-gradient">Activity log</h1>
        <Button size="icon" variant="outline" aria-label="Refresh activity" title="Refresh activity" disabled={isFetching} onClick={() => void refetch()}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? "motion-safe:animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input aria-label="Search activity" placeholder="Search admin or product / order" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <select aria-label="Activity type" value={category} onChange={(e) => { setCategory(e.target.value); setPage(0); }} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All activity</option><option value="product">Product changes</option><option value="order">Order updates</option><option value="admin">Admin sign-ins</option>
        </select>
      </div>
      {error ? <div role="alert" className="py-8 text-center"><p className="text-destructive">Activity could not be loaded.</p><Button className="mt-3" variant="outline" onClick={() => void refetch()}>Try again</Button></div> : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-xs uppercase text-muted-foreground"><tr>{["Time (Lagos)", "Admin", "Activity", "Record", ""].map((label, i) => <th key={i} className="p-3 font-medium">{label}</th>)}</tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="border-t border-border">
                <td className="whitespace-nowrap p-3 text-xs text-muted-foreground">{when(row.created_at)}</td>
                <td className="max-w-60 break-words p-3">{row.actor_email || "System"}</td>
                <td className="whitespace-nowrap p-3"><span className={row.action === "deleted" ? "text-destructive" : "text-primary"}>{verbs[row.action]}</span>{row.entity_type !== "admin" && <span className="text-muted-foreground"> · {row.entity_type}</span>}</td>
                <td className="max-w-64 break-words p-3">{row.entity_label}</td>
                <td className="p-3"><Button variant="ghost" size="sm" onClick={() => setSelected(row)} aria-label={`View activity details for ${row.entity_label}`}>Details</Button></td>
              </tr>)}</tbody>
            </table>
            {isPending ? <p role="status" className="p-8 text-center text-muted-foreground">Loading activity…</p> : rows.length === 0 && <div className="flex flex-col items-center gap-2 p-8 text-muted-foreground"><History className="h-6 w-6" /><p>{search || category !== "all" ? "No matching activity." : "No activity recorded yet."}</p></div>}
          </div>
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <p>{count === 0 ? "0 entries" : `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, count)} of ${count}`}</p>
            <div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Previous page" disabled={page === 0 || isFetching} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" aria-label="Next page" disabled={(page + 1) * PAGE_SIZE >= count || isFetching} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button></div>
          </div>
        </>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader><DialogTitle>Activity details</DialogTitle><DialogDescription>{selected && `${verbs[selected.action]} · ${when(selected.created_at)} (Lagos)`}</DialogDescription></DialogHeader>
          {selected && <div className="min-w-0 space-y-4 text-sm">
            <dl className="space-y-2"><div><dt className="text-muted-foreground">Admin</dt><dd className="break-all">{selected.actor_email || "System"}</dd></div><div><dt className="text-muted-foreground">Record</dt><dd className="break-words">{selected.entity_label}</dd><dd className="break-all font-mono text-xs text-muted-foreground">{selected.entity_id}</dd></div></dl>
            {changes.length > 0 && <div className="overflow-x-auto"><table className="w-full table-fixed text-left text-sm"><thead><tr><th className="w-1/4 pb-2">Field</th><th className="pb-2">Before</th><th className="pb-2">After</th></tr></thead><tbody>{changes.map((change) => <tr key={change.key} className="border-t border-border"><td className="break-words py-3 pr-3 capitalize">{change.key.replaceAll("_", " ")}</td><td className="break-all py-3 pr-3 text-muted-foreground">{auditValue(change.before)}</td><td className="break-all py-3 text-primary">{auditValue(change.after)}</td></tr>)}</tbody></table></div>}
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}