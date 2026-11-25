import { useState, type FormEvent } from 'react';
import { ArrowLeft, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { SupabaseSetupNotice } from '../components/SupabaseSetupNotice';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, STORE_NAME } from '../lib/supabase';

export function AdminLoginPage() {
  const { isAdmin, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal masuk. Periksa kembali email dan kata sandi.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-[#FFFBF5]">
      <div className="w-full max-w-md space-y-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7D5A44] hover:text-[#D95D24]"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Toko
        </Link>

        {!isSupabaseConfigured ? (
          <SupabaseSetupNotice />
        ) : (
          <div className="bg-white rounded-3xl border border-[#EFE2D3] p-6 sm:p-8 shadow-sm">
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF1E6] text-[#D95D24] flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="font-[var(--font-display)] text-2xl font-bold text-[#2C1810]">
                Login Admin {STORE_NAME}
              </h1>
              <p className="text-xs sm:text-sm text-[#7D5A44]">
                Masuk menggunakan akun pengelola terdaftar untuk mengelola
                produk, kategori, dan pesanan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="admin_email"
                  className="block text-xs font-bold text-[#5C3A28] mb-1.5"
                >
                  Email Admin
                </label>
                <input
                  id="admin_email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jajansalosa.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
                />
              </div>

              <div>
                <label
                  htmlFor="admin_password"
                  className="block text-xs font-bold text-[#5C3A28] mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="admin_password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E5D5C3] bg-[#FFFBF5] text-sm focus:outline-none focus:ring-2 focus:ring-[#D95D24]/30 focus:border-[#D95D24]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword
                        ? 'Sembunyikan kata sandi'
                        : 'Lihat kata sandi'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C6D58] hover:text-[#2C1810]"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2C1810] hover:bg-[#462619] text-white font-bold text-sm transition-colors disabled:opacity-60 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                {submitting ? 'Memproses...' : 'Masuk Dashboard Admin'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
