import { useCard } from '../context/CardContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import api from '../api/axios';
import CardModal from '../components/CardModal';

export default function Card() {
  const { card, removeFromCard, clearCard, updateQty } = useCard();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState(card.map(i => i.id));
  const [modal, setModal] = useState({ isOpen: false, type: 'confirm', items: [], total: 0 });

  const handleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const allSelected = selectedIds.length === card.length && card.length > 0;
  const handleSelectAll = () => setSelectedIds(allSelected ? [] : card.map(i => i.id));

  const handleQtyChange = (id, val) =>
    updateQty(id, Math.max(1, parseInt(val) || 1));

  const total = card
    .filter(item => selectedIds.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleBuyClick = () => {
    if (!user) return navigate('/login');

    const selectedItems = card.filter(item => selectedIds.includes(item.id));
    if (selectedItems.length === 0) {
      setModal({ isOpen: true, type: 'error', items: [], total: 0 });
      return;
    }

    setModal({ isOpen: true, type: 'confirm', items: selectedItems, total });
  };

  const handleConfirmCheckout = async (payment_method = 'xendit') => {
    setLoading(true);
    setModal(prev => ({ ...prev, type: 'processing' }));

    try {
      const items = card
        .filter(item => selectedIds.includes(item.id))
        .map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        }));

      // Sertakan auth header kalau ada token (safe)
      const res = await api.post(
        '/orders',
        { items, payment_method },
        {
          headers: {
            Authorization: user?.token ? `Bearer ${user.token}` : undefined,
          },
        }
      );

      // Periksa response
      const orderId = res.data?.order?.id || res.data?.id || null;
      const invoiceUrl = res.data?.order?.invoice_url || res.data?.invoice_url || res.data?.payment_url;

      if (payment_method === 'xendit' && orderId) {
        // Hapus item dari cart (frontend) lalu redirect ke payment page
        const idsToRemove = [...selectedIds];
        idsToRemove.forEach(removeFromCard);
        setSelectedIds([]);

        navigate(`/payment/${orderId}`);
        return;
      }

      // Jika metode non-xendit (mis. balance) anggap sukses
      setModal({ isOpen: true, type: 'success', items: [], total });

      const idsToRemove = [...selectedIds];
      idsToRemove.forEach(removeFromCard);
      setSelectedIds([]);

      setTimeout(() => {
        setModal({ isOpen: false, type: 'confirm', items: [], total: 0 });
        navigate('/orders');
      }, 2000);

    } catch (err) {
      console.error('Checkout error:', err);
      const errMsg = err.response?.data?.message || 'Checkout gagal';
      setModal({
        isOpen: true,
        type: 'error',
        items: [],
        total: 0,
        errorMessage: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = () => {
    const idsToRemove = [...selectedIds];
    idsToRemove.forEach(removeFromCard);
    setSelectedIds([]);
  };

  if (card.length === 0) {
    return (
      <div className="flex min-h-[80vh] justify-center items-center pt-24 bg-gray-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 w-[340px] flex flex-col items-center">
          <div className="text-2xl font-bold text-gray-700 mb-2 text-center">
            Keranjangnya kosong nih ;(
          </div>
          <button
            onClick={() => navigate('/products')}
            className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-8 py-2 rounded-lg"
          >
            Ayo belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 px-2 md:px-4">

        {/* Keranjang */}
        <section className="flex-1 w-full">
          <h2 className="text-2xl font-bold mb-3">Keranjang</h2>
          <div className="bg-white rounded-xl shadow border border-gray-200 p-4">
            <div className="mb-3 flex text-sm text-gray-700 gap-2 items-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="accent-cyan-500 w-6 h-6 cursor-pointer"
              />
              <span className="font-medium">Pilih Semua</span>
              <button
                onClick={handleDeleteSelected}
                disabled={selectedIds.length === 0}
                className="ml-3 py-1 px-4 rounded text-red-600 text-sm hover:bg-red-50 border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {selectedIds.length === 0 ? 'Hapus' : `Hapus (${selectedIds.length})`}
              </button>
            </div>

            <ul className="divide-y divide-gray-100">
              {card.map(item => (
                <li key={item.id} className="flex flex-col md:flex-row md:items-center py-5 gap-4">
                  <input
                    type="checkbox"
                    className="accent-cyan-500 w-6 h-6 cursor-pointer"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => handleSelect(item.id)}
                  />
                  <img
                    src={item.image || 'https://via.placeholder.com/100'}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 bg-gray-50"
                  />
                  <div className="flex-1">
                    <span className="block text-base font-semibold text-gray-900">{item.name}</span>
                    {item.category && (
                      <span className="block text-xs text-gray-500 mt-1">{item.category}</span>
                    )}
                    <div className="flex items-center mt-3 gap-2">
                      <button
                        onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || loading}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        className="w-14 text-center border border-gray-300 rounded py-1 font-semibold"
                        value={item.quantity}
                        readOnly
                      />
                      <button
                        onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                        disabled={loading}
                        className="w-8 h-8 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-cyan-800">
                      Rp{parseInt(item.price * item.quantity).toLocaleString('id-ID')}
                    </div>
                    <button
                      onClick={() => removeFromCard(item.id)}
                      className="text-xs text-red-600 hover:text-red-700 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ringkasan */}
        <aside className="w-full lg:w-[390px] mt-8 lg:mt-0">
          <div className="bg-white shadow rounded-xl border border-gray-200 px-6 py-6 sticky top-24">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Ringkasan Belanja</h3>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Pesanan ({selectedIds.length} item)</span>
                <span>Rp{total.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Biaya Admin</span>
                <span className="text-green-600">Gratis</span>
              </div>
            </div>

            <hr className="my-4" />

            <div className="flex justify-between items-center mb-6">
              <div className="font-semibold text-lg text-gray-900">Total Harga</div>
              <div className="text-2xl font-extrabold text-cyan-800">
                Rp{total.toLocaleString('id-ID')}
              </div>
            </div>

            <button
              onClick={handleBuyClick}
              disabled={loading || total === 0 || selectedIds.length === 0}
              className="w-full bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-4 rounded-xl text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? 'Memproses...' : `Beli (${selectedIds.length})`}
            </button>

            {selectedIds.length === 0 && card.length > 0 && (
              <p className="text-xs text-center text-red-600 mt-2">
                Pilih minimal 1 produk untuk checkout
              </p>
            )}
          </div>
        </aside>
      </div>

      <CardModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={() => handleConfirmCheckout('xendit')}
        items={modal.items}
        total={modal.total}
        type={modal.type}
        errorMessage={modal.errorMessage}
      />
    </div>
  );
}
