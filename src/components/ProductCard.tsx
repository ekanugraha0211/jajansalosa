import { Plus, ShoppingBag, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatRupiah } from '../lib/format';
import type { Product } from '../types';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem, getItemQuantity } = useCart();
  const { showToast } = useToast();
  const inCartQty = getItemQuantity(product.id);
  const isOutOfStock = product.stock <= 0;

  function handleAddToCart() {
    const result = addItem(product, 1);
    if (result.ok) {
      showToast(`"${product.name}" ditambahkan ke keranjang.`);
    } else if (result.message) {
      showToast(result.message, 'error');
    }
  }

  return (
    <article className="group bg-white rounded-2xl border border-[#EFE2D3] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col">
      <Link
        to={`/produk/${product.slug}`}
        className="relative block aspect-[4/3] bg-[#F8EFE4] overflow-hidden"
      >
        <img
          src={product.image_url || FALLBACK_IMAGE}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          {product.is_featured && !isOutOfStock && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400 text-[#2C1810] shadow-xs">
              <Sparkles className="w-3 h-3" />
              Favorit
            </span>
          )}
          {isOutOfStock && (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-600 text-white shadow-xs">
              Stok Habis
            </span>
          )}
        </div>

        {inCartQty > 0 && (
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2C1810]/90 text-white backdrop-blur-xs">
            <ShoppingBag className="w-3 h-3" />
            {inCartQty} di keranjang
          </div>
        )}
      </Link>

      <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
        {product.categories?.name && (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#B45309] mb-1">
            {product.categories.name}
          </span>
        )}

        <Link
          to={`/produk/${product.slug}`}
          className="font-bold text-[#2C1810] text-sm sm:text-base leading-snug line-clamp-2 hover:text-[#D95D24] transition-colors"
        >
          {product.name}
        </Link>

        <p className="text-xs text-[#7D5A44] mt-1 line-clamp-2 flex-1">
          {product.description || 'Jajanan segar pilihan khas Jajan Salosa.'}
        </p>

        <div className="mt-3 pt-3 border-t border-[#F4EAE0] flex items-center justify-between gap-2">
          <div>
            <div className="text-base sm:text-lg font-extrabold text-[#D95D24]">
              {formatRupiah(product.price)}
            </div>
            <div className="text-[11px] text-[#8C6D58]">
              {isOutOfStock ? 'Habis' : `Stok: ${product.stock}`}
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#FDF1E6] text-[#B44312] hover:bg-[#D95D24] hover:text-white disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </button>
        </div>
      </div>
    </article>
  );
}
