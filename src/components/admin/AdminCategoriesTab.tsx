import { useState, type FormEvent } from 'react';
import { Edit3, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { slugify } from '../../lib/format';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../services/catalogService';
import type { Category, CategoryFormValues, Product } from '../../types';

interface AdminCategoriesTabProps {
  categories: Category[];
  products: Product[];
  onRefresh: () => Promise<void>;
}

const emptyCategory: CategoryFormValues = {
  name: '',
  slug: '',
  description: '',
  sort_order: 0,
};

export function AdminCategoriesTab({
  categories,
  products,
  onRefresh,
}: AdminCategoriesTabProps) {
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormValues>(emptyCategory);
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);

  function countProductsInCategory(catId: string): number {
    return products.filter((p) => p.category_id === catId).length;
  }

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyCategory,
      sort_order: categories.length + 1,
    });
    setSlugManual(false);
    setModalOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      sort_order: cat.sort_order,
    });
    setSlugManual(true);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const finalSlug = form.slug.trim() || slugify(form.name);
    if (!form.name.trim() || !finalSlug) {
      showToast('Nama dan slug kategori wajib diisi.', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, slug: finalSlug };
      if (editing) {
        await updateCategory(editing.id, payload);
        showToast(`Kategori "${payload.name}" diperbarui.`);
      } else {
        await createCategory(payload);
        showToast(`Kategori "${payload.name}" ditambahkan.`);
      }
      setModalOpen(false);
      await onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menyimpan kategori.',
        'error'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cat: Category) {
    const count = countProductsInCategory(cat.id);
    const confirmed = window.confirm(
      count > 0
        ? `Kategori "${cat.name}" masih dipakai oleh ${count} produk. Hapus kategori ini? (Produk akan menjadi tanpa kategori)`
        : `Hapus kategori "${cat.name}"?`
    );
    if (!confirmed) return;

    try {
      await deleteCategory(cat.id);
      showToast(`Kategori "${cat.name}" dihapus.`);
      await onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal menghapus kategori.',
        'error'
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-[#6E4934]">
          Atur kategori jajanan agar pelanggan lebih mudah menjelajah menu.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white text-sm font-bold shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tambah Kategori
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EFE2D3] p-8 text-center text-sm text-[#7D5A44]">
          Belum ada kategori. Tambahkan kategori pertama Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-[#EFE2D3] p-4 flex flex-col justify-between gap-3 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-[#2C1810]">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-[#8C6D58]">
                      /{cat.slug} • Urutan {cat.sort_order}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#FDF1E6] text-[#B44312] text-xs font-bold shrink-0">
                    {countProductsInCategory(cat.id)} produk
                  </span>
                </div>
                {cat.description && (
                  <p className="text-xs text-[#6E4934] mt-2 line-clamp-2">
                    {cat.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F4EAE0]">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#5C3A28] hover:bg-[#FDF1E6] hover:text-[#D95D24] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EFE2D3] w-full max-w-md p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-[var(--font-display)] text-xl font-bold text-[#2C1810]">
                {editing ? 'Edit Kategori' : 'Tambah Kategori'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#8C6D58] hover:bg-[#FAF2E6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                  Nama Kategori *
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
                      slug: slugManual ? prev.slug : slugify(nextName),
                    }));
                  }}
                  placeholder="Contoh: Kue Basah"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManual(true);
                      setForm((prev) => ({
                        ...prev,
                        slug: slugify(e.target.value),
                      }));
                    }}
                    placeholder="kue-basah"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                    Urutan Tampil
                  </label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sort_order: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5C3A28] mb-1">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Deskripsi kategori..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#F4EAE0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5D5C3] text-sm font-semibold text-[#5C3A28] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white text-sm font-bold disabled:opacity-60 cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
