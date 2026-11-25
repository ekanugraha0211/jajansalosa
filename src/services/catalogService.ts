import { requireSupabase } from '../lib/supabase';
import type {
  Category,
  CategoryFormValues,
  Product,
  ProductFormValues,
} from '../types';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PRODUCT_BUCKET = 'product-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function fetchCategories(): Promise<Category[]> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Category[];
}

export async function createCategory(values: CategoryFormValues): Promise<Category> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .insert({
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      sort_order: Number(values.sort_order) || 0,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}

export async function updateCategory(
  id: string,
  values: CategoryFormValues
): Promise<Category> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('categories')
    .update({
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      sort_order: Number(values.sort_order) || 0,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function fetchProducts(options?: {
  includeInactive?: boolean;
}): Promise<Product[]> {
  const client = requireSupabase();
  let query = client
    .from('products')
    .select('*, categories(id, name, slug)')
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (!options?.includeInactive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function fetchProductBySlugOrId(
  identifier: string
): Promise<Product | null> {
  const client = requireSupabase();
  const column = UUID_REGEX.test(identifier) ? 'id' : 'slug';

  const { data, error } = await client
    .from('products')
    .select('*, categories(id, name, slug)')
    .eq(column, identifier)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as Product | null) ?? null;
}

export async function createProduct(values: ProductFormValues): Promise<Product> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('products')
    .insert({
      name: values.name.trim(),
      slug: values.slug.trim(),
      category_id: values.category_id || null,
      description: values.description.trim(),
      price: Math.max(0, Math.round(Number(values.price))),
      stock: Math.max(0, Math.round(Number(values.stock))),
      image_url: values.image_url,
      is_active: values.is_active,
      is_featured: values.is_featured,
    })
    .select('*, categories(id, name, slug)')
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function updateProduct(
  id: string,
  values: ProductFormValues
): Promise<Product> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('products')
    .update({
      name: values.name.trim(),
      slug: values.slug.trim(),
      category_id: values.category_id || null,
      description: values.description.trim(),
      price: Math.max(0, Math.round(Number(values.price))),
      stock: Math.max(0, Math.round(Number(values.stock))),
      image_url: values.image_url,
      is_active: values.is_active,
      is_featured: values.is_featured,
    })
    .eq('id', id)
    .select('*, categories(id, name, slug)')
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function toggleProductActive(
  id: string,
  isActive: boolean
): Promise<Product> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('*, categories(id, name, slug)')
    .single();

  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Format foto harus JPG, PNG, atau WebP.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Ukuran foto maksimal 5 MB.');
  }

  const client = requireSupabase();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const randomPart = Math.random().toString(36).slice(2, 10);
  const filePath = `products/${Date.now()}-${randomPart}.${safeExt}`;

  const { error: uploadError } = await client.storage
    .from(PRODUCT_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) {
    throw new Error(`Gagal mengunggah foto: ${uploadError.message}`);
  }

  const { data } = client.storage.from(PRODUCT_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteProductImageByUrl(url: string | null): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${PRODUCT_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const filePath = decodeURIComponent(url.slice(idx + marker.length));
  if (!filePath) return;

  try {
    const client = requireSupabase();
    await client.storage.from(PRODUCT_BUCKET).remove([filePath]);
  } catch {
    // Abaikan kegagalan hapus file lama agar tidak memblokir operasi utama
  }
}
