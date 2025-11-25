import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await api.get('/orders');
      console.log('Orders response:', response.data); // Debug log
      setOrders(response.data);
    } catch (err) {
      console.error('Load orders error:', err);
      setError('Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-900 border-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateKey = (dateString) => {
    const d = new Date(dateString);
    return d.toISOString().split('T')[0];
  };

  const groupOrdersByDate = () => {
    const grouped = {};
    
    const sortedOrders = [...orders].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    sortedOrders.forEach(order => {
      const dateKey = getDateKey(order.created_at);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(order);
    });

    return Object.keys(grouped)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(dateKey => ({
        date: dateKey,
        orders: grouped[dateKey]
      }));
  };

  const handleOrderClick = (orderId, paymentStatus) => {
    // Jika pending payment dan menggunakan Xendit, arahkan ke payment page
    // Jika sudah paid, arahkan ke order detail
    if (paymentStatus === 'pending') {
      navigate(`/payment/${orderId}`);
    } else {
      navigate(`/orders/${orderId}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  const groupedOrders = groupOrdersByDate();

  return (
    <div className="bg-gray-50 min-h-screen pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-3">
        <h1 className="text-2xl md:text-3xl font-bold mb-7 text-orange-700 tracking-wide">
          Riwayat Pesanan
        </h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm flex flex-col sm:flex-row items-center gap-6 mt-10">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <div>
              <p className="text-gray-500 text-lg mb-1">Belum ada pesanan.</p>
              <a href="/products" className="inline-block px-5 py-2 bg-orange-500 rounded text-white font-semibold shadow hover:bg-orange-600 transition">
                Mulai Belanja
              </a>
            </div>
          </div>
        ) : (
          <main className="space-y-8">
            {groupedOrders.map((group) => (
              <section key={group.date} className="space-y-4">
                {/* Header Tanggal */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <h2 className="text-sm md:text-base font-bold text-gray-700 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                    {formatDateOnly(group.date)}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>

                {/* Daftar Pesanan */}
                <div className="space-y-3">
                  {group.orders.map((order) => (
                    <article
                      key={order.id}
                      onClick={() => handleOrderClick(order.id, order.payment_status)}
                      className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer"
                    >
                      {/* Header Info */}
                      <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap justify-between items-center gap-2">
                        <div className="text-xs text-gray-500">
                          Order ID: <span className="font-mono font-semibold">#{order.id}</span>
                          <span className="mx-2">|</span>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border ${getPaymentStatusColor(order.payment_status)} whitespace-nowrap`}>
                            {order.payment_status === 'paid' ? 'Dibayar' : 'Belum Bayar'}
                          </span>
                          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(order.status)} whitespace-nowrap`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* List Items */}
                      <div className="divide-y divide-gray-100">
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center py-4 px-5 gap-4">
                              {/* Gambar produk */}
                              <div className="flex-shrink-0 flex justify-center sm:justify-start">
                                <img
                                  src={item.product?.image || `https://via.placeholder.com/120?text=No+Image`}
                                  alt={item.product?.name || 'Product'}
                                  className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-gray-50"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/120?text=No+Image';
                                  }}
                                />
                              </div>
                              
                              {/* Detail Produk */}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 text-base md:text-lg line-clamp-2 mb-1">
                                  {item.product?.name || <span className="italic text-gray-400">Produk tidak tersedia</span>}
                                </h3>
                                <div className="text-sm text-gray-600">
                                  <span className="font-semibold text-orange-500">{item.quantity}</span> x Rp{parseInt(item.price || 0).toLocaleString('id-ID')}
                                </div>
                              </div>
                              
                              {/* Subtotal */}
                              <div className="text-right sm:text-left">
                                <div className="text-xs text-gray-500 mb-1">Subtotal</div>
                                <div className="font-bold text-gray-700 text-base">
                                  Rp{parseInt(item.total_price || 0).toLocaleString('id-ID')}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 px-5 text-center text-gray-400">
                            Tidak ada item dalam pesanan ini
                          </div>
                        )}
                      </div>

                      {/* Footer Total */}
                      <div className="px-5 py-3 bg-orange-50 border-t border-orange-100 flex justify-between items-center">
                        <div className="text-sm font-semibold text-gray-700">
                          Total Pesanan ({order.items?.length || 0} item)
                        </div>
                        <div className="font-extrabold text-orange-600 text-xl">
                          Rp{parseInt(order.total_price || 0).toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Action Button untuk Pending Payment */}
                      {order.payment_status === 'pending' && (
                        <div className="px-5 py-3 bg-yellow-50 border-t border-yellow-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/payment/${order.id}`);
                            }}
                            className="w-full py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                          >
                            Lanjutkan Pembayaran
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </main>
        )}
      </div>
    </div>
  );
}