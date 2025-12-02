import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CardProvider } from "./context/CardContext";
import { BalanceProvider } from "./context/BalanceContext.jsx";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import FloatingCSButton from "./components/FloatingCSButton";
import ChatModal from "./components/ChatModal";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSettings from './pages/ProfileSettings';
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Chat from "./pages/Chat";
import Card from "./pages/Card.jsx";
import GoogleCallback from "./pages/GoogleCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyOtp from "./pages/VerifyOtp";
import PaymentPage from "./pages/PaymentPage";

// Admin Pages
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminLayout from "./components/AdminLayout";
import AdminFlashSaleBanners from './pages/admin/FlashSaleBanners';

function RoleBasedRedirect() {
  const { user, loadingUser } = useAuth();

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-teal-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <Navigate to="/admin/products" replace />;
  }

  return <Navigate to="/products" replace />;
}

function AppWrapper() {
  const { user, loadingUser } = useAuth();
  return <App user={user} loading={loadingUser} />;
}

function App({ user, loading }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const location = useLocation();

  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-100">
      {!isAdminPage && <Navbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />

        {/* NOTE: route parameter name is :id — PaymentPage reads `id` */}
        <Route path="/payment/:id" element={<PaymentPage />} />

        {/* Public routes - tapi cek role untuk redirect admin */}
        <Route
          path="/products"
          element={
            user?.role === 'admin' ? (
              <Navigate to="/admin/products" replace />
            ) : (
              <Products />
            )
          }
        />
        <Route path="/chat" element={<Chat />} />
        <Route path="/card" element={<Card />} />

        {/* Protected user routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Admin-only routes */}
        <Route
          path="/admin/products"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminProducts />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute adminOnly>
              <AdminLayout>
                <AdminOrders />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* Default redirect based on role */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Catch all - redirect based on role */}
        <Route path="*" element={<RoleBasedRedirect />} />
        <Route path="/admin/flash-sale-banners" element={<AdminFlashSaleBanners />} />
      </Routes>

      {!isAdminPage && (
        <>
          <FloatingCSButton onOpenChat={() => setIsChatOpen(true)} />
          <ChatModal
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </>
      )}
    </div>
  );
}

function AppWithRouter() {
  return (
    <BrowserRouter>
      <AppWrapper />
    </BrowserRouter>
  );
}

export default function RootApp() {
  return (
    <AuthProvider>
      <CardProvider>
        <BalanceProvider>  {/* ← WRAP DI SINI */}
          <AppWithRouter />
        </BalanceProvider>
      </CardProvider>
    </AuthProvider>
  );
}