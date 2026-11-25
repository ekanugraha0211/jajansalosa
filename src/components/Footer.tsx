import { MessageCircle, ShieldCheck, UtensilsCrossed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { STORE_WHATSAPP } from '../lib/supabase';
import { normalizeWhatsAppNumber } from '../lib/format';

export function Footer() {
  const { settings } = useStoreSettings();
  const waHref = `https://wa.me/${normalizeWhatsAppNumber(STORE_WHATSAPP)}`;

  return (
    <footer className="bg-[#2C1810] text-[#F7ECE1] mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={`Logo ${settings.store_name}`}
                className="w-9 h-9 rounded-xl object-contain bg-white p-0.5"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#D95D24] text-white flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            )}
            <span className="font-[var(--font-display)] text-xl font-bold text-white">
              {settings.store_name}
            </span>
          </div>
          <p className="text-sm text-[#D7C3B2] leading-relaxed">
            Aneka jajanan pasar, camilan gurih, kue basah, dan paket hampers
            yang dibuat segar setiap hari dengan bahan berkualitas.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-3">
            Layanan &amp; Pemesanan
          </h3>
          <ul className="space-y-2 text-sm text-[#D7C3B2]">
            <li>Buka setiap hari: 06.00 – 20.00 WIB</li>
            <li>Pesan mudah tanpa registrasi akun</li>
            <li>Konfirmasi cepat langsung via WhatsApp</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 mb-3">
            Bantuan &amp; Pengelola
          </h3>
          <div className="flex flex-col gap-2.5 items-start">
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15803D] hover:bg-[#166534] text-white text-sm font-semibold transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Hubungi WhatsApp Toko
            </a>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-[#C7B09D] hover:text-white transition-colors pt-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Dashboard Admin
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-[#43271C] py-4 text-center text-xs text-[#B69D8B]">
        &copy; {new Date().getFullYear()} {settings.store_name}. Semua hak dilindungi.
      </div>
    </footer>
  );
}
