-- ============================================================================
-- JAJAN SALOSA - 002_rls_and_rpc.sql
-- Row Level Security (RLS) & fungsi backend create_order untuk validasi harga,
-- stok, dan total pesanan secara aman di PostgreSQL.
-- ============================================================================

-- Helper: cek apakah pengguna saat ini adalah admin terdaftar
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Aktifkan RLS di seluruh tabel
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Kebijakan tabel ADMINS (hanya bisa baca baris milik sendiri; tidak bisa dimodifikasi klien)
DROP POLICY IF EXISTS "admins_select_own" ON public.admins;
CREATE POLICY "admins_select_own"
  ON public.admins FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Kebijakan tabel CATEGORIES (publik baca, hanya admin ubah)
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

-- Kebijakan tabel PRODUCTS (publik hanya lihat produk aktif; admin lihat & kelola semua)
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

-- Kebijakan tabel ORDERS (data pelanggan HANYA dapat diakses oleh admin;
-- pelanggan membuat pesanan melalui RPC create_order agar harga/total divalidasi backend)
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

-- Kebijakan tabel ORDER_ITEMS (hanya admin)
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

-- Trigger pemulihan stok otomatis jika status pesanan diubah ke/dari 'cancelled'
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

-- RPC Aman untuk Checkout Pelanggan (Guest Checkout)
-- Memvalidasi input, mengunci stok produk, mengambil harga resmi dari database,
-- menghitung subtotal & total_amount di server, mengurangi stok, dan menyimpan pesanan.
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

  -- Validasi awal struktur item
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

  -- Buat order code unik
  v_order_code := 'JS-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYYMMDD') || '-' ||
                  upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));

  -- Buat header order sementara dengan total_amount = 1 (akan diperbarui setelah hitung item)
  INSERT INTO public.orders (
    order_code,
    customer_name,
    customer_whatsapp,
    customer_address,
    notes,
    total_amount,
    status
  )
  VALUES (
    v_order_code,
    v_name,
    v_whatsapp,
    v_address,
    v_notes,
    1,
    'pending'
  )
  RETURNING id, created_at INTO v_order_id, v_created_at;

  -- Kunci baris produk sesuai urutan ID agar terhindar dari deadlock & race condition
  FOR v_item IN
    SELECT
      (elem->>'product_id')::uuid AS product_id,
      sum((elem->>'quantity')::integer)::integer AS quantity
    FROM jsonb_array_elements(p_items) AS elem
    GROUP BY (elem->>'product_id')::uuid
    ORDER BY (elem->>'product_id')::uuid
  LOOP
    SELECT *
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id
    FOR UPDATE;

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
      order_id,
      product_id,
      product_name,
      unit_price,
      quantity,
      subtotal
    )
    VALUES (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.price,
      v_item.quantity,
      v_subtotal
    );

    UPDATE public.products
    SET stock = stock - v_item.quantity
    WHERE id = v_product.id;

    v_result_items := v_result_items || jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit_price', v_product.price,
      'quantity', v_item.quantity,
      'subtotal', v_subtotal
    );
  END LOOP;

  IF v_total_amount <= 0 THEN
    RAISE EXCEPTION 'Total pesanan tidak valid.';
  END IF;

  UPDATE public.orders
  SET total_amount = v_total_amount
  WHERE id = v_order_id;

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
