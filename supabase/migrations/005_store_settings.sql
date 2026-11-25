-- ============================================================================
-- JAJAN SALOSA - 005_store_settings.sql
-- Tabel pengaturan tampilan toko (logo & ikon tab browser / favicon)
-- serta bucket Storage 'branding'.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'default' CHECK (id = 'default'),
  store_name text NOT NULL DEFAULT 'Jajan Salosa' CHECK (char_length(trim(store_name)) >= 2),
  logo_url text,
  favicon_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_store_settings_updated_at ON public.store_settings;
CREATE TRIGGER trg_store_settings_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE ALL ON public.store_settings FROM anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT INSERT, UPDATE ON public.store_settings TO authenticated;

DROP POLICY IF EXISTS "store_settings_public_read" ON public.store_settings;
CREATE POLICY "store_settings_public_read"
  ON public.store_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "store_settings_admin_insert" ON public.store_settings;
CREATE POLICY "store_settings_admin_insert"
  ON public.store_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "store_settings_admin_update" ON public.store_settings;
CREATE POLICY "store_settings_admin_update"
  ON public.store_settings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.store_settings (id, store_name, logo_url, favicon_url)
VALUES ('default', 'Jajan Salosa', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Bucket Storage untuk logo dan favicon
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'branding',
  'branding',
  true,
  2097152, -- Maksimal 2 MB
  ARRAY[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "branding_public_read" ON storage.objects;
CREATE POLICY "branding_public_read"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'branding');

DROP POLICY IF EXISTS "branding_admin_insert" ON storage.objects;
CREATE POLICY "branding_admin_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'branding' AND public.is_admin());

DROP POLICY IF EXISTS "branding_admin_update" ON storage.objects;
CREATE POLICY "branding_admin_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'branding' AND public.is_admin())
  WITH CHECK (bucket_id = 'branding' AND public.is_admin());

DROP POLICY IF EXISTS "branding_admin_delete" ON storage.objects;
CREATE POLICY "branding_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'branding' AND public.is_admin());
