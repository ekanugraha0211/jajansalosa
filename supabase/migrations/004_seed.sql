-- ============================================================================
-- JAJAN SALOSA - 004_seed.sql
-- Data awal kategori & produk jajanan untuk toko Jajan Salosa
-- ============================================================================

INSERT INTO public.categories (name, slug, description, sort_order)
VALUES
  ('Kue Basah', 'kue-basah', 'Aneka kue tradisional lembut yang dibuat segar setiap pagi.', 1),
  ('Gorengan & Gurih', 'gorengan-gurih', 'Camilan renyah dan gurih favorit keluarga.', 2),
  ('Keripik & Kering', 'keripik-kering', 'Camilan kering tahan lama cocok untuk stok di rumah.', 3),
  ('Minuman Segar', 'minuman-segar', 'Minuman tradisional dan kekinian penyegar dahaga.', 4),
  ('Paket Hampers', 'paket-hampers', 'Paket pilihan spesial untuk acara, arisan, dan hantaran.', 5)
ON CONFLICT (slug) DO NOTHING;

WITH cat AS (
  SELECT id, slug FROM public.categories
)
INSERT INTO public.products (category_id, name, slug, description, price, stock, image_url, is_active, is_featured)
VALUES
  (
    (SELECT id FROM cat WHERE slug = 'kue-basah'),
    'Klepon Gula Aren Premium',
    'klepon-gula-aren-premium',
    'Bola ketan lembut beraroma daun pandan asli dengan isian gula aren cair yang lumer di mulut dan balutan kelapa parut segar. Isi 10 pcs per kotak.',
    15000,
    35,
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    (SELECT id FROM cat WHERE slug = 'kue-basah'),
    'Kue Lumpur Kentang Kismis',
    'kue-lumpur-kentang-kismis',
    'Kue lumpur lembut berbahan kentang pilihan dan santan segar, dipanggang sempurna dengan topping kismis manis. Isi 6 pcs per box.',
    18000,
    24,
    'https://images.unsplash.com/photo-1587241321921-91a834d6d191?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    (SELECT id FROM cat WHERE slug = 'gorengan-gurih'),
    'Risol Mayo Smoked Beef',
    'risol-mayo-smoked-beef',
    'Kulit risol tipis renyah berisi smoked beef, telur rebus, keju, dan saus mayonnaise creamy racikan spesial Jajan Salosa. Isi 5 pcs.',
    22000,
    40,
    'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    (SELECT id FROM cat WHERE slug = 'gorengan-gurih'),
    'Pastel Sayur Ayam Kampung',
    'pastel-sayur-ayam-kampung',
    'Pastel renyah berkulit garing dengan isian wortel, kentang, bihun, telur, dan suwiran ayam kampung berbumbu rempah. Lengkap dengan cabai rawit.',
    20000,
    30,
    'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80',
    true,
    false
  ),
  (
    (SELECT id FROM cat WHERE slug = 'keripik-kering'),
    'Keripik Pisang Cokelat Lumer',
    'keripik-pisang-cokelat-lumer',
    'Irisan pisang kepok pilihan yang digoreng renyah lalu dibalut cokelat premium tebal tanpa pemanis buatan. Kemasan pouch 200g.',
    25000,
    50,
    'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80',
    true,
    true
  ),
  (
    (SELECT id FROM cat WHERE slug = 'keripik-kering'),
    'Basreng Pedas Daun Jeruk',
    'basreng-pedas-daun-jeruk',
    'Bakso ikan goreng renyah dengan taburan bumbu cabai asli dan irisan daun jeruk wangi yang bikin nagih. Kemasan 250g.',
    19000,
    45,
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80',
    true,
    false
  ),
  (
    (SELECT id FROM cat WHERE slug = 'minuman-segar'),
    'Es Cendol Dawet Gula Merah',
    'es-cendol-dawet-gula-merah',
    'Dawet pandan kenyal dipadukan dengan santan gurih dan sirup gula aren kental wangi nangka. Botol higienis 350ml.',
    14000,
    28,
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
    true,
    false
  ),
  (
    (SELECT id FROM cat WHERE slug = 'paket-hampers'),
    'Box Jajanan Pasar Tampah Mini',
    'box-jajanan-pasar-tampah-mini',
    'Paket berisi 20 pcs aneka jajanan pasar terbaik (klepon, kue lumpur, risol mayo, pastel, dan lemper) cocok untuk rapat atau kumpul keluarga.',
    75000,
    15,
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80',
    true,
    true
  )
ON CONFLICT (slug) DO NOTHING;

-- Catatan Admin:
-- Setelah membuat user admin di Supabase Authentication -> Users, jalankan perintah berikut
-- dengan mengganti UUID dan email sesuai user Anda:
--
-- INSERT INTO public.admins (user_id, email, full_name)
-- VALUES ('PASTE-USER-UUID-DI-SINI', 'admin@jajansalosa.com', 'Owner Jajan Salosa');
