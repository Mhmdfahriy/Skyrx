import React, { useEffect, useRef } from 'react';
import {
  X,
  Package,
  ShoppingBag,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react';

const OrdersModal = ({ isOpen, onClose, order }) => {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeBtnRef.current?.focus(), 60);
      window.addEventListener('keydown', handleKey);
    } else {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    }

    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price ?? 0);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Menunggu',
      processing: 'Diproses',
      completed: 'Selesai',
      cancelled: 'Dibatalkan'
    };
    return labels[status] || status;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop - no blur */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition duration-300 ease-out scale-100 opacity-100 modal-animate"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="flex items-center gap-3 text-white">
            <ShoppingBag className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Detail Pesanan</h3>
              <p className="text-sm text-orange-100">Order #{order?.id ?? '—'}</p>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-md text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Status + Payment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <div className="mt-0.5">{getStatusIcon(order?.status)}</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Status Pesanan</p>
                <p className="font-medium text-gray-900">{getStatusLabel(order?.status)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
              <DollarSign className="w-5 h-5 text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Status Pembayaran</p>
                <p className="font-medium text-gray-900">
                  {order?.payment_status === 'paid' ? 'Dibayar' : 'Belum Dibayar'}
                </p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="p-4 rounded-lg border bg-white">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h4 className="font-medium text-gray-900">Informasi Pelanggan</h4>
            </div>
            <div className="text-sm text-gray-700">
              <div className="font-semibold">{order?.user?.name ?? 'N/A'}</div>
              <div className="text-gray-500">{order?.user?.email ?? 'N/A'}</div>
            </div>
          </div>

          {/* Order meta */}
          <div className="p-4 rounded-lg border bg-white">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h4 className="font-medium text-gray-900">Informasi Pesanan</h4>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <div className="text-xs text-gray-500">Tanggal</div>
                <div className="font-medium">{order?.created_at ? formatDate(order.created_at) : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Metode Pembayaran</div>
                <div className="font-medium capitalize">{order?.payment_method ?? '—'}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-5 h-5 text-orange-600" />
              <h4 className="font-medium text-gray-900">Produk</h4>
            </div>

            {!order?.items || order.items.length === 0 ? (
              <div className="text-center py-12 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-600">Tidak ada produk dalam pesanan</p>
                <p className="text-sm text-gray-400 mt-1">Data produk mungkin telah dihapus</p>
              </div>
            ) : (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div
                    key={item.id ?? `${item.product?.id}-${Math.random()}`}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-white"
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center border">
                      {item.product?.image ? (
                        <img
                          src={item.product.image}
                          alt={item.product?.name ?? 'product'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/80?text=No+Image';
                          }}
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{item.product?.name ?? 'Produk Tidak Tersedia'}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatPrice(item.price)} × {item.quantity}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Subtotal</div>
                      <div className="font-semibold text-gray-900">{formatPrice(item.total_price ?? item.price * item.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total */}
          <div className="p-4 rounded-lg border bg-gradient-to-r from-orange-50 to-orange-100 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500">Total Pembayaran</div>
              <div className="text-2xl font-extrabold text-orange-600">{formatPrice(order?.total_price ?? 0)}</div>
            </div>
            <ShoppingBag className="w-12 h-12 text-orange-300" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>

      <style>{`
        /* smoother entry/exit animations (longer duration, softer easing) */
        @keyframes modalFade {
          from { opacity: 0; transform: translateY(8px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes modalFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(6px) scale(0.995); }
        }
        .modal-animate {
          animation: modalFade 320ms cubic-bezier(.2,.9,.25,1) both;
        }
      `}</style>
    </div>
  );
};

export default OrdersModal;