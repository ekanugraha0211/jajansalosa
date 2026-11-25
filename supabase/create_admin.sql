-- ============================================================================
-- JAJAN SALOSA - DAFTARKAN ADMIN KE TABEL public.admins
--
-- PENTING:
-- Password admin TIDAK disimpan di tabel public.admins (demi keamanan).
-- Password dikelola oleh Supabase Authentication (auth.users).
--
-- LANGKAH 1:
--   Buka Supabase Dashboard -> Authentication -> Users -> Add user -> Create new user.
--   Isi Email & Password Anda, lalu centang "Auto Confirm User".
--
-- LANGKAH 2:
--   Ganti email di bawah ini sesuai email user yang baru dibuat, lalu jalankan di SQL Editor:
-- ============================================================================

INSERT INTO public.admins (user_id, email, full_name)
SELECT id, email, 'Admin Jajan Salosa'
FROM auth.users
WHERE email = 'ekanugraha0211@jajansalosa.com'
ON CONFLICT (user_id) DO UPDATE
SET email = EXCLUDED.email,
    full_name = EXCLUDED.full_name;
