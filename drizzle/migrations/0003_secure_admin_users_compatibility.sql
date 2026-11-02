CREATE TABLE public.admin_users (
  email text PRIMARY KEY,
  role text NOT NULL DEFAULT 'super_admin'
);
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own admin membership or super admin" ON public.admin_users FOR SELECT TO authenticated USING (lower(email) = lower(auth.jwt() ->> 'email') OR public.is_super_admin());
INSERT INTO public.admin_users (email, role) SELECT lower(email), CASE WHEN role = 'Super Admin' THEN 'super_admin' ELSE 'staff' END FROM public.admins;
CREATE OR REPLACE FUNCTION public.sync_admin_users_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.admin_users WHERE email = lower(OLD.email);
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND lower(OLD.email) <> lower(NEW.email) THEN
    DELETE FROM public.admin_users WHERE email = lower(OLD.email);
  END IF;
  INSERT INTO public.admin_users(email, role) VALUES (lower(NEW.email), CASE WHEN NEW.role = 'Super Admin' THEN 'super_admin' ELSE 'staff' END)
  ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.sync_admin_users_membership() FROM PUBLIC;
CREATE TRIGGER sync_admin_users_membership AFTER INSERT OR UPDATE OR DELETE ON public.admins FOR EACH ROW EXECUTE FUNCTION public.sync_admin_users_membership();
COMMENT ON TABLE public.admin_users IS 'Read-only membership projection of public.admins. Manage roles through the existing protected admins table.';