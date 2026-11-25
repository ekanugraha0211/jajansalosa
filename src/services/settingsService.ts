import { requireSupabase, STORE_NAME } from '../lib/supabase';
import type { StoreSettings, StoreSettingsFormValues } from '../types';

const BRANDING_BUCKET = 'branding';
const MAX_BRANDING_BYTES = 2 * 1024 * 1024;
const ALLOWED_BRANDING_MIMES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/x-icon',
  'image/vnd.microsoft.icon',
];

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  id: 'default',
  store_name: STORE_NAME,
  logo_url: null,
  favicon_url: null,
};

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('store_settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    // Jika migrasi 005_store_settings.sql belum dijalankan, gunakan nilai default agar toko tetap berjalan
    return DEFAULT_STORE_SETTINGS;
  }

  return (data as StoreSettings | null) ?? DEFAULT_STORE_SETTINGS;
}

export async function updateStoreSettings(
  values: StoreSettingsFormValues
): Promise<StoreSettings> {
  const client = requireSupabase();
  const cleanName = values.store_name.trim() || STORE_NAME;

  const { data, error } = await client
    .from('store_settings')
    .upsert(
      {
        id: 'default',
        store_name: cleanName,
        logo_url: values.logo_url?.trim() || null,
        favicon_url: values.favicon_url?.trim() || null,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('store_settings') || msg.includes('permission denied')) {
      throw new Error(
        'Tabel store_settings belum siap. Jalankan skrip supabase/migrations/005_store_settings.sql di Supabase SQL Editor.'
      );
    }
    throw new Error(error.message);
  }

  return data as StoreSettings;
}

export async function uploadBrandingAsset(
  file: File,
  kind: 'logo' | 'favicon'
): Promise<string> {
  const isIcoExtension = file.name.toLowerCase().endsWith('.ico');
  if (!ALLOWED_BRANDING_MIMES.includes(file.type) && !isIcoExtension) {
    throw new Error('Format file harus PNG, JPG, WebP, SVG, atau ICO.');
  }
  if (file.size > MAX_BRANDING_BYTES) {
    throw new Error('Ukuran file maksimal 2 MB.');
  }

  const client = requireSupabase();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'ico'].includes(ext)
    ? ext
    : 'png';
  const randomPart = Math.random().toString(36).slice(2, 10);
  const filePath = `${kind}/${Date.now()}-${randomPart}.${safeExt}`;

  const { error: uploadError } = await client.storage
    .from(BRANDING_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || (isIcoExtension ? 'image/x-icon' : 'image/png'),
    });

  if (uploadError) {
    if (uploadError.message.toLowerCase().includes('bucket')) {
      throw new Error(
        'Bucket Storage "branding" belum tersedia. Jalankan skrip supabase/migrations/005_store_settings.sql di Supabase SQL Editor.'
      );
    }
    throw new Error(`Gagal mengunggah ${kind}: ${uploadError.message}`);
  }

  const { data } = client.storage.from(BRANDING_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function deleteBrandingAssetByUrl(url: string | null): Promise<void> {
  if (!url) return;
  const marker = `/storage/v1/object/public/${BRANDING_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;

  const filePath = decodeURIComponent(url.slice(idx + marker.length));
  if (!filePath) return;

  try {
    const client = requireSupabase();
    await client.storage.from(BRANDING_BUCKET).remove([filePath]);
  } catch {
    // Abaikan kegagalan hapus file lama
  }
}
