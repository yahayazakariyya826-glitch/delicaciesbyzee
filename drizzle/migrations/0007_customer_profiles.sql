CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 full_name text NOT NULL DEFAULT '',
 phone text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT profile_name_valid CHECK (length(btrim(full_name)) BETWEEN 1 AND 100 AND full_name !~ '[<>]'),
 CONSTRAINT profile_phone_valid CHECK (phone ~ '^0[789][01][0-9]{8}$')
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (id=auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id=auth.uid()) WITH CHECK (id=auth.uid());
CREATE FUNCTION public.create_customer_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.raw_user_meta_data ? 'full_name' OR NEW.raw_user_meta_data ? 'phone' THEN
  INSERT INTO public.profiles(id,full_name,phone) VALUES(NEW.id,btrim(NEW.raw_user_meta_data->>'full_name'),btrim(NEW.raw_user_meta_data->>'phone'));
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.create_customer_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER create_customer_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_customer_profile();