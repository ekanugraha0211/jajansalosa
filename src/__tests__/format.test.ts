import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppCheckoutUrl,
  buildWhatsAppOrderMessage,
  formatRupiah,
  isValidIndonesianWhatsApp,
  normalizeWhatsAppNumber,
  slugify,
} from '../lib/format';
import type { CreateOrderResponse } from '../types';

describe('format & WhatsApp helpers', () => {
  it('formats IDR currency without decimals', () => {
    expect(formatRupiah(15000).replace(/\s/g, ' ')).toBe('Rp 15.000');
    expect(formatRupiah(0).replace(/\s/g, ' ')).toBe('Rp 0');
  });

  it('normalizes Indonesian WhatsApp numbers consistently', () => {
    expect(normalizeWhatsAppNumber('0812-3456-7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('+62 812 3456 7890')).toBe('6281234567890');
    expect(normalizeWhatsAppNumber('81234567890')).toBe('6281234567890');
  });

  it('validates Indonesian WhatsApp phone format', () => {
    expect(isValidIndonesianWhatsApp('081234567890')).toBe(true);
    expect(isValidIndonesianWhatsApp('628123456789')).toBe(true);
    expect(isValidIndonesianWhatsApp('12345')).toBe(false);
  });

  it('generates clean URL slugs', () => {
    expect(slugify('Klepon Gula Aren Premium!')).toBe(
      'klepon-gula-aren-premium'
    );
  });

  it('builds structured WhatsApp order message and URL', () => {
    const mockOrder: CreateOrderResponse = {
      order_id: 'ord-1',
      order_code: 'JS-20261125-AB12C',
      created_at: '2026-11-25T02:00:00Z',
      customer_name: 'Budi Santoso',
      customer_whatsapp: '6281234567890',
      customer_address: 'Jl. Melati No. 12, Jakarta',
      notes: 'Pedas sedang',
      total_amount: 52000,
      status: 'pending',
      items: [
        {
          product_id: 'p-1',
          product_name: 'Klepon Gula Aren',
          unit_price: 15000,
          quantity: 2,
          subtotal: 30000,
        },
        {
          product_id: 'p-2',
          product_name: 'Risol Mayo',
          unit_price: 22000,
          quantity: 1,
          subtotal: 22000,
        },
      ],
    };

    const message = buildWhatsAppOrderMessage(mockOrder, 'Jajan Salosa');
    expect(message).toContain('JS-20261125-AB12C');
    expect(message).toContain('Budi Santoso');
    expect(message).toContain('Klepon Gula Aren');
    expect(message).toContain('Pedas sedang');
    expect(message).toContain('52.000');

    const url = buildWhatsAppCheckoutUrl(
      '081999888777',
      mockOrder,
      'Jajan Salosa'
    );
    expect(url.startsWith('https://wa.me/6281999888777?text=')).toBe(true);
  });
});
