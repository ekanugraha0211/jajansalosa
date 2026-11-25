import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownWideNarrow,
  Flame,
  Gift,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { SupabaseSetupNotice } from '../components/SupabaseSetupNotice';
import { useCart } from '../context/CartContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { fetchCategories, fetchProducts } from '../services/catalogService';
import type { Category, Product } from '../types';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export function HomePage() {
  const { syncCartWithProducts } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');

  const loadCatalog = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [catData, prodData] = await Promise.all([
        fetchCategories(),
        fetchProducts({ includeInactive: false }),
      ]);
      setCategories(catData);
      setProducts(prodData);
      syncCartWithProducts(prodData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat katalog produk.'
      );
    } finally {
      setLoading(false);
    }
  }, [syncCartWithProducts]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        (product.categories?.name.toLowerCase().includes(q) ?? false);

      return matchesCategory && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'newest') {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      }
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [products, selectedCategory, searchQuery, sortBy]);

  function handlePromoClick() {
    const hamperCategory = categories.find(
      (cat) =>
        cat.slug.includes('hampers') ||
        cat.name.toLowerCase().includes('hampers') ||
        cat.name.toLowerCase().includes('paket')
    );
    if (hamperCategory) {
      setSelectedCategory(hamperCategory.id);
    } else {
      setSelectedCategory('all');
    }
    const el = document.getElementById('katalog');
    el?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2C1810] via-[#462417] to-[#6B3318] text-white">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#D95D24]/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-amber-400/15 blur-3xl"
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-amber-200 text-xs sm:text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Fresh dari Dapur Jajan Salosa Setiap Pagi</span>
            </div>

            <h1 className="font-[var(--font-display)] text-3xl sm:text-5xl font-bold leading-tight tracking-tight">
              Nikmati Hangatnya{' '}
              <span className="text-amber-300">Jajanan Nusantara</span> &amp;
              Camilan Pilihan
            </h1>

            <p className="text-sm sm:text-base text-[#EAD8C8] max-w-xl leading-relaxed">
              Dari kue basah lembut, gorengan gurih renyah, hingga keripik
              kekinian. Pilih jajanan favoritmu dan pesan langsung lewat
              WhatsApp tanpa perlu daftar akun!
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href="#katalog"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#D95D24] hover:bg-[#EA6A2E] text-white font-bold text-sm sm:text-base shadow-lg shadow-[#D95D24]/30 transition-all"
              >
                Lihat Menu Jajanan
              </a>
              <button
                type="button"
                onClick={handlePromoClick}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm sm:text-base transition-colors cursor-pointer"
              >
                <Gift className="w-4 h-4 text-amber-300" />
                Paket Acara &amp; Hampers
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 max-w-lg text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#F3E5D8]">
                <Flame className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Masak Harian</span>
              </div>
              <div className="flex items-center gap-2 text-[#F3E5D8]">
                <Truck className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Antar Cepat</span>
              </div>
              <div className="flex items-center gap-2 text-[#F3E5D8]">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Tanpa Akun</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="relative rounded-3xl overflow-hidden border-4 border-white/15 shadow-2xl aspect-[4/3] bg-[#3E2014]">
              <img
                src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=85"
                alt="Aneka Jajanan Salosa"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/85 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400 text-[#2C1810] text-[11px] font-bold mb-1">
                    Menu Andalan
                  </span>
                  <p className="text-white font-bold text-base sm:text-lg leading-snug">
                    Box Tampah &amp; Camilan Harian
                  </p>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-white/95 text-[#D95D24] font-extrabold text-xs sm:text-sm shrink-0">
                  Mulai Rp 14rb
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Promosi */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <div className="rounded-2xl bg-gradient-to-r from-[#FDF1E6] via-[#FDEBD6] to-[#FEF3C7] border border-[#F3D2B3] p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#D95D24] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#B44312] bg-white/80 px-2.5 py-0.5 rounded-full mb-1">
                Promo Spesial Jajan Salosa
              </span>
              <h2 className="font-bold text-[#2C1810] text-base sm:text-lg">
                Pesan Snack Box &amp; Hampers Arisan Lebih Hemat!
              </h2>
              <p className="text-xs sm:text-sm text-[#6E4934]">
                Cocok untuk rapat kantor, pengajian, arisan, dan kumpul
                keluarga. Bisa request catatan khusus saat checkout.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePromoClick}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#2C1810] hover:bg-[#462619] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            Cek Paket Spesial
          </button>
        </div>
      </section>

      {!isSupabaseConfigured && (
        <div className="px-4 sm:px-6">
          <SupabaseSetupNotice />
        </div>
      )}

      {/* Katalog Produk */}
      <section id="katalog" className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-[#2C1810]">
              Katalog Jajanan
            </h2>
            <p className="text-sm text-[#7D5A44] mt-0.5">
              Pilih jajanan kesukaanmu, atur jumlahnya, dan pesan langsung.
            </p>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#8C6D58] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari klepon, risol, keripik..."
                aria-label="Cari produk jajanan"
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white border border-[#E5D5C3] text-sm text-[#2C1810] placeholder:text-[#A38875] focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Bersihkan pencarian"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8C6D58] hover:text-[#2C1810]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="relative">
              <ArrowDownWideNarrow className="w-4 h-4 text-[#8C6D58] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Urutkan produk"
                className="w-full sm:w-44 pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#E5D5C3] text-sm font-medium text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
              >
                <option value="featured">Paling Populer</option>
                <option value="newest">Terbaru</option>
                <option value="price-asc">Harga Terendah</option>
                <option value="price-desc">Harga Tertinggi</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Kategori */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#D95D24] text-white border-[#D95D24] shadow-xs'
                : 'bg-white text-[#5C3A28] border-[#E5D5C3] hover:border-[#D95D24] hover:text-[#D95D24]'
            }`}
          >
            Semua Jajanan
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#D95D24] text-white border-[#D95D24] shadow-xs'
                  : 'bg-white text-[#5C3A28] border-[#E5D5C3] hover:border-[#D95D24] hover:text-[#D95D24]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Status Loading / Error / Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-[#EFE2D3] overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-[#F3E7D9]" />
                <div className="p-4 space-y-2.5">
                  <div className="h-3 w-1/3 bg-[#F3E7D9] rounded" />
                  <div className="h-4 w-3/4 bg-[#F3E7D9] rounded" />
                  <div className="h-3 w-full bg-[#F3E7D9] rounded" />
                  <div className="h-8 w-full bg-[#F3E7D9] rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={loadCatalog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang Katalog
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#EFE2D3] p-10 text-center space-y-3">
            <p className="text-base font-bold text-[#2C1810]">
              Jajanan yang kamu cari belum ditemukan
            </p>
            <p className="text-sm text-[#7D5A44]">
              Coba ubah kata kunci pencarian atau pilih kategori lainnya.
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-[#D95D24] text-white text-sm font-semibold hover:bg-[#B94B19] cursor-pointer"
              >
                Reset Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
