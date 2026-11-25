import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import { CartCheckoutPage } from '../pages/CartCheckoutPage';
import * as orderService from '../services/orderService';

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  STORE_NAME: 'Jajan Salosa',
  STORE_WHATSAPP: '6281234567890',
  supabase: {},
  requireSupabase: vi.fn(),
}));

describe('Guest Checkout Flow', () => {
  beforeEach(() => {
    window.localStorage.setItem(
      'jajan_salosa_cart_v1',
      JSON.stringify([
        {
          product: {
            id: 'prod-1',
            category_id: 'cat-1',
            name: 'Risol Mayo Smoked Beef',
            slug: 'risol-mayo-smoked-beef',
            description: 'Risol enak',
            price: 22000,
            stock: 10,
            image_url: null,
            is_active: true,
            is_featured: true,
            created_at: '2026-11-25T00:00:00Z',
            updated_at: '2026-11-25T00:00:00Z',
          },
          quantity: 2,
        },
      ])
    );
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('saves order via backend RPC before opening WhatsApp link and clears cart', async () => {
    const createOrderSpy = vi
      .spyOn(orderService, 'createOrder')
      .mockResolvedValue({
        order_id: 'ord-99',
        order_code: 'JS-20261125-99ABC',
        created_at: '2026-11-25T03:00:00Z',
        customer_name: 'Siti Rahmawati',
        customer_whatsapp: '6281298765432',
        customer_address: 'Jl. Kenanga No. 8, Bandung',
        notes: 'Kirim pagi',
        total_amount: 44000,
        status: 'pending',
        items: [
          {
            product_id: 'prod-1',
            product_name: 'Risol Mayo Smoked Beef',
            unit_price: 22000,
            quantity: 2,
            subtotal: 44000,
          },
        ],
      });

    render(
      <MemoryRouter>
        <ToastProvider>
          <CartProvider>
            <CartCheckoutPage />
          </CartProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/nama lengkap/i), {
      target: { value: 'Siti Rahmawati' },
    });
    fireEvent.change(screen.getByLabelText(/nomor whatsapp/i), {
      target: { value: '081298765432' },
    });
    fireEvent.change(screen.getByLabelText(/alamat lengkap pengiriman/i), {
      target: { value: 'Jl. Kenanga No. 8, Bandung' },
    });
    fireEvent.change(screen.getByLabelText(/catatan pesanan/i), {
      target: { value: 'Kirim pagi' },
    });

    fireEvent.click(screen.getByRole('button', { name: /checkout via whatsapp/i }));

    await waitFor(() => {
      expect(createOrderSpy).toHaveBeenCalledWith({
        customer_name: 'Siti Rahmawati',
        customer_whatsapp: '6281298765432',
        customer_address: 'Jl. Kenanga No. 8, Bandung',
        notes: 'Kirim pagi',
        items: [{ product_id: 'prod-1', quantity: 2 }],
      });
    });

    expect(await screen.findByText('JS-20261125-99ABC')).toBeInTheDocument();

    const waLink = screen.getByRole('link', {
      name: /kirim detail pesanan ke whatsapp/i,
    });
    expect(waLink.getAttribute('href')).toContain(
      'https://wa.me/6281234567890?text='
    );
    expect(window.open).toHaveBeenCalled();
    expect(window.localStorage.getItem('jajan_salosa_cart_v1')).toBe('[]');
  });
});
