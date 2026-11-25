import { ArrowRight, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatRupiah } from '../lib/format';

export function FloatingCartBar() {
  const { totalItems, subtotal } = useCart();
  const location = useLocation();

  if (totalItems === 0 || location.pathname === '/keranjang' || location.pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 md:hidden">
      <Link
        to="/keranjang"
        className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl bg-[#2C1810] text-white shadow-xl border border-[#4E2F22]"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D95D24] flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-amber-200 font-medium">
              {totalItems} item di keranjang
            </div>
            <div className="text-base font-extrabold">
              {formatRupiah(subtotal)}
            </div>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-300">
          <span>Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}
