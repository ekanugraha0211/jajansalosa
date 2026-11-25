-- ============================================================================
-- JAJAN SALOSA - FIX PERMISSIONS (GRANT PRIVILEGES)
-- Jalankan skrip ini di Supabase SQL Editor jika muncul error:
-- "permission denied for table admins" atau tabel lainnya.
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON public.admins FROM anon, authenticated;
GRANT SELECT ON public.admins TO authenticated;

REVOKE ALL ON public.categories FROM anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

REVOKE ALL ON public.products FROM anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

REVOKE ALL ON public.order_items FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_items TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb) TO anon, authenticated;
