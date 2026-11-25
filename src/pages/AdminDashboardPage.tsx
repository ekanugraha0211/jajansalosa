import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  formatDateTime,
  formatRupiah,
} from '../lib/format';
import { STORE_NAME } from '../lib/supabase';
import { fetchCategories, fetchProducts } from '../services/catalogService';
import { fetchAdminOrders } from '../services/orderService';
import type { Category, Order, Product } from '../types';

type AdminTab = 'overview' | 'products' | 'categories' | 'orders';

export function AdminDashboardPage() {
  const { adminProfile, signOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodData, catData, orderData] = await Promise.all([
        fetchProducts({ includeInactive: true }),
        fetchCategories(),
        fetchAdminOrders('all'),
      ]);
      setProducts(prodData);
      setCategories(catData);
      setOrders(orderData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal memuat data dashboard.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const stats = useMemo(() => {
    const activeProducts = products.filter((p) => p.is_active).length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const validRevenue = orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_amount, 0);

    return {
      totalProducts: products.length,
      activeProducts,
      totalCategories: categories.length,
      totalOrders: orders.length,
      pendingOrders,
      validRevenue,
    };
  }, [products, categories, orders]);

  async function handleLogout() {
    try {
      await signOut();
      showToast('Anda telah keluar dari Dashboard Admin.');
      navigate('/admin/login', { replace: true });
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal keluar.',
        'error'
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      {/* Admin Topbar */}
      <header className="sticky top-0 z-30 bg-[#2C1810] text-white border-b border-[#462619]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div>
            <span className="font-[var(--font-display)] font-bold text-lg block leading-tight">
              Admin {STORE_NAME}
            </span>
            <span className="text-[11px] text-amber-200/80">
              {adminProfile?.full_name || adminProfile?.email}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lihat Toko</span>
            </Link>
            <button
              type="button"
              onClick={loadAllData}
              aria-label="Muat ulang data"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Statistik Ringkas */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="bg-white rounded-2xl border border-[#EFE2D3] p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#8C6D58] text-xs font-bold">
              <span>Total Produk</span>
              <Package className="w-4 h-4 text-[#D95D24]" />
            </div>
            <div className="text-2xl font-extrabold text-[#2C1810] mt-2">
              {stats.totalProducts}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-0.5">
              {stats.activeProducts} aktif di katalog
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFE2D3] p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#8C6D58] text-xs font-bold">
              <span>Total Pesanan</span>
              <ShoppingCart className="w-4 h-4 text-[#D95D24]" />
            </div>
            <div className="text-2xl font-extrabold text-[#2C1810] mt-2">
              {stats.totalOrders}
            </div>
            <div className="text-xs text-amber-700 font-medium mt-0.5">
              {stats.pendingOrders} menunggu konfirmasi
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFE2D3] p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#8C6D58] text-xs font-bold">
              <span>Total Omzet</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#2C1810] mt-2">
              {formatRupiah(stats.validRevenue)}
            </div>
            <div className="text-xs text-[#8C6D58] mt-0.5">
              Tidak termasuk dibatalkan
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EFE2D3] p-4 shadow-xs">
            <div className="flex items-center justify-between text-[#8C6D58] text-xs font-bold">
              <span>Kategori</span>
              <FolderTree className="w-4 h-4 text-[#D95D24]" />
            </div>
            <div className="text-2xl font-extrabold text-[#2C1810] mt-2">
              {stats.totalCategories}
            </div>
            <div className="text-xs text-[#8C6D58] mt-0.5">
              Kategori jajanan aktif
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-[#EFE2D3]">
          {(
            [
              { id: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
              { id: 'products', label: `Produk (${products.length})`, icon: Package },
              { id: 'categories', label: `Kategori (${categories.length})`, icon: FolderTree },
              { id: 'orders', label: `Pesanan (${orders.length})`, icon: ShoppingCart },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'border-[#D95D24] text-[#D95D24] bg-white'
                    : 'border-transparent text-[#6E4934] hover:text-[#2C1810]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-[#EFE2D3] p-10 text-center text-sm text-[#7D5A44]">
            Memuat data dashboard...
          </div>
        ) : error ? (
          <div className="bg-rose-50 rounded-2xl border border-rose-200 p-6 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-800">{error}</p>
            <button
              type="button"
              onClick={loadAllData}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : activeTab === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EFE2D3] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base text-[#2C1810]">
                  Pesanan Terbaru
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#D95D24] hover:underline cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
              {orders.length === 0 ? (
                <p className="text-sm text-[#7D5A44]">Belum ada pesanan masuk.</p>
              ) : (
                <div className="divide-y divide-[#F4EAE0]">
                  {orders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="py-3 flex items-center justify-between gap-3 text-sm"
                    >
                      <div>
                        <div className="font-bold text-[#2C1810]">
                          {order.order_code} • {order.customer_name}
                        </div>
                        <div className="text-xs text-[#8C6D58]">
                          {formatDateTime(order.created_at)}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-extrabold text-[#D95D24]">
                          {formatRupiah(order.total_amount)}
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold border ${ORDER_STATUS_STYLES[order.status]}`}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 bg-white rounded-2xl border border-[#EFE2D3] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-base text-[#2C1810]">
                  Stok Produk Menipis (&le; 10)
                </h2>
                <button
                  type="button"
                  onClick={() => setActiveTab('products')}
                  className="text-xs font-bold text-[#D95D24] hover:underline cursor-pointer"
                >
                  Kelola Produk
                </button>
              </div>
              {products.filter((p) => p.stock <= 10).length === 0 ? (
                <p className="text-sm text-emerald-700">
                  Semua stok produk dalam kondisi aman.
                </p>
              ) : (
                <div className="divide-y divide-[#F4EAE0]">
                  {products
                    .filter((p) => p.stock <= 10)
                    .slice(0, 6)
                    .map((product) => (
                      <div
                        key={product.id}
                        className="py-2.5 flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-semibold text-[#2C1810]">
                          {product.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold">
                          Sisa {product.stock}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <AdminProductsTab
            products={products}
            categories={categories}
            onRefresh={loadAllData}
          />
        ) : activeTab === 'categories' ? (
          <AdminCategoriesTab
            categories={categories}
            products={products}
            onRefresh={loadAllData}
          />
        ) : (
          <AdminOrdersTab orders={orders} onRefresh={loadAllData} />
        )}
      </main>
    </div>
  );
}
