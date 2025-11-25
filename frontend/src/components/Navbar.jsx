import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCard } from "../context/CardContext";
import { useState } from "react";
import { User } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { card } = useCard();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();

  const cartCount = card.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Helper avatar – versi bersih tanpa console.log
  const getAvatarUrl = () => {
    if (!user?.avatar) return null;

    if (user.avatar.startsWith("http")) {
      return user.avatar;
    }

    if (user.avatar === "default-avatar.png") {
      return "http://127.0.0.1:8000/storage/avatar/default-avatar.png";
    }

    return `http://127.0.0.1:8000/storage/avatar/${user.avatar}`;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <nav className="fixed top-0 left-0 w-full bg-gray-900 text-white shadow-md z-[9999]">
      <div className="max-w-6xl mx-auto flex justify-between items-center h-16 px-4">

        {/* Left menu desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/products" className="hover:text-orange-400 font-medium">
            Products
          </Link>

          {user && (
            <Link to="/orders" className="hover:text-orange-400 font-medium">
              Orders
            </Link>
          )}

          {user?.role === "admin" && (
            <>
              <Link to="/admin/products" className="hover:text-orange-400 font-medium">
                Admin Products
              </Link>
              <Link to="/admin/orders" className="hover:text-orange-400 font-medium">
                Admin Orders
              </Link>
            </>
          )}
        </div>

        {/* Brand */}
        <Link to="/" className="flex-col flex items-center">
          <span className="text-2xl font-bold text-orange-400 leading-none">
            Sky<span className="text-white">rx</span>
          </span>
          <span className="text-[10px] font-semibold text-gray-400 tracking-wide">
            Belanja mudah & hemat
          </span>
        </Link>

        {/* Right section */}
        <div className="flex items-center gap-3">

          {/* Cart */}
          <Link to="/card" className="relative hover:text-orange-400 flex items-center">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full px-1.5 font-bold">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {!user ? (
            <>
              <Link
                to="/login"
                className="ml-2 py-1 px-4 rounded border border-orange-400 bg-gray-800 hover:bg-orange-400 hover:text-gray-900 capitalize font-semibold transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="ml-2 py-1 px-4 rounded bg-orange-500 hover:bg-orange-400 text-gray-900 capitalize font-bold transition"
              >
                Daftar
              </Link>
            </>
          ) : (
            <div className="relative">
              {/* Avatar + dropdown */}
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={user?.name || "User"}
                    className="w-8 h-8 rounded-full object-cover border-2 border-orange-400"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const fallback = e.target.parentElement.querySelector(".fallback-avatar");
                      if (fallback) fallback.style.display = "inline-flex";
                    }}
                  />
                ) : null}

                <span
                  className="fallback-avatar inline-flex h-8 w-8 rounded-full bg-orange-200 text-orange-600 font-bold justify-center items-center"
                  style={{ display: avatarUrl ? "none" : "inline-flex" }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </span>

                <span className="font-medium text-sm">{user?.name}</span>

                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                    <div className="font-semibold">{user?.name}</div>
                    <div className="text-xs opacity-90">{user?.email}</div>
                  </div>

                  <div className="py-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="font-medium">Profil Saya</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-orange-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                      </svg>
                      <span className="font-medium">Pesanan Saya</span>
                    </Link>

                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
