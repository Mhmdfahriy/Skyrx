import { X, ShoppingCart, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function CardModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  items = [],
  total = 0,
  type = 'confirm'
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const formatPrice = (price) =>
    "Rp " + parseInt(price || 0).toLocaleString("id-ID");

  // ===================
  // PROCESSING MODAL
  // ===================
  if (type === "processing") {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black z-[9998] transition-opacity duration-300 ease-out ${
            isAnimating ? "opacity-50" : "opacity-0"
          }`}
        />

        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300 ease-out ${
              isAnimating
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-4"
            }`}
          >
            <div className="p-8 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-24 h-24 animate-spin" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="40"
                    stroke="#0891b2"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="60 200"
                  />
                </svg>
                <ShoppingCart className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 text-cyan-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Memproses Pesanan
              </h3>
              <p className="text-gray-600">Mohon tunggu sebentar...</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===================
  // SUCCESS MODAL
  // ===================
  if (type === "success") {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black z-[9998] transition-opacity duration-300 ease-out ${
            isAnimating ? "opacity-50" : "opacity-0"
          }`}
          onClick={handleClose}
        />

        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300 ease-out ${
              isAnimating
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-4"
            }`}
          >
            <div className="p-8 text-center relative overflow-hidden">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div
                  className="absolute inset-0 bg-green-500 rounded-full"
                  style={{
                    animation:
                      "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
                  }}
                />

                <svg
                  className="absolute inset-0 w-32 h-32"
                  viewBox="0 0 100 100"
                >
                  <path
                    d="M20,52 L38,70 L78,30"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                    style={{
                      strokeDasharray: "100",
                      strokeDashoffset: "100",
                      animation: "drawCheck 0.6s 0.3s ease-out forwards",
                    }}
                  />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Pesanan Berhasil!
              </h3>
              <p className="text-gray-600 mb-4">Pesanan Anda sedang diproses</p>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl mb-6 border border-green-100">
                <p className="text-sm text-gray-600 mb-1">Total Pembayaran</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatPrice(total)}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                Anda akan diarahkan ke halaman pesanan...
              </p>

              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: "-10px",
                      backgroundColor: [
                        "#22c55e",
                        "#10b981",
                        "#14b8a6",
                        "#0891b2",
                        "#06b6d4",
                      ][Math.floor(Math.random() * 5)],
                      animation: `confetti ${1 + Math.random()}s ${
                        Math.random() * 0.5
                      }s linear forwards`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ANIMATIONS */}
            <style>{`
              @keyframes scaleIn {
                from { transform: scale(0); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
              }
              @keyframes drawCheck {
                from { stroke-dashoffset: 100; opacity: 0; }
                to { stroke-dashoffset: 0; opacity: 1; }
              }
              @keyframes confetti {
                from { transform: translateY(0) rotate(0deg); opacity: 1; }
                to { transform: translateY(400px) rotate(360deg); opacity: 0; }
              }
            `}</style>
          </div>
        </div>
      </>
    );
  }

  // ===================
  // ERROR MODAL
  // ===================
  if (type === "error") {
    return (
      <>
        <div
          className={`fixed inset-0 bg-black z-[9998] transition-opacity duration-300 ease-out ${
            isAnimating ? "opacity-50" : "opacity-0"
          }`}
          onClick={handleClose}
        />

        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300 ease-out ${
              isAnimating
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 translate-y-4"
            }`}
          >
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Checkout Gagal
              </h3>
              <p className="text-gray-600 mb-6">
                Pastikan stok cukup dan Anda sudah login
              </p>

              <button
                onClick={handleClose}
                className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ===================
  // CONFIRM MODAL
  // ===================
  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-[9998] transition-opacity duration-300 ease-out ${
          isAnimating ? "opacity-50" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-lg w-full transition-all duration-300 ease-out ${
            isAnimating
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-cyan-100 p-2 rounded-lg transition-transform hover:scale-110">
                <ShoppingCart className="text-cyan-600 w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Konfirmasi Pembelian
              </h3>
            </div>

            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <p className="text-gray-700 mb-4">
              Anda akan membeli {items.length} produk:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={item.image || "https://via.placeholder.com/60"}
                    alt={item.name}
                    className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                  />

                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-cyan-700">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-4 rounded-xl border border-cyan-100">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-semibold">
                  Total Pembayaran:
                </span>
                <span className="text-2xl font-extrabold text-cyan-700">
                  {formatPrice(total)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Batal
            </button>

            <button
              onClick={handleConfirm}
              disabled={type === "processing"}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {type === "processing" ? "Memproses..." : "Konfirmasi Beli"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
