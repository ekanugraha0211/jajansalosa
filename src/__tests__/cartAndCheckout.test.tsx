import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { ProductCard } from '../components/ProductCard';
import { CartProvider, useCart } from '../context/CartContext';
import { ToastProvider } from '../context/ToastContext';
import type { Product } from '../types';

const sampleProduct: Product = {
  id: 'prod-1',
  category_id: 'cat-1',
  name: 'Klepon Gula Aren Premium',
  slug: 'klepon-gula-aren-premium',
  description: 'Klepon pandan lembut isi gula aren',
  price: 15000,
  stock: 2,
  image_url: null,
  is_active: true,
  is_featured: true,
  created_at: '2026-11-25T00:00:00Z',
  updated_at: '2026-11-25T00:00:00Z',
  categories: { id: 'cat-1', name: 'Kue Basah', slug: 'kue-basah' },
};

function CartProbe() {
  const { totalItems, subtotal } = useCart();
  return (
    <div>
      <span data-testid="cart-count">{totalItems}</span>
      <span data-testid="cart-subtotal">{subtotal}</span>
    </div>
  );
}

describe('CartContext & ProductCard', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('adds items to cart and respects available stock limit', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <CartProvider>
            <ProductCard product={sampleProduct} />
            <CartProbe />
          </CartProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const addButton = screen.getByRole('button', { name: /tambah/i });
    fireEvent.click(addButton);
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('15000');

    fireEvent.click(addButton);
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('30000');

    // Stock is 2, so a 3rd click should not exceed 2
    fireEvent.click(addButton);
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
  });

  it('disables add button when product stock is zero', () => {
    render(
      <MemoryRouter>
        <ToastProvider>
          <CartProvider>
            <ProductCard product={{ ...sampleProduct, stock: 0 }} />
          </CartProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const addButton = screen.getByRole('button', { name: /tambah/i });
    expect(addButton).toBeDisabled();
    expect(screen.getByText('Stok Habis')).toBeInTheDocument();
  });
});
