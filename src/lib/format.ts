import type { CreateOrderResponse, OrderStatus } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalisasi nomor WhatsApp ke format internasional tanpa tanda '+' (mis. 628123456789).
 */
export function normalizeWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('8')) {
    return `62${digits}`;
  }
  return digits;
}

export function isValidIndonesianWhatsApp(input: string): boolean {
  const normalized = normalizeWhatsAppNumber(input);
  return /^628\d{7,13}$/.test(normalized);
}

export function buildWhatsAppOrderMessage(
  order: CreateOrderResponse,
  storeName = 'Jajan Salosa'
): string {
  const itemLines = order.items
    .map(
      (item, index) =>
        `${index + 1}. ${item.product_name}\n   ${item.quantity} x ${formatRupiah(item.unit_price)} = ${formatRupiah(item.subtotal)}`
    )
    .join('\n');

  const lines = [
    `Halo *${storeName}*, saya ingin konfirmasi pesanan baru:`,
    '',
    `*Kode Pesanan:* ${order.order_code}`,
    `*Nama:* ${order.customer_name}`,
    `*No. WhatsApp:* ${order.customer_whatsapp}`,
    `*Alamat Pengiriman:* ${order.customer_address}`,
    ...(order.notes ? [`*Catatan:* ${order.notes}`] : []),
    '',
    '*Detail Pesanan:*',
    itemLines,
    '',
    `*Total Pembayaran:* ${formatRupiah(order.total_amount)}`,
    '',
    'Mohon konfirmasi ketersediaan dan info pembayarannya ya. Terima kasih!',
  ];

  return lines.join('\n');
}

export function buildWhatsAppCheckoutUrl(
  storePhone: string,
  order: CreateOrderResponse,
  storeName = 'Jajan Salosa'
): string {
  const normalizedStorePhone = normalizeWhatsAppNumber(storePhone) || '6281234567890';
  const message = buildWhatsAppOrderMessage(order, storeName);
  return `https://wa.me/${normalizedStorePhone}?text=${encodeURIComponent(message)}`;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Menunggu Konfirmasi',
  confirmed: 'Dikonfirmasi',
  processing: 'Sedang Diproses',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  confirmed: 'bg-sky-100 text-sky-800 border-sky-200',
  processing: 'bg-orange-100 text-orange-800 border-orange-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
};
