import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProducts, type Product } from "@/lib/products";
import { CATEGORIES, naira, productImage } from "@/lib/brand";
import { supabase } from "@/integrations/supabase/client";
import { adminHead } from "@/components/admin/AdminContext";
import { productSchema, validationMessage } from "@/lib/input-validation";

export const Route = createFileRoute("/admin/products")({
  head: () => adminHead("Products"),
  component: ProductsPage,
});

type Edit = { id?: string; name: string; description: string; price: number; old_price: number | null; stock: number; category: string; images: string[]; available: boolean; featured: boolean };
const empty: Edit = { name: "", description: "", price: 0, old_price: null, stock: 0, category: "Shawarma", images: [], available: true, featured: false };

function ProductsPage() { return <ProductEditor />; }

export function ProductEditor({ createNew = false }: { createNew?: boolean }) {
  const navigate = useNavigate();
  const { products } = useProducts(true);
  const [edit, setEdit] = useState<Edit | null>(createNew ? { ...empty } : null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const save = async () => {
    if (!edit) return;
    const { id, ...d } = edit;
    const parsed = productSchema.safeParse(d);
    if (!parsed.success) { toast.error(validationMessage(parsed.error)); return; }
    setSaving(true);
    const row = { ...parsed.data, image_url: parsed.data.images[0] ?? null };
    const { error } = id ? await supabase.from("products").update(row).eq("id", id) : await supabase.from("products").insert(row);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setEdit(null);
    if (createNew) await navigate({ to: "/admin/products" });
  };
  const remove = async (p: Product) => {
    if (!confirm(`Delete ${p.name}?`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message);
  };
  const toggleFeatured = async (p: Product) => {
    const { error } = await supabase.from("products").update({ featured: !p.featured }).eq("id", p.id);
    if (error) toast.error(error.message);
  };
  const upload = async (files: FileList) => {
    const selected = Array.from(files);
    if (selected.some((file) => !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setUploadError("Use JPG, PNG, WebP or GIF photos up to 5 MB each."); return;
    }
    if ((edit?.images.length ?? 0) + selected.length > 20) { setUploadError("Choose at most 20 images."); return; }
    setPreviews(selected.map((file) => URL.createObjectURL(file)));
    setUploadError("");
    setUploading(true);
    const urls: string[] = [];
    let completed = 0;
    try { for (const file of selected) {
      setUploadStatus(`Uploading photo ${completed + 1} of ${selected.length}…`);
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.]/g, "")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data, error: linkError } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (linkError || !data?.signedUrl) throw linkError ?? new Error("Unable to create the photo link.");
      urls.push(data.signedUrl);
      completed++;
    } } catch (error) { setUploadError(error instanceof Error ? error.message : "Photo upload failed. Please retry."); }
    finally { setUploading(false); setPreviews([]); setUploadStatus(`${completed} of ${selected.length} photos uploaded.`); }
    setEdit((e) => (e ? { ...e, images: [...e.images, ...urls] } : e));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gold-gradient">Products</h1>
        <Button asChild><Link to="/admin/products/new">+ Add product</Link></Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl border border-border bg-card p-3">
            <img src={productImage(p)} alt="" width={64} height={64} loading="lazy" className="h-16 w-16 rounded-xl object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.name}</p>
              <p className="text-sm text-primary">{naira(p.price)}{p.old_price ? <s className="ml-2 text-xs text-muted-foreground">{naira(p.old_price)}</s> : null}</p>
              <p className="text-xs text-muted-foreground">{p.category} · Stock {p.stock}{p.available ? "" : " · Hidden"}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <button aria-label="Toggle featured" onClick={() => toggleFeatured(p)}><Star className={`h-4 w-4 ${p.featured ? "fill-primary text-primary" : ""}`} /></button>
              <button aria-label="Edit" onClick={() => setEdit({ id: p.id, name: p.name, description: p.description ?? "", price: p.price, old_price: p.old_price, stock: p.stock, category: p.category, images: p.images?.length ? p.images : p.image_url ? [p.image_url] : [], available: p.available, featured: p.featured })}><Pencil className="h-4 w-4" /></button>
              <button aria-label="Delete" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
          </div>
        ))}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => { if (uploading || saving) return; if (!o) { setEdit(null); if (createNew) void navigate({ to: "/admin/products" }); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{edit?.id ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input aria-label="Name" maxLength={100} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea aria-label="Description" maxLength={2000} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Price ₦</Label><Input aria-label="Price" min={1} type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: Number(e.target.value) })} /></div>
                <div><Label>Old price ₦</Label><Input type="number" value={edit.old_price ?? ""} onChange={(e) => setEdit({ ...edit, old_price: e.target.value ? Number(e.target.value) : null })} /></div>
                <div><Label>Stock</Label><Input type="number" value={edit.stock} onChange={(e) => setEdit({ ...edit, stock: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Category</Label>
                <select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Images</Label>
                <Input aria-label="Product photos" type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading || saving} onChange={(e) => { if (e.target.files?.length) void upload(e.target.files); e.target.value = ""; }} />
                {uploadStatus && <p role="status" className="text-xs text-muted-foreground">{uploadStatus}</p>}
                {uploadError && <p role="alert" className="text-sm text-destructive">{uploadError}</p>}
                <div className="flex flex-wrap gap-2">{previews.map((url) => <img key={url} src={url} alt="Photo preview" className="h-14 w-14 rounded-lg object-cover" />)}</div>
                <div className="flex flex-wrap gap-2">
                  {edit.images.map((u, i) => (
                    <button key={u} type="button" title="Remove" onClick={() => setEdit({ ...edit, images: edit.images.filter((_, n) => n !== i) })}>
                      <img src={u} alt="" className="h-14 w-14 rounded-lg object-cover" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between"><Label>Available</Label><Switch checked={edit.available} onCheckedChange={(v) => setEdit({ ...edit, available: v })} /></div>
              <div className="flex items-center justify-between"><Label>Featured</Label><Switch checked={edit.featured} onCheckedChange={(v) => setEdit({ ...edit, featured: v })} /></div>
              <Button className="w-full" onClick={save} disabled={!edit.name || uploading || saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
