ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS old_price integer, ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false, ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending', ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'pending', ADD COLUMN IF NOT EXISTS proof_path text;
DROP POLICY IF EXISTS "orders anyone place" ON public.orders;
CREATE POLICY "orders anyone place" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND payment_status = 'pending' AND delivery_status = 'pending' AND total >= 0);
GRANT DELETE ON public.orders TO authenticated;
CREATE POLICY "orders admin delete" ON public.orders FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.public_payment_info (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'Delicacies by Zee',
  whatsapp text NOT NULL DEFAULT '2348139991550',
  bank_name text, account_name text, account_number text,
  bank_details text, powered_by_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.public_payment_info TO anon, authenticated;
GRANT INSERT, UPDATE ON public.public_payment_info TO authenticated;
GRANT ALL ON public.public_payment_info TO service_role;
ALTER TABLE public.public_payment_info ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment info public read" ON public.public_payment_info FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "payment info super insert" ON public.public_payment_info FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "payment info super update" ON public.public_payment_info FOR UPDATE TO authenticated USING (public.is_super_admin());
INSERT INTO public.public_payment_info (id, bank_details, powered_by_url)
SELECT 1, (SELECT value FROM public.settings WHERE key='bank_details'), (SELECT value FROM public.settings WHERE key='powered_by_url')
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "settings read" ON public.settings;
CREATE POLICY "settings super read" ON public.settings FOR SELECT TO authenticated USING (public.is_super_admin());
REVOKE SELECT ON public.settings FROM anon;

INSERT INTO public.admins (email, role, created_by) SELECT e, 'Super Admin', 'system' FROM (VALUES ('yahayazakariyya826@gmail.com'),('yahayazakariyya828@gmail.com')) v(e)
WHERE NOT EXISTS (SELECT 1 FROM public.admins a WHERE lower(a.email)=v.e);

CREATE POLICY "proofs anyone upload" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'proofs');
CREATE POLICY "proofs admin read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'proofs' AND public.is_admin());