import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loadingUser } = useAuth();
  const location = useLocation();

  // Tampilkan loading saat check auth
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

  // Jika belum login, redirect ke login
  if (!user) {
    return <Navigate to="/products" state={{ from: location }} replace />;
  }

  // Jika route khusus admin tapi user bukan admin
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/products" replace />;
  }

  // Jika user adalah admin tapi akses route user biasa (bukan admin route)
  // Redirect admin ke dashboard admin
  if (user.role === 'admin' && !adminOnly && !location.pathname.startsWith('/admin')) {
    // Kecuali untuk route yang bisa diakses admin juga
    const allowedRoutes = ['/profile', '/chat'];
    if (!allowedRoutes.includes(location.pathname)) {
      return <Navigate to="/admin/products" replace />;
    }
  }

  return children;
}