import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import {
  buildWhatsAppCheckoutUrl,
  formatRupiah,
  isValidIndonesianWhatsApp,
  normalizeWhatsAppNumber,
} from '../lib/format';
import {
  isSupabaseConfigured,
  STORE_NAME,
  STORE_WHATSAPP,
} from '../lib/supabase';
import { createOrder } from '../services/orderService';
import type { CreateOrderResponse } from '../types';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80';

export function CartCheckoutPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] =
    useState<CreateOrderResponse | null>(null);

  async function handleCheckoutSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!isSupabaseConfigured) {
      setFormError(
        'Konfigurasi Supabase belum diatur. Hubungi pengelola toko.'
      );
      return;
    }

    if (items.length === 0) {
      setFormError('Keranjang belanja Anda masih kosong.');
      return;
    }

    const trimmedName = customerName.trim();
    const trimmedAddress = customerAddress.trim();
    const normalizedWa = normalizeWhatsAppNumber(customerWhatsapp);

    if (trimmedName.length < 2) {
      setFormError('Masukkan nama lengkap Anda (minimal 2 karakter).');
      return;
    }

    if (!isValidIndonesianWhatsApp(customerWhatsapp)) {
      setFormError(
        'Masukkan nomor WhatsApp Indonesia yang valid (contoh: 081234567890).'
      );
      return;
    }

    if (trimmedAddress.length < 5) {
      setFormError('Masukkan alamat pengiriman lengkap (minimal 5 karakter).');
      return;
    }

    setSubmitting(true);
    try {
      const orderResponse = await createOrder({
        customer_name: trimmedName,
        customer_whatsapp: normalizedWa,
        customer_address: trimmedAddress,
        notes: notes.trim(),
        items: items.map((entry) => ({
          product_id: entry.product.id,
          quantity: entry.quantity,
        })),
      });

      clearCart();
      setCompletedOrder(orderResponse);
      showToast('Pesanan berhasil disimpan! Mengarahkan ke WhatsApp...');

      const waUrl = buildWhatsAppCheckoutUrl(
        STORE_WHATSAPP,
        orderResponse,
        STORE_NAME
      );
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat memproses pesanan.';
      setFormError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (completedOrder) {
    const waUrl = buildWhatsAppCheckoutUrl(
      STORE_WHATSAPP,
      completedOrder,
      STORE_NAME
    );

    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-3xl border border-[#EFE2D3] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-[var(--font-display)] text-2xl font-bold text-[#2C1810]">
              Pesanan Berhasil Dicatat!
            </h1>
            <p className="text-sm text-[#6E4934]">
              Kode Pesanan Anda:{' '}
              <span className="font-bold text-[#2C1810]">
                {completedOrder.order_code}
              </span>
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFBF5] border border-[#EFE2D3] p-4 space-y-3 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
              <div>
                <span className="text-[#8C6D58] block">Nama Pemesan</span>
                <span className="font-semibold text-[#2C1810]">
                  {completedOrder.customer_name}
                </span>
              </div>
              <div>
                <span className="text-[#8C6D58] block">No. WhatsApp</span>
                <span className="font-semibold text-[#2C1810]">
                  {completedOrder.customer_whatsapp}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#8C6D58] block">Alamat Pengiriman</span>
                <span className="font-semibold text-[#2C1810]">
                  {completedOrder.customer_address}
                </span>
              </div>
              {completedOrder.notes && (
                <div className="sm:col-span-2">
                  <span className="text-[#8C6D58] block">Catatan</span>
                  <span className="font-medium text-[#2C1810]">
                    {completedOrder.notes}
                  </span>
                </div>
              )}
            </div>

            <div className="border-t border-[#EFE2D3] pt-3 space-y-2">
              {completedOrder.items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-[#2C1810]">
                      {item.product_name}
                    </div>
                    <div className="text-xs text-[#8C6D58]">
                      {item.quantity} x {formatRupiah(item.unit_price)}
                    </div>
                  </div>
                  <div className="font-bold text-[#2C1810]">
                    {formatRupiah(item.subtotal)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#EFE2D3] pt-3 flex items-center justify-between text-base font-extrabold">
              <span>Total Pesanan</span>
              <span className="text-[#D95D24]">
                {formatRupiah(completedOrder.total_amount)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-sm transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              Kirim Detail Pesanan ke WhatsApp
            </a>

            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#FDF1E6] hover:bg-[#FCE3CE] text-[#B44312] font-bold text-sm transition-colors"
            >
              Belanja Jajanan Lagi
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-20">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7D5A44] hover:text-[#D95D24] mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Lanjut Belanja
          </Link>
          <h1 className="font-[var(--font-display)] text-2xl sm:text-3xl font-bold text-[#2C1810]">
            Keranjang &amp; Checkout
          </h1>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#EFE2D3] p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FDF1E6] text-[#D95D24] flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#2C1810]">
            Keranjang Belanja Masih Kosong
          </h2>
          <p className="text-sm text-[#7D5A44] max-w-md mx-auto">
            Yuk pilih aneka kue basah, camilan gurih, atau keripik favoritmu di
            katalog Jajan Salosa.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#D95D24] hover:bg-[#B94B19] text-white font-bold text-sm transition-colors"
          >
            Jelajahi Katalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Daftar Item Keranjang */}
          <section className="lg:col-span-7 space-y-3">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-[#EFE2D3] p-3.5 sm:p-4 flex gap-3.5 sm:gap-4 items-center"
              >
                <Link
                  to={`/produk/${product.slug}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F8EFE4] shrink-0"
                >
                  <img
                    src={product.image_url || FALLBACK_IMAGE}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    to={`/produk/${product.slug}`}
                    className="font-bold text-sm sm:text-base text-[#2C1810] hover:text-[#D95D24] line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <div className="text-xs sm:text-sm text-[#8C6D58] mt-0.5">
                    {formatRupiah(product.price)} / pcs
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
                    <div className="inline-flex items-center rounded-xl border border-[#E5D5C3] bg-[#FFFBF5]">
                      <button
                        type="button"
                        onClick={() => {
                          const res = updateQuantity(product.id, quantity - 1);
                          if (!res.ok && res.message) {
                            showToast(res.message, 'error');
                          }
                        }}
                        aria-label={`Kurangi ${product.name}`}
                        className="p-2 text-[#5C3A28] hover:text-[#D95D24] cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-bold text-[#2C1810]">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const res = updateQuantity(product.id, quantity + 1);
                          if (!res.ok && res.message) {
                            showToast(res.message, 'error');
                          }
                        }}
                        disabled={quantity >= product.stock}
                        aria-label={`Tambah ${product.name}`}
                        className="p-2 text-[#5C3A28] hover:text-[#D95D24] disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-sm sm:text-base text-[#D95D24]">
                        {formatRupiah(product.price * quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        aria-label={`Hapus ${product.name}`}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Form Checkout Guest */}
          <section className="lg:col-span-5 bg-white rounded-3xl border border-[#EFE2D3] p-5 sm:p-6 shadow-xs">
            <h2 className="font-[var(--font-display)] text-xl font-bold text-[#2C1810] mb-1">
              Data Pengiriman
            </h2>
            <p className="text-xs text-[#7D5A44] mb-5">
              Checkout praktis tanpa perlu buat akun. Pesanan otomatis dikirim
              ke WhatsApp admin.
            </p>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="customer_name"
                  className="block text-xs font-bold text-[#5C3A28] mb-1.5"
                >
                  Nama Lengkap *
                </label>
                <input
                  id="customer_name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Siti Rahmawati"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
                />
              </div>

              <div>
                <label
                  htmlFor="customer_whatsapp"
                  className="block text-xs font-bold text-[#5C3A28] mb-1.5"
                >
                  Nomor WhatsApp *
                </label>
                <input
                  id="customer_whatsapp"
                  type="tel"
                  required
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
                />
              </div>

              <div>
                <label
                  htmlFor="customer_address"
                  className="block text-xs font-bold text-[#5C3A28] mb-1.5"
                >
                  Alamat Lengkap Pengiriman *
                </label>
                <textarea
                  id="customer_address"
                  required
                  rows={3}
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, patokan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
                />
              </div>

              <div>
                <label
                  htmlFor="order_notes"
                  className="block text-xs font-bold text-[#5C3A28] mb-1.5"
                >
                  Catatan Pesanan (Opsional)
                </label>
                <textarea
                  id="order_notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kirim jam 10 pagi, sambal dipisah..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
                />
              </div>

              <div className="rounded-2xl bg-[#FFFBF5] border border-[#EFE2D3] p-4 space-y-2">
                <div className="flex items-center justify-between text-sm text-[#6E4934]">
                  <span>Total Item</span>
                  <span className="font-semibold">
                    {items.reduce((acc, i) => acc + i.quantity, 0)} pcs
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-[#2C1810]">
                  <span>Total Pembayaran</span>
                  <span className="text-[#D95D24]">
                    {formatRupiah(subtotal)}
                  </span>
                </div>
                <p className="text-[11px] text-[#8C6D58]">
                  Harga dan stok divalidasi ulang secara aman di server saat
                  pesanan dibuat.
                </p>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white font-bold text-sm sm:text-base shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <MessageCircle className="w-5 h-5" />
                {submitting
                  ? 'Menyimpan Pesanan...'
                  : 'Checkout via WhatsApp'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
