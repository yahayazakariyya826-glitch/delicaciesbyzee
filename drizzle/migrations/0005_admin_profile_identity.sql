ALTER TABLE public.admins ADD COLUMN auth_user_id uuid;
UPDATE public.admins a SET auth_user_id = u.id FROM auth.users u WHERE lower(a.email) = lower(u.email) AND u.email_confirmed_at IS NOT NULL;
CREATE UNIQUE INDEX admins_auth_user_id_unique ON public.admins(auth_user_id) WHERE auth_user_id IS NOT NULL;
COMMENT ON COLUMN public.admins.auth_user_id IS 'Verified stable Auth identity; email is display/contact information and admin_users remains a synchronized projection.';
CREATE OR REPLACE FUNCTION public.bind_admin_auth_identity() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT id INTO NEW.auth_user_id FROM auth.users WHERE lower(email) = lower(NEW.email) AND email_confirmed_at IS NOT NULL;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.bind_admin_auth_identity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER bind_admin_auth_identity BEFORE INSERT OR UPDATE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.bind_admin_auth_identity();
CREATE OR REPLACE FUNCTION public.sync_confirmed_admin_email() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.email_confirmed_at IS NULL OR NEW.email IS NULL THEN RETURN NEW; END IF;
  IF EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = NEW.id) THEN
    UPDATE public.admins SET email = lower(NEW.email) WHERE auth_user_id = NEW.id AND lower(email) IS DISTINCT FROM lower(NEW.email);
  ELSE
    UPDATE public.admins SET auth_user_id = NEW.id WHERE auth_user_id IS NULL AND lower(email) = lower(NEW.email);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_confirmed_admin_email() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER sync_confirmed_admin_email AFTER INSERT OR UPDATE OF email, email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.sync_confirmed_admin_email();
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid())
$$;
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid() AND role = 'Super Admin')
$$;
CREATE OR REPLACE FUNCTION public.admin_heartbeat() RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
 UPDATE public.admins SET last_seen = now() WHERE auth_user_id = auth.uid()
$$;
ALTER POLICY "super delete" ON public.admins USING (public.is_super_admin() AND auth_user_id IS DISTINCT FROM auth.uid());