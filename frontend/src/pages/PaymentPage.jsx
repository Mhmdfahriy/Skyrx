import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useBalance } from '../context/BalanceContext';
import PaymentModal from '../components/PaymentModal';
import { Wallet, Loader2, ChevronLeft, AlertTriangle, CheckCircle } from 'lucide-react';

// Fungsi utilitas untuk memformat harga
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

// Komponen Metode Pembayaran
const PaymentMethodButton = ({ method, selected, onClick, onError, imageErrors }) => {
  const isSelected = selected === method.id;
  const isPointWithoutLogo = method.category === 'point' && (!method.logo || imageErrors[method.id]);
  const shouldRenderImage = !imageErrors[method.id] && method.logo;

  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-lg border transition-all duration-200 ease-in-out
        flex items-center justify-center h-20 group text-left min-h-[80px] min-w-full 
        ${isSelected
          ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50' 
          : 'border-gray-200 bg-white hover:border-gray-400'
        }
      `}
    >
      <div className="flex flex-col items-center justify-center w-full h-full">
        {shouldRenderImage ? (
          <img
            src={method.logo}
            alt={method.name}
            className="w-full h-12 object-contain" 
            onError={() => onError(method.id)}
          />
        ) : isPointWithoutLogo ? (
          <div className="w-full h-10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-orange-600" /> 
            <span className="text-sm font-bold text-gray-800 ml-2">{method.name}</span>
          </div>
        ) : (
          <div className="w-full h-10 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
            {method.name.split(' ')[0]}
          </div>
        )}
      </div>

      {isSelected && (
        <CheckCircle className="absolute top-[-8px] right-[-8px] w-5 h-5 text-orange-600 bg-white rounded-full p-[1px] border border-orange-500 shadow-md" />
      )}
    </button>
  );
};

export default function PaymentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userBalance, fetchBalance } = useBalance();

  const [order, setOrder] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState({ virtualAccount: [], ewallet: [], point: [] });
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [processing, setProcessing] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  
  // Modal State
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
    autoClose: false
  });

  useEffect(() => {
    if (!id) {
      navigate('/orders');
      return;
    }
    loadOrder();
    loadPaymentMethods();
    fetchBalance();
    // eslint-disable-next-line
  }, [id]);

  const loadOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      const payload = res.data?.order ?? res.data;
      if (!payload) throw new Error("Invalid API response");
      setOrder(payload);
    } catch (err) {
      console.error('Load order error:', err);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Order Tidak Ditemukan',
        message: 'Order tidak dapat dimuat. Silakan coba lagi.',
        autoClose: false
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const res = await api.get('/payment-methods');
      setPaymentMethods({
        virtualAccount: res.data.virtualAccount || [],
        ewallet: res.data.ewallet || [],
        point: res.data.Point || [],
      });
    } catch (err) {
      // Fallback data
      setPaymentMethods({
        virtualAccount: [
          { id: 'BCA', name: 'BCA', logo: '/Payments/BCA-icon.svg', category: 'virtualAccount' },
          { id: 'MANDIRI', name: 'Mandiri', logo: '/Payments/Mandiri-icon.svg', category: 'virtualAccount' },
          { id: 'BNI', name: 'BNI', logo: '/Payments/BNI-icon.svg', category: 'virtualAccount' },
          { id: 'BRI', name: 'BRI', logo: '/Payments/BRI-icon.svg', category: 'virtualAccount' },
        ],
        ewallet: [
          { id: 'DANA', name: 'DANA', logo: '/Payments/Dana-icon.svg', category: 'ewallet' },
          { id: 'OVO', name: 'OVO', logo: '/Payments/Ovo-icon.svg', category: 'ewallet' },
          { id: 'SHOPEEPAY', name: 'ShopeePay', logo: '/Payments/ShopeePay-icon.svg', category: 'ewallet' },
        ],
        point: [
          { id: 'SkyRX', name: 'SkyRX ID', logo: '/Payments/SkyRX-icon.svg', category: 'point' },
        ]
      });
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Pilih Metode Pembayaran',
        message: 'Silakan pilih metode pembayaran terlebih dahulu.',
        autoClose: false
      });
      return;
    }

    // Cek saldo SkyRX
    if (selectedMethod === 'SkyRX') {
      const total = parseFloat(order.total_price);
      if (userBalance < total) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Saldo Tidak Cukup',
          message: 'Saldo SkyRX Anda tidak cukup untuk melakukan pembayaran ini. Silakan top up terlebih dahulu.',
          autoClose: false
        });
        return;
      }
    }

    setProcessing(true);

    // Show loading modal
    setModal({
      isOpen: true,
      type: 'loading',
      title: 'Memproses Pembayaran',
      message: 'Mohon tunggu sebentar...',
      autoClose: false
    });

    try {
      const res = await api.post(`/orders/${id}/pay`, { method: selectedMethod });

      if (res.data?.success) {
        // Refresh balance
        await fetchBalance();

        // Show success modal
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Pembayaran Berhasil!',
          message: 'Pembayaran Anda telah berhasil diproses. Anda akan dialihkan ke halaman pesanan.',
          autoClose: true
        });

        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      } else {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Pembayaran Gagal',
          message: res.data?.message || 'Gagal memproses pembayaran. Silakan coba metode lain.',
          autoClose: false
        });
        setProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Terjadi Kesalahan',
        message: error.response?.data?.message || 'Terjadi kesalahan jaringan atau server. Mohon periksa koneksi Anda.',
        autoClose: false
      });
      setProcessing(false);
    }
  };

  const handleImageError = (methodId) => {
    setImageErrors(prev => ({ ...prev, [methodId]: true }));
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-orange-600 mb-2" />
      <p className="text-gray-700">Memuat detail order...</p>
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-24 text-center bg-gray-50 p-4">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Order Tidak Ditemukan</h1>
      <button onClick={() => navigate('/orders')} className="mt-6 px-6 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition">
        Lihat Daftar Order
      </button>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-gray-50 pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Balance Card */}
          <div className="bg-orange-500 rounded-xl shadow-xl p-5 mb-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Wallet className="w-6 h-6" />
              <span className="text-sm font-medium">SkyRX Point</span>
            </div>
            <p className="text-3xl font-extrabold">{formatPrice(userBalance)}</p>
          </div>

          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => navigate('/orders')} 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium text-lg"
            >
              <ChevronLeft className="w-6 h-6" />
              Pembayaran
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">

            {/* KIRI: Opsi Pembayaran */}
            <div className="lg:col-span-2 space-y-6">

              <p className="font-bold text-gray-900 pt-4">Metode Pembayaran</p>

              {/* Virtual Account Section */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-800">Virtual Account</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.virtualAccount?.map(method => (
                    <PaymentMethodButton 
                      key={method.id}
                      method={method}
                      selected={selectedMethod}
                      onClick={() => setSelectedMethod(method.id)}
                      onError={handleImageError}
                      imageErrors={imageErrors}
                    />
                  ))}
                </div>
              </div>

              {/* E-Wallet Section */}
              <div className="space-y-3 pt-4">
                <h3 className="font-semibold text-gray-800">Dompet Digital</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.ewallet?.map(method => (
                    <PaymentMethodButton 
                      key={method.id}
                      method={method}
                      selected={selectedMethod}
                      onClick={() => setSelectedMethod(method.id)}
                      onError={handleImageError}
                      imageErrors={imageErrors}
                    />
                  ))}
                </div>
              </div>
              
              {/* POINT SECTION */}
              <div className="space-y-3 pt-4">
                <h3 className="font-semibold text-gray-800">SkyRX Point</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {paymentMethods.point?.map(method => (
                    <PaymentMethodButton 
                      key={method.id}
                      method={{...method, category: 'point'}} 
                      selected={selectedMethod}
                      onClick={() => setSelectedMethod(method.id)}
                      onError={handleImageError}
                      imageErrors={imageErrors}
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* KANAN: Ringkasan Belanja */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 sticky top-24">
                <h2 className="font-bold text-xl text-gray-900 mb-4 border-b pb-3">Ringkasan Belanja</h2>
                
                <h3 className="font-bold text-gray-900 mb-3">Order #{id}</h3>

                {/* Detail Harga Pesanan */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-700">
                    <span>Total Harga ({order.items?.length || 0} Barang)</span>
                    <span>{formatPrice(order.total_price)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700 border-b pb-3">
                    <span>Biaya Pengiriman</span>
                    <span>Rp0</span>
                  </div>
                </div>

                {/* Total Harga Final */}
                <div className="flex justify-between items-center mt-4 pt-4">
                  <span className="font-bold text-xl text-gray-900">Total Harga</span>
                  <span className="text-xl font-extrabold text-orange-600">
                    {formatPrice(order.total_price)}
                  </span>
                </div>
                
                {/* Tombol Bayar */}
                <div className="mt-6">
                  <button
                    onClick={handlePayment}
                    disabled={!selectedMethod || processing}
                    className={`w-full py-3 rounded-lg font-bold text-white transition duration-300 shadow-md
                      ${!selectedMethod || processing
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700'}
                      flex items-center justify-center gap-2
                    `}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      'Bayar Sekarang'
                    )}
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        autoClose={modal.autoClose}
        autoCloseDelay={3000}
      />
    </>
  );
}