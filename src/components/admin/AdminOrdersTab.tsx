import { useMemo, useState } from 'react';
import { Eye, MessageCircle, Search, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  formatDateTime,
  formatRupiah,
  normalizeWhatsAppNumber,
} from '../../lib/format';
import { updateOrderStatus } from '../../services/orderService';
import type { Order, OrderStatus } from '../../types';

interface AdminOrdersTabProps {
  orders: Order[];
  onRefresh: () => Promise<void>;
}

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
];

export function AdminOrdersTab({ orders, onRefresh }: AdminOrdersTabProps) {
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchStatus =
        statusFilter === 'all' || order.status === statusFilter;
      const matchSearch =
        !q ||
        order.order_code.toLowerCase().includes(q) ||
        order.customer_name.toLowerCase().includes(q) ||
        order.customer_whatsapp.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, statusFilter, search]);

  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, nextStatus);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(updated);
      }
      showToast(
        `Status pesanan ${updated.order_code} diubah ke "${ORDER_STATUS_LABELS[nextStatus]}".`
      );
      await onRefresh();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Gagal mengubah status pesanan.',
        'error'
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-[#8C6D58] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode pesanan atau nama..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E5D5C3] bg-white text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as OrderStatus | 'all')
          }
          aria-label="Filter status pesanan"
          className="px-3 py-2 rounded-xl border border-[#E5D5C3] bg-white text-sm font-medium text-[#2C1810]"
        >
          <option value="all">Semua Status Pesanan</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#EFE2D3] p-8 text-center text-sm text-[#7D5A44]">
          Belum ada pesanan yang sesuai filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EFE2D3] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF2E6] text-[#5C3A28] text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-bold">Kode &amp; Tanggal</th>
                  <th className="px-4 py-3 font-bold">Pelanggan</th>
                  <th className="px-4 py-3 font-bold">Total</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4EAE0]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFFBF5]">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#2C1810]">
                        {order.order_code}
                      </div>
                      <div className="text-xs text-[#8C6D58]">
                        {formatDateTime(order.created_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#2C1810]">
                        {order.customer_name}
                      </div>
                      <div className="text-xs text-[#8C6D58]">
                        {order.customer_whatsapp}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-[#D95D24]">
                      {formatRupiah(order.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value as OrderStatus
                          )
                        }
                        aria-label={`Ubah status pesanan ${order.order_code}`}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border cursor-pointer ${ORDER_STATUS_STYLES[order.status]}`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FDF1E6] hover:bg-[#FCE3CE] text-[#B44312] text-xs font-bold cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Detail Pesanan */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EFE2D3] w-full max-w-lg max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                  Detail Pesanan
                </span>
                <h2 className="font-[var(--font-display)] text-xl font-bold text-[#2C1810]">
                  {selectedOrder.order_code}
                </h2>
                <p className="text-xs text-[#8C6D58]">
                  {formatDateTime(selectedOrder.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-[#8C6D58] hover:bg-[#FAF2E6]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#FFFBF5] border border-[#EFE2D3] p-4 space-y-2.5 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-[#8C6D58]">Pelanggan</span>
                <span className="font-bold text-[#2C1810] text-right">
                  {selectedOrder.customer_name}
                </span>
              </div>
              <div className="flex justify-between gap-2 items-center">
                <span className="text-[#8C6D58]">WhatsApp</span>
                <a
                  href={`https://wa.me/${normalizeWhatsAppNumber(selectedOrder.customer_whatsapp)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-bold text-[#15803D] hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  {selectedOrder.customer_whatsapp}
                </a>
              </div>
              <div>
                <span className="text-[#8C6D58] block">Alamat Pengiriman</span>
                <p className="font-medium text-[#2C1810] mt-0.5">
                  {selectedOrder.customer_address}
                </p>
              </div>
              {selectedOrder.notes && (
                <div>
                  <span className="text-[#8C6D58] block">Catatan</span>
                  <p className="font-medium text-[#2C1810] mt-0.5">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8C6D58]">
                Item Pesanan
              </h3>
              <div className="rounded-2xl border border-[#EFE2D3] divide-y divide-[#F4EAE0]">
                {(selectedOrder.order_items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="p-3 flex items-center justify-between gap-3 text-sm"
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
                <div className="p-3 bg-[#FAF2E6] flex items-center justify-between font-extrabold text-sm">
                  <span>Total Pembayaran</span>
                  <span className="text-[#D95D24]">
                    {formatRupiah(selectedOrder.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F4EAE0]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5C3A28]">
                  Status:
                </span>
                <select
                  value={selectedOrder.status}
                  disabled={updatingId === selectedOrder.id}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedOrder.id,
                      e.target.value as OrderStatus
                    )
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${ORDER_STATUS_STYLES[selectedOrder.status]}`}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {ORDER_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-[#2C1810] text-white text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
