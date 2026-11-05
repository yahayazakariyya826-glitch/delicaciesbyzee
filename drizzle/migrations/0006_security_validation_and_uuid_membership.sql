ALTER TABLE public.admin_users ADD COLUMN id uuid;
UPDATE public.admin_users u SET id = a.auth_user_id FROM public.admins a WHERE lower(u.email)=lower(a.email);
CREATE UNIQUE INDEX admin_users_verified_id ON public.admin_users(id) WHERE id IS NOT NULL;
CREATE OR REPLACE FUNCTION public.sync_admin_users_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN DELETE FROM public.admin_users WHERE email=lower(OLD.email); RETURN OLD; END IF;
 IF TG_OP='UPDATE' AND lower(OLD.email)<>lower(NEW.email) THEN DELETE FROM public.admin_users WHERE email=lower(OLD.email); END IF;
 INSERT INTO public.admin_users(email,role,id) VALUES(lower(NEW.email),CASE WHEN NEW.role='Super Admin' THEN 'super_admin' ELSE 'staff' END,NEW.auth_user_id)
 ON CONFLICT(email) DO UPDATE SET role=EXCLUDED.role,id=EXCLUDED.id;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_admin_users_membership() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON public.admin_users FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
CREATE POLICY "Verified identity membership read" ON public.admin_users FOR SELECT TO authenticated USING(id=auth.uid());
CREATE OR REPLACE FUNCTION public.valid_plain_text(v text, max_len integer, required boolean DEFAULT false) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$ SELECT CASE WHEN v IS NULL THEN NOT required ELSE length(btrim(v))<=max_len AND (NOT required OR length(btrim(v))>0) AND v !~ '[<>]' END $$;
CREATE OR REPLACE FUNCTION public.validate_app_inputs() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_TABLE_NAME='products' THEN
  NEW.name=btrim(NEW.name); NEW.description=btrim(NEW.description); NEW.category=btrim(NEW.category);
  IF NOT public.valid_plain_text(NEW.name,100,true) OR NOT public.valid_plain_text(NEW.description,2000) OR NOT public.valid_plain_text(NEW.category,100,true) OR NEW.price<=0 OR NEW.stock<0 OR (NEW.old_price IS NOT NULL AND NEW.old_price<=0) THEN RAISE EXCEPTION 'Invalid product: name maximum 100 characters, plain text, and positive price required' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='orders' THEN
  NEW.customer_name=btrim(NEW.customer_name); NEW.customer_phone=regexp_replace(btrim(NEW.customer_phone),'[ ()-]','','g'); NEW.customer_email=lower(btrim(NEW.customer_email)); NEW.address=btrim(NEW.address); NEW.note=btrim(NEW.note);
  IF NOT public.valid_plain_text(NEW.customer_name,100,true) OR NEW.customer_phone !~ '^(0[789][01][0-9]{8}|\+?234[789][01][0-9]{8})$' OR NOT public.valid_plain_text(NEW.address,500,true) OR NOT public.valid_plain_text(NEW.note,1000) OR (NEW.customer_email IS NOT NULL AND NEW.customer_email !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$') OR length(NEW.customer_email)>255 THEN RAISE EXCEPTION 'Invalid customer details' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='chats' THEN
  NEW.message=btrim(NEW.message); NEW.customer_name=btrim(NEW.customer_name);
  IF NOT public.valid_plain_text(NEW.message,2000,true) OR NOT public.valid_plain_text(NEW.customer_name,100) OR length(NEW.customer_email)>255 OR NEW.customer_email !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$' THEN RAISE EXCEPTION 'Invalid chat details' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='admins' THEN
  NEW.email=lower(btrim(NEW.email));
  IF length(NEW.email)>255 OR NEW.email !~ '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$' OR NEW.role NOT IN ('Staff','Super Admin') THEN RAISE EXCEPTION 'Invalid admin details' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='public_payment_info' THEN
  NEW.store_name=btrim(NEW.store_name); NEW.bank_name=btrim(NEW.bank_name); NEW.account_name=btrim(NEW.account_name); NEW.whatsapp=regexp_replace(btrim(NEW.whatsapp),'[ ()-]','','g');
  IF NOT public.valid_plain_text(NEW.store_name,100,true) OR NOT public.valid_plain_text(NEW.bank_name,100) OR NOT public.valid_plain_text(NEW.account_name,100) OR NEW.whatsapp !~ '^(0[789][01][0-9]{8}|\+?234[789][01][0-9]{8})$' OR (coalesce(NEW.account_number,'')<>'' AND NEW.account_number !~ '^[0-9]{10}$') OR (coalesce(NEW.powered_by_url,'')<>'' AND (length(NEW.powered_by_url)>2048 OR NEW.powered_by_url !~ '^https://[^[:space:]<>]+$')) THEN RAISE EXCEPTION 'Invalid store settings' USING ERRCODE='23514'; END IF;
 ELSIF TG_TABLE_NAME='settings' THEN
  NEW.key=btrim(NEW.key); NEW.value=btrim(NEW.value);
  IF NOT public.valid_plain_text(NEW.key,100,true) OR NOT public.valid_plain_text(NEW.value,2048) THEN RAISE EXCEPTION 'Invalid setting' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_app_inputs() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER validate_product_input BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_app_inputs();
CREATE TRIGGER validate_order_input BEFORE INSERT OR UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.validate_app_inputs();
CREATE TRIGGER validate_chat_input BEFORE INSERT OR UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.validate_app_inputs();
CREATE TRIGGER validate_admin_input BEFORE INSERT OR UPDATE OF email,role ON public.admins FOR EACH ROW EXECUTE FUNCTION public.validate_app_inputs();
CREATE TRIGGER validate_payment_input BEFORE INSERT OR UPDATE ON public.public_payment_info FOR EACH ROW EXECUTE FUNCTION public.validate_app_inputs();
CREATE TRIGGER validate_setting_input BEFORE INSERT OR UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.validate_app_inputs();