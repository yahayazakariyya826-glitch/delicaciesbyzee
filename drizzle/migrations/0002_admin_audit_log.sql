CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  entity_label text,
  before_data jsonb,
  after_data jsonb,
  session_id text,
  CONSTRAINT audit_logs_action CHECK (action IN ('created', 'updated', 'deleted', 'signed_in')),
  CONSTRAINT audit_logs_entity CHECK (entity_type IN ('product', 'order', 'admin'))
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit log" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_admin());
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC, id DESC);
CREATE UNIQUE INDEX audit_logs_sign_in_session_idx ON public.audit_logs (session_id) WHERE action = 'signed_in';

CREATE FUNCTION public.audit_admin_changes() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  old_values jsonb;
  new_values jsonb;
  row_values jsonb;
  fields text[];
BEGIN
  IF TG_TABLE_NAME = 'products' THEN
    fields := ARRAY['name','price','description','image_url','category','available','stock','old_price','featured','images'];
  ELSE
    IF TG_OP <> 'UPDATE' OR NOT public.is_admin() THEN RETURN NULL; END IF;
    fields := ARRAY['items','total','delivery_fee','payment_method','note','status','payment_status','delivery_status','proof_path'];
  END IF;
  IF TG_OP <> 'INSERT' THEN
    SELECT jsonb_object_agg(key,value) INTO old_values FROM jsonb_each(to_jsonb(OLD)) WHERE key = ANY(fields);
  END IF;
  IF TG_OP <> 'DELETE' THEN
    SELECT jsonb_object_agg(key,value) INTO new_values FROM jsonb_each(to_jsonb(NEW)) WHERE key = ANY(fields);
  END IF;
  IF TG_OP = 'UPDATE' AND old_values IS NOT DISTINCT FROM new_values THEN RETURN NULL; END IF;
  IF TG_OP = 'DELETE' THEN row_values := to_jsonb(OLD); ELSE row_values := to_jsonb(NEW); END IF;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label, before_data, after_data)
  VALUES (auth.uid(), auth.jwt()->>'email', CASE TG_OP WHEN 'INSERT' THEN 'created' WHEN 'DELETE' THEN 'deleted' ELSE 'updated' END,
    CASE TG_TABLE_NAME WHEN 'products' THEN 'product' ELSE 'order' END,
    row_values->>'id', CASE TG_TABLE_NAME WHEN 'products' THEN row_values->>'name' ELSE '#' || left(row_values->>'id',6) END, old_values, new_values);
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.audit_admin_changes() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER products_audit_changes AFTER INSERT OR UPDATE OR DELETE ON public.products FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();
CREATE TRIGGER orders_audit_updates AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.audit_admin_changes();

CREATE FUNCTION public.record_admin_sign_in() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE current_session text := auth.jwt()->>'session_id';
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RETURN; END IF;
  IF current_session IS NULL OR current_session = '' THEN RETURN; END IF;
  INSERT INTO public.audit_logs (actor_id, actor_email, action, entity_type, entity_id, entity_label, session_id)
  VALUES (auth.uid(), auth.jwt()->>'email', 'signed_in', 'admin', auth.uid()::text, auth.jwt()->>'email', current_session)
  ON CONFLICT (session_id) WHERE action = 'signed_in' DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.record_admin_sign_in() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_admin_sign_in() TO authenticated;