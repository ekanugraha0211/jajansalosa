import { AlertTriangle } from 'lucide-react';

export function SupabaseSetupNotice() {
  return (
    <div className="max-w-3xl mx-auto my-8 p-5 sm:p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-2 text-sm">
          <h2 className="font-bold text-base">
            Konfigurasi Supabase Belum Terpasang
          </h2>
          <p className="leading-relaxed">
            Untuk menjalankan katalog produk, keranjang, penyimpanan pesanan, dan
            dashboard admin, salin file <code>.env.example</code> menjadi{' '}
            <code>.env</code> lalu isi kredensial proyek Supabase Anda:
          </p>
          <pre className="p-3 rounded-xl bg-amber-100/70 text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_WHATSAPP_NUMBER=6281234567890`}
          </pre>
          <p className="text-xs text-amber-800">
            Setelah itu jalankan skrip SQL di <code>supabase/setup.sql</code>{' '}
            melalui Supabase SQL Editor, lalu restart server Vite.
          </p>
        </div>
      </div>
    </div>
  );
}
