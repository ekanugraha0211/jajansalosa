import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Globe,
  ImagePlus,
  RotateCcw,
  Save,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useToast } from '../../context/ToastContext';
import {
  deleteBrandingAssetByUrl,
  updateStoreSettings,
  uploadBrandingAsset,
} from '../../services/settingsService';
import type { StoreSettingsFormValues } from '../../types';

export function AdminBrandingTab() {
  const { settings, setSettingsLocal } = useStoreSettings();
  const { showToast } = useToast();

  const [form, setForm] = useState<StoreSettingsFormValues>({
    store_name: settings.store_name,
    logo_url: settings.logo_url,
    favicon_url: settings.favicon_url,
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      store_name: settings.store_name,
      logo_url: settings.logo_url,
      favicon_url: settings.favicon_url,
    });
  }, [settings]);

  async function handleFileUpload(
    e: ChangeEvent<HTMLInputElement>,
    kind: 'logo' | 'favicon'
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (kind === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const url = await uploadBrandingAsset(file, kind);
      setForm((prev) => ({
        ...prev,
        [kind === 'logo' ? 'logo_url' : 'favicon_url']: url,
      }));
      showToast(
        `${kind === 'logo' ? 'Logo toko' : 'Ikon tab'} berhasil diunggah. Klik "Simpan Pengaturan" untuk menerapkan.`
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengunggah gambar.',
        'error'
      );
    } finally {
      if (kind === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
      e.target.value = '';
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.store_name.trim()) {
      showToast('Nama toko minimal 2 karakter.', 'error');
      return;
    }

    setSaving(true);
    try {
      const previousLogo = settings.logo_url;
      const previousFavicon = settings.favicon_url;

      const updated = await updateStoreSettings(form);
      setSettingsLocal(updated);

      if (previousLogo && previousLogo !== updated.logo_url) {
        await deleteBrandingAssetByUrl(previousLogo);
      }
      if (previousFavicon && previousFavicon !== updated.favicon_url) {
        await deleteBrandingAssetByUrl(previousFavicon);
      }

      showToast('Logo dan ikon tab berhasil diperbarui!');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#EFE2D3] p-5 sm:p-6 shadow-xs space-y-6">
        <div>
          <h2 className="font-[var(--font-display)] text-xl font-bold text-[#2C1810]">
            Pengaturan Logo &amp; Ikon Tab Browser
          </h2>
          <p className="text-xs sm:text-sm text-[#7D5A44] mt-1">
            Sesuaikan identitas visual toko Anda. Perubahan logo tampil di
            header &amp; footer, sedangkan ikon tab (favicon) langsung berubah
            di tab browser pengunjung.
          </p>
        </div>

        {/* Nama Toko */}
        <div className="max-w-md">
          <label
            htmlFor="brand_store_name"
            className="block text-xs font-bold text-[#5C3A28] mb-1.5"
          >
            Nama Toko
          </label>
          <input
            id="brand_store_name"
            type="text"
            required
            minLength={2}
            value={form.store_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, store_name: e.target.value }))
            }
            placeholder="Jajan Salosa"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Logo Toko */}
          <div className="rounded-2xl border border-[#EFE2D3] bg-[#FFFBF5] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2C1810]">
                  Logo Toko
                </h3>
                <p className="text-xs text-[#7D5A44]">
                  Rekomendasi rasio 1:1 (persegi), format PNG/WebP/SVG maks 2 MB.
                </p>
              </div>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, logo_url: null }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Preview Navbar */}
            <div className="rounded-xl bg-white border border-[#E5D5C3] p-3 flex items-center gap-3">
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Preview logo"
                  className="w-11 h-11 rounded-xl object-contain bg-white border border-[#EFE2D3] p-0.5 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#D95D24] to-[#B44312] text-white flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              )}
              <div className="leading-tight">
                <span className="font-[var(--font-display)] font-bold text-base text-[#2C1810] block">
                  {form.store_name || 'Jajan Salosa'}
                </span>
                <span className="text-[11px] text-[#8C5A3C]">
                  Pratinjau tampilan di Navbar
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FDF1E6] hover:bg-[#FCE3CE] text-[#B44312] text-xs font-bold cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                {uploadingLogo ? 'Mengunggah Logo...' : 'Upload Logo Baru'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  disabled={uploadingLogo}
                  onChange={(e) => handleFileUpload(e, 'logo')}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={form.logo_url ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    logo_url: e.target.value || null,
                  }))
                }
                placeholder="Atau tempel URL logo (https://...)"
                className="w-full px-3 py-2 rounded-xl border border-[#E5D5C3] bg-white text-xs"
              />
            </div>
          </div>

          {/* Ikon Tab (Favicon) */}
          <div className="rounded-2xl border border-[#EFE2D3] bg-[#FFFBF5] p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#2C1810]">
                  Ikon Tab Browser (Favicon)
                </h3>
                <p className="text-xs text-[#7D5A44]">
                  Rekomendasi 64x64 px atau 128x128 px, format PNG/ICO/SVG maks 2
                  MB.
                </p>
              </div>
              {form.favicon_url && (
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, favicon_url: null }))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              )}
            </div>

            {/* Preview Tab Browser */}
            <div className="rounded-xl bg-[#EAE2D8] p-2.5 pb-0 border border-[#DFD3C5]">
              <div className="inline-flex items-center gap-2 bg-white rounded-t-xl px-3.5 py-2 border border-b-0 border-[#DFD3C5] max-w-full">
                {form.favicon_url ? (
                  <img
                    src={form.favicon_url}
                    alt="Preview favicon"
                    className="w-4 h-4 rounded-xs object-contain shrink-0"
                  />
                ) : (
                  <Globe className="w-4 h-4 text-[#D95D24] shrink-0" />
                )}
                <span className="text-xs font-semibold text-[#2C1810] truncate max-w-[200px]">
                  {form.store_name || 'Jajan Salosa'} — Jajanan Pilihan
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FDF1E6] hover:bg-[#FCE3CE] text-[#B44312] text-xs font-bold cursor-pointer">
                <ImagePlus className="w-4 h-4" />
                {uploadingFavicon
                  ? 'Mengunggah Ikon Tab...'
                  : 'Upload Ikon Tab Baru'}
                <input
                  type="file"
                  accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/svg+xml,image/webp,.ico"
                  disabled={uploadingFavicon}
                  onChange={(e) => handleFileUpload(e, 'favicon')}
                  className="hidden"
                />
              </label>

              <input
                type="url"
                value={form.favicon_url ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    favicon_url: e.target.value || null,
                  }))
                }
                placeholder="Atau tempel URL ikon tab (https://...)"
                className="w-full px-3 py-2 rounded-xl border border-[#E5D5C3] bg-white text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-[#F4EAE0]">
          <button
            type="submit"
            disabled={saving || uploadingLogo || uploadingFavicon}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white text-sm font-bold shadow-xs disabled:opacity-60 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </div>
    </form>
  );
}
