import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { FloatingCartBar } from './components/FloatingCartBar';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import { ToastProvider } from './context/ToastContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { HomePage } from './pages/HomePage';
import { ProductDetailPage } from './pages/ProductDetailPage';

function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FFFBF5]">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <FloatingCartBar />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StoreSettingsProvider>
          <AuthProvider>
            <CartProvider>
              <Routes>
                <Route element={<StoreLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/produk/:slug" element={<ProductDetailPage />} />
                  <Route path="/keranjang" element={<CartCheckoutPage />} />
                </Route>

                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedAdminRoute>
                      <AdminDashboardPage />
                    </ProtectedAdminRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </StoreSettingsProvider>
      </ToastProvider>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
