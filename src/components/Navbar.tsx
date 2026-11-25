import { ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useStoreSettings } from '../context/StoreSettingsContext';

export function Navbar() {
  const { totalItems } = useCart();
  const { settings } = useStoreSettings();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isCart = location.pathname === '/keranjang';

  return (
    <header className="sticky top-0 z-40 bg-[#FFFBF5]/95 backdrop-blur-md border-b border-[#EEDEC9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt={`Logo ${settings.store_name}`}
              className="w-10 h-10 rounded-xl object-contain bg-white border border-[#EEDEC9] p-0.5 shadow-sm group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D95D24] to-[#B44312] text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
          )}
          <div className="leading-tight">
            <span className="font-[var(--font-display)] font-bold text-lg sm:text-xl text-[#2C1810] tracking-tight block">
              {settings.store_name}
            </span>
            <span className="text-[11px] font-medium text-[#8C5A3C] hidden sm:block">
              Jajanan Segar Setiap Hari
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            to="/"
            className={`px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              isHome
                ? 'text-[#D95D24] bg-[#FDF1E6]'
                : 'text-[#5C3A28] hover:text-[#D95D24] hover:bg-[#FAF2E6]'
            }`}
          >
            Katalog
          </Link>

          <Link
            to="/keranjang"
            className={`relative inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
              isCart
                ? 'bg-[#2C1810] text-white shadow-sm'
                : 'bg-[#D95D24] text-white hover:bg-[#B94B19] shadow-sm'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline sm:inline">Keranjang</span>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold rounded-full bg-amber-300 text-[#2C1810]">
                {totalItems}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
