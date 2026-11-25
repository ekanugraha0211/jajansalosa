-- ============================================================================
-- JAJAN SALOSA - SETUP LENGKAP SUPABASE (All-in-One)
-- Jalankan file ini di Supabase SQL Editor untuk membuat seluruh tabel,
-- RLS policies, fungsi create_order, storage bucket, dan data awal.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABEL
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL DEFAULT 'Admin Jajan Salosa',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (char_length(trim(name)) >= 2),
  slug text NOT NULL UNIQUE CHECK (char_length(trim(slug)) >= 2),
  description text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(trim(name)) >= 2),
  slug text NOT NULL UNIQUE CHECK (char_length(trim(slug)) >= 2),
  description text NOT NULL DEFAULT '',
  price integer NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE,
  customer_name text NOT NULL CHECK (char_length(trim(customer_name)) >= 2),
  customer_whatsapp text NOT NULL CHECK (char_length(trim(customer_whatsapp)) >= 8),
  customer_address text NOT NULL CHECK (char_length(trim(customer_address)) >= 5),
  notes text NOT NULL DEFAULT '',
  total_amount integer NOT NULL CHECK (total_amount > 0),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'processing', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price integer NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal integer NOT NULL CHECK (subtotal >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. KEAMANAN & RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
CREATE POLICY "admins_select_own"
  ON public.admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "categories_public_read" ON public.categories;
CREATE POLICY "categories_public_read"
  ON public.categories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "categories_admin_insert" ON public.categories;
CREATE POLICY "categories_admin_insert"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_update" ON public.categories;
CREATE POLICY "categories_admin_update"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "categories_admin_delete" ON public.categories;
CREATE POLICY "categories_admin_delete"
  ON public.categories FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "products_public_or_admin_read" ON public.products;
CREATE POLICY "products_public_or_admin_read"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "products_admin_insert" ON public.products;
CREATE POLICY "products_admin_insert"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_update" ON public.products;
CREATE POLICY "products_admin_update"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_admin_delete" ON public.products;
CREATE POLICY "products_admin_delete"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_select" ON public.orders;
CREATE POLICY "orders_admin_select"
  ON public.orders FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_insert" ON public.orders;
CREATE POLICY "orders_admin_insert"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_update" ON public.orders;
CREATE POLICY "orders_admin_update"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "orders_admin_delete" ON public.orders;
CREATE POLICY "orders_admin_delete"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_select" ON public.order_items;
CREATE POLICY "order_items_admin_select"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_insert" ON public.order_items;
CREATE POLICY "order_items_admin_insert"
  ON public.order_items FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_update" ON public.order_items;
CREATE POLICY "order_items_admin_update"
  ON public.order_items FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "order_items_admin_delete" ON public.order_items;
CREATE POLICY "order_items_admin_delete"
  ON public.order_items FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Pemulihan stok jika pesanan dibatalkan
CREATE OR REPLACE FUNCTION public.handle_order_status_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
BEGIN
  IF OLD.status <> 'cancelled' AND NEW.status = 'cancelled' THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id AND product_id IS NOT NULL
    LOOP
      UPDATE public.products
      SET stock = stock + v_item.quantity
      WHERE id = v_item.product_id;
    END LOOP;
  ELSIF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    FOR v_item IN
      SELECT oi.product_id, oi.quantity, p.stock, p.name
      FROM public.order_items oi
      JOIN public.products p ON p.id = oi.product_id
      WHERE oi.order_id = NEW.id AND oi.product_id IS NOT NULL
      FOR UPDATE OF p
    LOOP
      IF v_item.stock < v_item.quantity THEN
        RAISE EXCEPTION 'Stok produk "%" tidak mencukupi untuk mengaktifkan kembali pesanan ini', v_item.name;
      END IF;
      UPDATE public.products
      SET stock = stock - v_item.quantity
      WHERE id = v_item.product_id;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_status_stock ON public.orders;
CREATE TRIGGER trg_orders_status_stock
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_status_stock();

-- RPC Checkout Pelanggan
CREATE OR REPLACE FUNCTION public.create_order(
  p_customer_name text,
  p_customer_whatsapp text,
  p_customer_address text,
  p_notes text DEFAULT '',
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := trim(coalesce(p_customer_name, ''));
  v_whatsapp text := regexp_replace(coalesce(p_customer_whatsapp, ''), '[^0-9+]', '', 'g');
  v_address text := trim(coalesce(p_customer_address, ''));
  v_notes text := trim(coalesce(p_notes, ''));
  v_order_id uuid;
  v_order_code text;
  v_created_at timestamptz;
  v_total_amount integer := 0;
  v_item RECORD;
  v_product public.products%ROWTYPE;
  v_subtotal integer;
  v_result_items jsonb := '[]'::jsonb;
BEGIN
  IF char_length(v_name) < 2 THEN
    RAISE EXCEPTION 'Nama pelanggan minimal 2 karakter.';
  END IF;

  IF char_length(regexp_replace(v_whatsapp, '[^0-9]', '', 'g')) < 9
     OR char_length(regexp_replace(v_whatsapp, '[^0-9]', '', 'g')) > 16 THEN
    RAISE EXCEPTION 'Nomor WhatsApp tidak valid.';
  END IF;

  IF char_length(v_address) < 5 THEN
    RAISE EXCEPTION 'Alamat pengiriman minimal 5 karakter.';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang belanja tidak boleh kosong.';
  END IF;

  IF jsonb_array_length(p_items) > 50 THEN
    RAISE EXCEPTION 'Maksimal 50 jenis produk dalam satu pesanan.';
  END IF;

  FOR v_item IN
    SELECT
      (elem->>'product_id')::uuid AS product_id,
      sum((elem->>'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem->>'product_id')::uuid
    ORDER BY (elem->>'product_id')::uuid
  LOOP
    IF v_item.product_id IS NULL OR v_item.quantity IS NULL OR v_item.quantity <= 0 THEN
      RAISE EXCEPTION 'Jumlah produk harus lebih dari 0.';
    END IF;
    IF v_item.quantity > 999 THEN
      RAISE EXCEPTION 'Maksimal 999 unit per produk dalam satu pesanan.';
    END IF;
  END LOOP;

  v_order_code := 'JS-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' ||
                  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));

  INSERT INTO public.orders (
    order_code, customer_name, customer_whatsapp, customer_address, notes, total_amount, status
  )
  VALUES (
    v_order_code, v_name, v_whatsapp, v_address, v_notes, 1, 'pending'
  )
  RETURNING id, created_at INTO v_order_id, v_created_at;

  FOR v_item IN
    SELECT
      (elem->>'product_id')::uuid AS product_id,
      sum((elem->>'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem->>'product_id')::uuid
    ORDER BY (elem->>'product_id')::uuid
  LOOP
    SELECT * INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produk tidak ditemukan.';
    END IF;

    IF v_product.is_active IS NOT TRUE THEN
      RAISE EXCEPTION 'Produk "%" sedang tidak tersedia.', v_product.name;
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Stok "%" tersisa % pcs, tidak mencukupi pesanan Anda (% pcs).',
        v_product.name, v_product.stock, v_item.quantity;
    END IF;

    v_subtotal := v_product.price * v_item.quantity;
    v_total_amount := v_total_amount + v_subtotal;

    INSERT INTO public.order_items (
      order_id, product_id, product_name, unit_price, quantity, subtotal
    )
    VALUES (
      v_order_id, v_product.id, v_product.name, v_product.price, v_item.quantity, v_subtotal
    );

    UPDATE public.products SET stock = stock - v_item.quantity WHERE id = v_product.id;

    v_result_items := v_result_items || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit_price', v_product.price,
      'quantity', v_item.quantity,
      'subtotal', v_subtotal
    );
  END LOOP;

  UPDATE public.orders SET total_amount = v_total_amount WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'created_at', v_created_at,
    'customer_name', v_name,
    'customer_whatsapp', v_whatsapp,
    'customer_address', v_address,
    'notes', v_notes,
    'total_amount', v_total_amount,
    'status', 'pending',
    'items', v_result_items
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order(text, text, text, text, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_order(text, text, text, text, jsonb) TO anon, authenticated;

-- 3. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "product_images_admin_insert" ON storage.objects;
CREATE POLICY "product_images_admin_insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin());

-- 4. DATA AWAL (SEED)
INSERT INTO public.categories (name, slug, description, sort_order)
VALUES
  ('Kue Basah', 'kue-basah', 'Aneka kue tradisional lembut yang dibuat segar setiap pagi.', 1),
  ('Gorengan & Gurih', 'gorengan-gurih', 'Camilan renyah dan gurih favorit keluarga.', 2),
  ('Keripik & Kering', 'keripik-kering', 'Camilan kering tahan lama cocok untuk stok di rumah.', 3),
  ('Minuman Segar', 'minuman-segar', 'Minuman tradisional dan kekinian penyegar dahaga.', 4),
  ('Paket Hampers', 'paket-hampers', 'Paket pilihan spesial untuk acara, arisan, dan hantaran.', 5)
ON CONFLICT (slug) DO NOTHING;

WITH cat AS (SELECT id, slug FROM public.categories)
INSERT INTO public.products (category_id, name, slug, description, price, stock, image_url, is_active, is_featured)
VALUES
  ((SELECT id FROM cat WHERE slug = 'kue-basah'), 'Klepon Gula Aren Premium', 'klepon-gula-aren-premium', 'Bola ketan lembut beraroma daun pandan asli dengan isian gula aren cair yang lumer di mulut dan balutan kelapa parut segar. Isi 10 pcs per kotak.', 15000, 35, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=900&q=80', true, true),
  ((SELECT id FROM cat WHERE slug = 'kue-basah'), 'Kue Lumpur Kentang Kismis', 'kue-lumpur-kentang-kismis', 'Kue lumpur lembut berbahan kentang pilihan dan santan segar, dipanggang sempurna dengan topping kismis manis. Isi 6 pcs per box.', 18000, 24, 'https://images.unsplash.com/photo-1587241321921-91a834d6d191?auto=format&fit=crop&w=900&q=80', true, true),
  ((SELECT id FROM cat WHERE slug = 'gorengan-gurih'), 'Risol Mayo Smoked Beef', 'risol-mayo-smoked-beef', 'Kulit risol tipis renyah berisi smoked beef, telur rebus, keju, dan saus mayonnaise creamy racikan spesial Jajan Salosa. Isi 5 pcs.', 22000, 40, 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80', true, true),
  ((SELECT id FROM cat WHERE slug = 'gorengan-gurih'), 'Pastel Sayur Ayam Kampung', 'pastel-sayur-ayam-kampung', 'Pastel renyah berkulit garing dengan isian wortel, kentang, bihun, telur, dan suwiran ayam kampung berbumbu rempah. Lengkap dengan cabai rawit.', 20000, 30, 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=900&q=80', true, false),
  ((SELECT id FROM cat WHERE slug = 'keripik-kering'), 'Keripik Pisang Cokelat Lumer', 'keripik-pisang-cokelat-lumer', 'Irisan pisang kepok pilihan yang digoreng renyah lalu dibalut cokelat premium tebal tanpa pemanis buatan. Kemasan pouch 200g.', 25000, 50, 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=900&q=80', true, true),
  ((SELECT id FROM cat WHERE slug = 'keripik-kering'), 'Basreng Pedas Daun Jeruk', 'basreng-pedas-daun-jeruk', 'Bakso ikan goreng renyah dengan taburan bumbu cabai asli dan irisan daun jeruk wangi yang bikin nagih. Kemasan 250g.', 19000, 45, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=900&q=80', true, false),
  ((SELECT id FROM cat WHERE slug = 'minuman-segar'), 'Es Cendol Dawet Gula Merah', 'es-cendol-dawet-gula-merah', 'Dawet pandan kenyal dipadukan dengan santan gurih dan sirup gula aren kental wangi nangka. Botol higienis 350ml.', 14000, 28, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80', true, false),
  ((SELECT id FROM cat WHERE slug = 'paket-hampers'), 'Box Jajanan Pasar Tampah Mini', 'box-jajanan-pasar-tampah-mini', 'Paket berisi 20 pcs aneka jajanan pasar terbaik (klepon, kue lumpur, risol mayo, pastel, dan lemper) cocok untuk rapat atau kumpul keluarga.', 75000, 15, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=900&q=80', true, true)
ON CONFLICT (slug) DO NOTHING;
