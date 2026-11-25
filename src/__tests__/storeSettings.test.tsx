import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Navbar } from '../components/Navbar';
import { AdminBrandingTab } from '../components/admin/AdminBrandingTab';
import { CartProvider } from '../context/CartContext';
import { StoreSettingsProvider } from '../context/StoreSettingsContext';
import { ToastProvider } from '../context/ToastContext';
import * as settingsService from '../services/settingsService';

vi.mock('../lib/supabase', () => ({
  isSupabaseConfigured: true,
  STORE_NAME: 'Jajan Salosa',
  STORE_WHATSAPP: '6281234567890',
  supabase: {},
  requireSupabase: vi.fn(),
}));

describe('StoreSettings & AdminBrandingTab', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('applies logo in Navbar and favicon link in document.head', async () => {
    vi.spyOn(settingsService, 'fetchStoreSettings').mockResolvedValue({
      id: 'default',
      store_name: 'Jajan Salosa',
      logo_url: 'https://example.com/logo.png',
      favicon_url: 'https://example.com/favicon.png',
    });

    render(
      <MemoryRouter>
        <ToastProvider>
          <StoreSettingsProvider>
            <CartProvider>
              <Navbar />
            </CartProvider>
          </StoreSettingsProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    const logoImg = await screen.findByAltText('Logo Jajan Salosa');
    expect(logoImg).toHaveAttribute('src', 'https://example.com/logo.png');

    await waitFor(() => {
      const iconLink = document.head.querySelector('link[rel="icon"]');
      expect(iconLink).toHaveAttribute('href', 'https://example.com/favicon.png');
    });
  });

  it('allows admin to update logo, favicon, and store name', async () => {
    vi.spyOn(settingsService, 'fetchStoreSettings').mockResolvedValue({
      id: 'default',
      store_name: 'Jajan Salosa',
      logo_url: null,
      favicon_url: null,
    });

    const updateSpy = vi
      .spyOn(settingsService, 'updateStoreSettings')
      .mockResolvedValue({
        id: 'default',
        store_name: 'Salosa Snack',
        logo_url: 'https://example.com/new-logo.png',
        favicon_url: 'https://example.com/new-icon.ico',
      });

    render(
      <ToastProvider>
        <StoreSettingsProvider>
          <AdminBrandingTab />
        </StoreSettingsProvider>
      </ToastProvider>
    );

    const nameInput = screen.getByLabelText(/nama toko/i);
    fireEvent.change(nameInput, { target: { value: 'Salosa Snack' } });

    const logoUrlInput = screen.getByPlaceholderText(/tempel url logo/i);
    fireEvent.change(logoUrlInput, {
      target: { value: 'https://example.com/new-logo.png' },
    });

    const faviconUrlInput = screen.getByPlaceholderText(/tempel url ikon tab/i);
    fireEvent.change(faviconUrlInput, {
      target: { value: 'https://example.com/new-icon.ico' },
    });

    fireEvent.click(screen.getByRole('button', { name: /simpan pengaturan/i }));

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith({
        store_name: 'Salosa Snack',
        logo_url: 'https://example.com/new-logo.png',
        favicon_url: 'https://example.com/new-icon.ico',
      });
    });

    await waitFor(() => {
      const iconLink = document.head.querySelector('link[rel="icon"]');
      expect(iconLink).toHaveAttribute(
        'href',
        'https://example.com/new-icon.ico'
      );
      expect(document.title).toContain('Salosa Snack');
    });
  });
});
