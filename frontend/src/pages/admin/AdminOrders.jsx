import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { Search, Eye, Package, AlertTriangle } from 'lucide-react';
import OrdersModal from './OrdersModal';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Confirm modal state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Inline toast (no external file)
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = (message, type = 'success') => {
    // clear previous timer if any
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    loadOrders();
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = orders;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(order => order.status === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [filter, searchTerm, orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/orders');
      const ordersData = res.data.data || res.data;
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Load orders error:', error);
      showToast('Gagal memuat orders: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const performUpdateOrderStatus = async ({ orderId, newStatus }) => {
    try {
      setConfirmLoading(true);
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });

      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      showToast('Status order berhasil diperbarui!', 'success');
    } catch (error) {
      console.error('Update status error:', error);
      showToast('Gagal update status: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmData(null);
    }
  };

  // dipanggil ketika user memilih status baru di <select>
  const handleStatusSelection = (order, newStatus) => {
    // Jika status sama, tidak perlu apa-apa
    if (order.status === newStatus) return;

    // buka modal konfirmasi
    setConfirmData({ orderId: order.id, newStatus, order });
    setConfirmOpen(true);
  };

  // View order detail
  const viewOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300',
      completed: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getPaymentBadge = (status) => {
    const styles = {
      paid: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      failed: 'bg-red-100 text-red-800 border-red-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  // Calculate counts
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kelola Pesanan</h1>
              <p className="text-gray-500 mt-1">Total {orders.length} pesanan</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama, email, atau ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow mb-6 p-2 flex gap-2 overflow-x-auto">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'pending', label: 'Menunggu' },
              { key: 'processing', label: 'Diproses' },
              { key: 'completed', label: 'Selesai' },
              { key: 'cancelled', label: 'Dibatalkan' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  filter === tab.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label} <span className="font-bold">({counts[tab.key]})</span>
              </button>
            ))}
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pesanan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12">
                        <div className="text-center">
                          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 font-medium">
                            {searchTerm ? 'Tidak ada hasil pencarian' : 'Tidak ada pesanan'}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {searchTerm ? 'Coba kata kunci lain' : 'Pesanan akan muncul di sini'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-bold text-gray-900">#{order.id}</div>
                            <div className="text-gray-500">{formatDate(order.created_at)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{order.user?.name || 'N/A'}</div>
                            <div className="text-gray-500">{order.user?.email || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {order.items?.[0]?.product?.image && (
                              <img
                                src={order.items[0].product.image}
                                alt={order.items[0].product.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            )}
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {order.items?.[0]?.product?.name || 'Produk Dihapus'}
                              </div>
                              {order.items?.length > 1 && (
                                <span className="text-xs text-gray-500">+{order.items.length - 1} lainnya</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} item
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-bold text-gray-900">{formatPrice(order.total_price)}</div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getPaymentBadge(order.payment_status)}`}>
                              {order.payment_status === 'paid' ? 'Dibayar' : 'Belum Bayar'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {/* View Detail Button */}
                            <button
                              onClick={() => viewOrderDetail(order)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Lihat Detail"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Status Dropdown: onChange -> open confirm modal */}
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusSelection(order, e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="pending">Menunggu</option>
                              <option value="processing">Diproses</option>
                              <option value="completed">Selesai</option>
                              <option value="cancelled">Dibatalkan</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Orders Detail Modal */}
        {selectedOrder && (
          <OrdersModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
          />
        )}

        {/* Confirm Modal (custom) */}
        {confirmOpen && confirmData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => { if (!confirmLoading) { setConfirmOpen(false); setConfirmData(null); } }}
              aria-hidden="true"
            />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition duration-300 ease-out confirm-animate">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-orange-50 rounded-md">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Ubah Status</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Apakah Anda yakin ingin mengubah status Pesanan #{confirmData.orderId} menjadi <span className="font-medium">{getStatusLabel(confirmData.newStatus)}</span>?
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => { if (!confirmLoading) { setConfirmOpen(false); setConfirmData(null); } }}
                  className="flex-1 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition"
                  disabled={confirmLoading}
                >
                  Batal
                </button>
                <button
                  onClick={() => performUpdateOrderStatus(confirmData)}
                  className="flex-1 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition"
                  disabled={confirmLoading}
                >
                  {confirmLoading ? 'Memproses...' : 'Konfirmasi'}
                </button>
              </div>
            </div>

            <style>{`
              @keyframes confirmIn {
                from { opacity: 0; transform: translateY(10px) scale(.985); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
              .confirm-animate {
                animation: confirmIn 300ms cubic-bezier(.2,.9,.25,1) both;
              }
            `}</style>
          </div>
        )}
      </div>

      {/* Inline Toast UI (single-file) */}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999]">
          <div
            className={`max-w-sm w-full transform transition-all duration-300 ease-out
              ${toast.type === 'success' ? 'bg-green-50 border-green-200' : ''}
              ${toast.type === 'error' ? 'bg-red-50 border-red-200' : ''}
              ${toast.type === 'info' ? 'bg-gray-50 border-gray-200' : ''}
              border p-3 rounded-lg shadow-lg`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <p className={`text-sm ${toast.type === 'error' ? 'text-red-800' : 'text-gray-800'}`}>{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
                aria-label="close toast"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}