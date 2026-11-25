import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../lib/format';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchProductBySlugOrId,
  fetchProducts,
} from '../services/catalogService';
import type { Product } from '../types';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1000&q=80';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem, getItemQuantity } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setLoading(true);
      setError(null);
      try {
        const found = await fetchProductBySlugOrId(slug!);
        if (cancelled) return;
        setProduct(found);
        setQuantity(1);

        if (found) {
          const allProducts = await fetchProducts({ includeInactive: false });
          if (cancelled) return;
          const related = allProducts
            .filter(
              (p) =>
                p.id !== found.id &&
                (found.category_id ? p.category_id === found.category_id : true)
            )
            .slice(0, 4);
          setRelatedProducts(related);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Gagal memuat detail produk.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDetail();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="aspect-square rounded-3xl bg-[#F3E7D9]" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-28 bg-[#F3E7D9] rounded" />
            <div className="h-8 w-3/4 bg-[#F3E7D9] rounded" />
            <div className="h-7 w-40 bg-[#F3E7D9] rounded" />
            <div className="h-24 w-full bg-[#F3E7D9] rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center space-y-4">
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-[#2C1810]">
          {error ? 'Terjadi Kesalahan' : 'Produk Tidak Ditemukan'}
        </h1>
        <p className="text-sm text-[#7D5A44]">
          {error ||
            'Produk mungkin sudah tidak tersedia atau tautan tidak valid.'}
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D95D24] text-white text-sm font-bold hover:bg-[#B94B19]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Katalog
        </Link>
      </main>
    );
  }

  const inCartQty = getItemQuantity(product.id);
  const remainingAddable = Math.max(0, product.stock - inCartQty);
  const isOutOfStock = product.stock <= 0;

  function handleAddToCart(redirectToCart = false) {
    if (!product) return;
    const result = addItem(product, quantity);
    if (result.ok) {
      if (redirectToCart) {
        navigate('/keranjang');
      } else {
        showToast(
          `${quantity}x "${product.name}" ditambahkan ke keranjang.`
        );
      }
    } else if (result.message) {
      showToast(result.message, 'error');
    }
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7D5A44] hover:text-[#D95D24] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 sm:gap-10 items-start bg-white rounded-3xl border border-[#EFE2D3] p-4 sm:p-6 shadow-xs">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F8EFE4]">
          <img
            src={product.image_url || FALLBACK_IMAGE}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
          {product.is_featured && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-[#2C1810] shadow-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Favorit Pelanggan
            </span>
          )}
        </div>

        <div className="flex flex-col justify-between space-y-5 py-1">
          <div className="space-y-3">
            {product.categories?.name && (
              <span className="inline-block px-3 py-1 rounded-full bg-[#FDF1E6] text-[#B44312] text-xs font-bold">
                {product.categories.name}
              </span>
            )}

            <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-[#2C1810] leading-tight">
              {product.name}
            </h1>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#D95D24]">
              {formatRupiah(product.price)}
            </div>

            <div className="flex items-center gap-2 text-sm">
              {isOutOfStock ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-semibold">
                  Stok Sedang Habis
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Tersedia {product.stock} pcs
                </span>
              )}

              {inCartQty > 0 && (
                <span className="text-xs font-medium text-[#7D5A44]">
                  ({inCartQty} sudah di keranjang)
                </span>
              )}
            </div>

            <div className="pt-2 border-t border-[#F4EAE0]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C6D58] mb-1.5">
                Deskripsi Produk
              </h2>
              <p className="text-sm sm:text-base text-[#5C3A28] leading-relaxed whitespace-pre-line">
                {product.description ||
                  'Dibuat segar dengan bahan-bahan pilihan khas Jajan Salosa.'}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-3 border-t border-[#F4EAE0]">
            {!isOutOfStock && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5C3A28]">
                  Jumlah Pesanan
                </span>
                <div className="inline-flex items-center rounded-xl border border-[#E5D5C3] bg-[#FFFBF5]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Kurangi jumlah"
                    className="p-2.5 text-[#5C3A28] hover:text-[#D95D24] disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-[#2C1810]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        Math.min(Math.max(1, remainingAddable), q + 1)
                      )
                    }
                    disabled={quantity >= remainingAddable}
                    aria-label="Tambah jumlah"
                    className="p-2.5 text-[#5C3A28] hover:text-[#D95D24] disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isOutOfStock || remainingAddable === 0}
                onClick={() => handleAddToCart(false)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#FDF1E6] hover:bg-[#FCE3CE] text-[#B44312] font-bold text-sm disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                {remainingAddable === 0 && !isOutOfStock
                  ? 'Batas Stok di Keranjang'
                  : 'Tambah ke Keranjang'}
              </button>

              <button
                type="button"
                disabled={isOutOfStock || remainingAddable === 0}
                onClick={() => handleAddToCart(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white font-bold text-sm shadow-sm disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Beli Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-12">
          <h2 className="font-[var(--font-display)] text-xl sm:text-2xl font-bold text-[#2C1810] mb-4">
            Jajanan Lainnya yang Mungkin Kamu Suka
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
