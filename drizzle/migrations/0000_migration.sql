CREATE TABLE public.admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'Staff',
  created_by text,
  last_seen timestamptz,
  created_at timestamptz not null default now()
);
CREATE TABLE public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int not null default 0,
  description text,
  image_url text,
  category text not null default 'Snacks',
  available boolean not null default true,
  created_at timestamptz not null default now()
);
CREATE TABLE public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  address text not null,
  items jsonb not null default '[]',
  total int not null default 0,
  delivery_fee int not null default 0,
  payment_method text,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
CREATE TABLE public.chats (
  id uuid primary key default gen_random_uuid(),
  customer_email text not null,
  customer_name text,
  message text not null,
  is_admin boolean not null default false,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
CREATE TABLE public.settings (
  key text primary key,
  value text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admins TO authenticated; GRANT ALL ON public.admins TO service_role;
GRANT SELECT ON public.products TO anon, authenticated; GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated; GRANT ALL ON public.products TO service_role;
GRANT INSERT ON public.orders TO anon, authenticated; GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated; GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.chats TO authenticated; GRANT ALL ON public.chats TO service_role;
GRANT SELECT ON public.settings TO anon, authenticated; GRANT INSERT, UPDATE ON public.settings TO authenticated; GRANT ALL ON public.settings TO service_role;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE lower(email) = lower(auth.jwt() ->> 'email'))
$$;
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE lower(email) = lower(auth.jwt() ->> 'email') AND role = 'Super Admin')
$$;
CREATE OR REPLACE FUNCTION public.any_admin_online() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE last_seen > now() - interval '5 minutes')
$$;
CREATE OR REPLACE FUNCTION public.admin_heartbeat() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.admins SET last_seen = now() WHERE lower(email) = lower(auth.jwt() ->> 'email')
$$;
GRANT EXECUTE ON FUNCTION public.any_admin_online() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_heartbeat() TO authenticated;

CREATE POLICY "admins read" ON public.admins FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "super add" ON public.admins FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "super update" ON public.admins FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "super delete" ON public.admins FOR DELETE TO authenticated USING (public.is_super_admin() AND lower(email) <> lower(auth.jwt() ->> 'email'));

CREATE POLICY "products public read" ON public.products FOR SELECT USING (true);
CREATE POLICY "products admin insert" ON public.products FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "products admin update" ON public.products FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "products admin delete" ON public.products FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "orders anyone place" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending' AND total >= 0);
CREATE POLICY "orders admin read" ON public.orders FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "chats read own or admin" ON public.chats FOR SELECT TO authenticated USING (public.is_admin() OR lower(customer_email) = lower(auth.jwt() ->> 'email'));
CREATE POLICY "chats customer send" ON public.chats FOR INSERT TO authenticated WITH CHECK ((is_admin = false AND lower(customer_email) = lower(auth.jwt() ->> 'email')) OR (is_admin = true AND public.is_admin()));
CREATE POLICY "chats admin update" ON public.chats FOR UPDATE TO authenticated USING (public.is_admin());

CREATE POLICY "settings read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "settings super insert" ON public.settings FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "settings super update" ON public.settings FOR UPDATE TO authenticated USING (public.is_super_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

INSERT INTO public.admins (email, role, created_by) VALUES ('yahayazakariyya755@gmail.com', 'Super Admin', 'system');
INSERT INTO public.settings (key, value) VALUES ('powered_by_url', 'https://whatsapp.com/channel/0029VbEEm1929754BJhF591p'), ('bank_details', 'Bank: (add bank) • Account: (add number) • Name: Zainab Abubakar');

INSERT INTO public.products (name, price, description, category) VALUES
('Shawarma Beef', 3000, 'Juicy spiced beef, crunchy cabbage, creamy sauce wrapped in soft warm bread.', 'Shawarma'),
('Shawarma Chicken', 3500, 'Grilled chicken strips, fresh veggies and our signature garlic cream.', 'Shawarma'),
('Shawarma', 3000, 'The classic — loaded, saucy and wrapped tight. Love in every bite.', 'Shawarma'),
('Pizza Large', 8500, 'Large hand-tossed pizza with rich tomato sauce, melty cheese and toppings.', 'Pizza'),
('Meat Pie', 500, 'Golden flaky pastry stuffed with minced meat, potato and carrots.', 'Snacks'),
('Jollof Rice', 2500, 'Smoky party jollof cooked in rich pepper and tomato base.', 'Rice'),
('Fried Rice', 2500, 'Colourful fried rice with mixed veggies, liver and spice.', 'Rice'),
('Chicken', 2000, 'Well-seasoned fried chicken, crispy outside and tender inside.', 'Snacks');

CREATE POLICY "product images read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product images admin upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND public.is_admin());
CREATE POLICY "product images admin update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND public.is_admin());