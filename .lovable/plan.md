# Full Admin Dashboard + Secure Checkout Payment Info

Built on this app's own backend (the other project ID in the brief can't be linked here; everything it asks for is done in the existing database).

## Admins
- Add yahayazakariyya826@gmail.com and yahayazakariyya828@gmail.com as Super Admins (755 already is).
- Access stays checked in the database by signed-in email; non-admins are sent home.

## Pages (sidebar with icons, mobile drawer, dark/light toggle)
- **/admin/login** — email + password sign-in (with "email me a code" kept as backup). Super admins set their password on first sign-in.
- **/admin/dashboard** — total orders, revenue, products, pending orders; 5 recent orders; low-stock alert.
- **/admin/orders** — table (ID, name, phone, total, payment status, delivery status, date); filter + search by name/phone; detail popup with items, address and payment proof photo; actions: confirm payment, shipped, delivered, delete.
- **/admin/products** — list with image, name, price, stock, category; add/edit (description, price, old price, stock, category, multiple image upload), delete, toggle featured.
- **/admin/customers** — customers grouped from orders (name, phone, order count, total spent).
- **/admin/settings** (Super Admin only) — store name, WhatsApp number, bank name, account name, account number; saves to settings and to the public payment info.
- Existing Admins and Live Chat tools move into the sidebar too. Old /admin redirects to /admin/dashboard.

## Checkout
- Bank details read from the new public payment info.
- Customer can upload a payment proof photo; it's attached to the order.

## Security
- Settings becomes readable/writable by Super Admins only (public store name/WhatsApp move to the public payment info).
- Run the security scan afterwards and fix findings.

## Technical details
- Migration: products add `stock int default 0`, `old_price int`, `featured bool default false`, `images text[]`; orders add `payment_status` ('pending'|'confirmed'), `delivery_status` ('pending'|'shipped'|'delivered'), `proof_path text`; admin DELETE policy on orders. New `public_payment_info` (single row id=1: store_name, whatsapp, bank_name, account_name, account_number) with anon SELECT, super-admin write; backfill from settings. Replace settings public read with super-admin-only. No `otp_codes` table exists — nothing to drop.
- Storage: `proofs` bucket kept **private** (platform blocks public buckets); anon may INSERT only, admins read via signed URLs. Product images keep the existing bucket.
- Routes: `admin.tsx` becomes layout (admin check + sidebar + `<Outlet/>`), children `admin.dashboard/orders/products/customers/settings/admins/chats.tsx`, `admin.index.tsx` redirect, `admin.login.tsx` outside the guard check. Enable password auth alongside OTP.
- Update `useSetting` callers on public pages to use public payment info.
