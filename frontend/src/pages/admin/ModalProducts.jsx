// File: src/pages/admin/ModalProducts.jsx
import { useEffect } from "react";

export default function ModalProducts({ isOpen, onClose, type, message, productName }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const config = {
    create: {
      icon: "✔️",
      color: "bg-green-500",
      title: "Berhasil membuat produk",
    },
    edit: {
      icon: "✏️",
      color: "bg-blue-500",
      title: "Produk diperbarui",
    },
    delete: {
      icon: "🗑️",
      color: "bg-red-500",
      title: "Produk dihapus",
    },
    error: {
      icon: "❌",
      color: "bg-red-600",
      title: "Terjadi Kesalahan",
    },
  }[type] || {
    icon: "✔️",
    color: "bg-green-500",
    title: "Berhasil",
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] animate-fade-in"
        onClick={onClose}
      >
        {/* Card */}
        <div
          className="bg-gray-900/90 border border-white/10 backdrop-blur-md p-7 rounded-2xl shadow-xl max-w-sm w-full animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`${config.color} w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-md`}>
              {config.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-center text-white text-lg font-semibold mb-2 tracking-wide">
            {config.title}
          </h3>

          {/* Product Name */}
          {productName && (
            <p className="text-center text-gray-300 text-sm mb-1">
              {productName}
            </p>
          )}

          {/* Message */}
          {message && (
            <p className="text-center text-gray-400 text-sm mt-1">
              {message}
            </p>
          )}

          {/* Divider */}
          <div className="my-5 h-[1px] w-full bg-white/10" />

          {/* Button */}
          <button
            onClick={onClose}
            className="mx-auto block bg-white/10 hover:bg-white/20 text-white px-8 py-2 rounded-xl transition-all duration-200 font-medium backdrop-blur-md shadow-sm"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          0% {
            transform: translateY(40px);
            opacity: 0;
          }
          100% {
            transform: translateY(0px);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.35s ease-out;
        }
      `}</style>
    </>
  );
}
