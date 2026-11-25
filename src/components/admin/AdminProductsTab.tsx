import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Edit3,
  ImagePlus,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatRupiah, slugify } from '../../lib/format';
import {
  createProduct,
  deleteProduct,
  deleteProductImageByUrl,
  toggleProductActive,
  updateProduct,
  uploadProductImage,
} from '../../services/catalogService';
import type { Category, Product, ProductFormValues } from '../../types';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80';

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => Promise<void>;
}

const emptyForm: ProductFormValues = {
  name: '',
  slug: '',
  category_id: '',
  description: '',
  price: 15000,
  stock: 20,
  image_url: null,
  is_active: true,
  is_featured: false,
};

export function AdminProductsTab({
  products,
  categories,
  onRefresh,
}: AdminProductsTabProps) {
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyForm);
  const [slugEditedManually, setSlugEditedManually] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.categories?.name.toLowerCase().includes(q) ?? false);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  function openCreateModal() {
    setEditingProduct(null);
    setForm({
      ...emptyForm,
      category_id: categories[0]?.id ?? '',
    });
    setSlugEditedManually(false);
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      category_id: product.category_id ?? '',
      description: product.description,
      price: product.price,
      stock: product.stock,
      image_url: product.image_url,
      is_active: product.is_active,
      is_featured: product.is_featured,
    });
    setSlugEditedManually(true);
    setModalOpen(true);
  }

  async function handleImageFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const publicUrl = await uploadProductImage(file);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      showToast('Foto produk berhasil diunggah.');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengunggah foto.',
        'error'
      );
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  async function handleSaveProduct(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Nama produk wajib diisi.', 'error');
      return;
    }

    const finalSlug = form.slug.trim() || slugify(form.name);
    if (!finalSlug) {
      showToast('Slug produk tidak valid.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: ProductFormValues = {
        ...form,
        slug: finalSlug,
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        if (
          editingProduct.image_url &&
          editingProduct.image_url !== payload.image_url
        ) {
          await deleteProductImageByUrl(editingProduct.image_url);
        }
        showToast(`Produk "${payload.name}" diperbarui.`);
      } else {
        await createProduct(payload);
        showToast(`Produk "${payload.name}" ditambahkan.`);
      }

      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menyimpan produk.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(product: Product) {
    setBusyId(product.id);
    try {
      await toggleProductActive(product.id, !product.is_active);
      showToast(
        `Produk "${product.name}" ${
          !product.is_active ? 'diaktifkan' : 'dinonaktifkan'
        }.`
      );
      await onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengubah status produk.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteProduct(product: Product) {
    const confirmed = window.confirm(
      `Hapus produk "${product.name}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setBusyId(product.id);
    try {
      await deleteProduct(product.id);
      if (product.image_url) {
        await deleteProductImageByUrl(product.image_url);
      }
      showToast(`Produk "${product.name}" dihapus.`);
      await onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menghapus produk.',
        'error'
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2.5 flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-[#8C6D58] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama produk..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5D5C3] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
            }
            aria-label="Filter status produk"
            className="px-3 py-2 rounded-xl border border-[#E5D5C3] bg-white text-sm font-medium text-[#2C1810]"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white text-sm font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </button>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EFE2D3] p-8 text-center text-sm text-[#7D5A44]">
          Belum ada produk yang cocok dengan filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EFE2D3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF2E6] text-[#5C3A28] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">Produk</th>
                  <th className="px-4 py-3 font-bold">Kategori</th>
                  <th className="px-4 py-3 font-bold">Harga</th>
                  <th className="px-4 py-3 font-bold">Stok</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EAE0]">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FFFBF5]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[200px]">
                        <img
                          src={product.image_url || FALLBACK_IMAGE}
                          alt={product.name}
                          className="w-12 h-12 rounded-xl object-cover bg-[#F8EFE4] shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                        <div>
                          <div className="font-bold text-[#2C1810]">
                            {product.name}
                          </div>
                          {product.is_featured && (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Favorit
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#6E4934]">
                      {product.categories?.name || '-'}
                    </td>
                    <td className="px-4 py-3 font-bold text-[#D95D24]">
                      {formatRupiah(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          product.stock <= 5
                            ? 'text-rose-600'
                            : 'text-[#2C1810]'
                        }`}
                      >
                        {product.stock} pcs
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={busyId === product.id}
                        onClick={() => handleToggleActive(product)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                          product.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {product.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          aria-label={`Edit ${product.name}`}
                          className="p-2 rounded-lg text-[#5C3A28] hover:bg-[#FDF1E6] hover:text-[#D95D24] cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busyId === product.id}
                          onClick={() => handleDeleteProduct(product)}
                          aria-label={`Hapus ${product.name}`}
                          className="p-2 rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Produk */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EFE2D3] w-full max-w-xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-[var(--font-display)] text-xl font-bold text-[#2C1810]">
                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C6D58] hover:bg-[#FAF2E6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Upload Foto */}
              <div>
                <label className="block text-xs font-bold text-[#5C3A28] mb-1.5">
                  Foto Produk
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-[#F8EFE4] border border-[#E5D5C3] overflow-hidden flex items-center justify-center shrink-0">
                    {form.image_url ? (
                      <img
                        src={form.image_url}
                        alt="Preview produk"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImagePlus className="w-7 h-7 text-[#A38875]" />
                    )}
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FDF1E6] hover:bg-[#FCE3CE] text-[#B44312] text-xs font-bold cursor-pointer">
                      <ImagePlus className="w-4 h-4" />
                      {uploadingImage ? 'Mengunggah...' : 'Upload Foto (JPG/PNG/WebP)'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingImage}
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="url"
                      value={form.image_url ?? ''}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          image_url: e.target.value || null,
                        }))
                      }
                      placeholder="Atau tempel URL foto produk (https://...)"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name: nextName,
                        slug: slugEditedManually ? prev.slug : slugify(nextName),
                      }));
                    }}
                    placeholder="Contoh: Klepon Gula Aren"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Slug URL *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugEditedManually(true);
                      setForm((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }));
                    }}
                    placeholder="klepon-gula-aren"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Kategori
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  >
                    <option value="">Tanpa Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    required
                    value={form.price}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        price: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Stok (pcs) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.stock}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        stock: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                  Deskripsi Produk
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Jelaskan rasa, isi per kemasan, dan bahan unggulan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-5 pt-1">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[#2C1810] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, is_active: e.target.checked }))
                    }
                    className="w-4 h-4 accent-[#D95D24]"
                  />
                  Aktif (tampil di toko)
                </label>

                <label className="inline-flex items-center gap-2 text-sm font-medium text-[#2C1810] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_featured: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 accent-[#D95D24]"
                  />
                  Tandai Produk Favorit
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F4EAE0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5D5C3] text-sm font-semibold text-[#5C3A28] hover:bg-[#FAF2E6] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingImage}
                  className="px-5 py-2.5 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Produk'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
