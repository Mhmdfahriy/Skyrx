import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SidebarAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Function untuk menentukan apakah link aktif
  const isActive = (path) => location.pathname === path;

  // Data Menu Items (tetap sama)
  const menuItems = [
    {
      path: "/admin/products",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      label: "Products",
      badge: null
    },
    {
      path: "/admin/orders",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      label: "Orders",
      badge: null
    },
    {
      path: "/admin/flash-sale-banners",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h18v4H3zM3 9h18v12H3z"
          />
        </svg>
      ),
      label: "Banner settings",
      badge: null
    }
  ];

  return (
    // Mengubah background gradient menjadi solid dark dengan shadow minimal
    <aside className="w-72 bg-gray-900 text-white flex flex-col shadow-xl">
      {/* Header */}
      <div className="px-6 py-8 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Sky<span className="text-orange-400">rx</span>
            </h1>
            <span className="text-xs text-gray-400 font-medium tracking-wider">ADMIN DASHBOARD</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 mb-3">
          Management
        </p>
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            // Penyesuaian class aktif dan hover untuk tampilan yang lebih solid
            className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all group font-medium ${
              isActive(item.path)
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/50"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`${isActive(item.path) ? "text-white" : "text-gray-500 group-hover:text-orange-400"} transition-colors`}>
                {item.icon}
              </div>
              <span className="text-sm">{item.label}</span>
            </div>
            {item.badge && (
              <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Quick Stats (dihilangkan untuk fokus pada kesederhanaan menu) */}
      {/* <div className="px-6 py-4 border-t border-gray-800">...</div> */}

      {/* User Profile */}
      <div className="px-6 py-6 border-t border-gray-800 bg-gray-800/50">
        <div className="flex items-center gap-3 mb-4">
          {/* ... User Avatar ... */}
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white truncate">{user?.name || "Admin"}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || "admin@skyrx.com"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          // Perubahan styling tombol Logout menjadi lebih solid dan jelas
          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-lg font-semibold transition-all hover:bg-red-700 shadow-md shadow-red-600/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}