import { useState, useEffect } from 'react';
import { User, Lock, Wallet, History, Camera, Eye, EyeOff, TrendingUp, ShoppingBag, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useBalance } from '../context/BalanceContext'; // ✅ Import BalanceContext
import ProfileModal from '../components/ProfileModal';

export default function ProfileSettings() {
  const { user: authUser, updateUser } = useAuth();
  const { userBalance, fetchBalance } = useBalance(); // ✅ Gunakan Balance Context
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', balance: 0, avatar: null });
  const [stats, setStats] = useState({ total_orders: 0, completed_orders: 0, total_spent: 0 });
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [topupAmount, setTopupAmount] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Modal state
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    showCancel: false
  });

  const tabs = [
    { key: 'profile', label: 'Profil Saya', icon: User },
    { key: 'password', label: 'Keamanan', icon: Lock },
    { key: 'balance', label: 'Saldo & Top Up', icon: Wallet },
    { key: 'history', label: 'Riwayat Transaksi', icon: History }
  ];
  const quickTopupAmounts = [10000, 25000, 50000, 100000, 250000, 500000];

  // Helper untuk show modal
  const showModal = (type, title, message, onConfirm = null, showCancel = false) => {
    setModal({ isOpen: true, type, title, message, onConfirm, showCancel });
  };

  const closeModal = () => {
    setModal({ ...modal, isOpen: false });
  };

  // Helper untuk build avatar URL
  const buildAvatarUrl = (avatarFilename) => {
    if (!avatarFilename || avatarFilename === 'default-avatar.png') {
      return 'http://127.0.0.1:8000/storage/avatar/default-avatar.png';
    }
    if (avatarFilename.startsWith('http')) {
      return avatarFilename;
    }
    return `http://127.0.0.1:8000/storage/avatar/${avatarFilename}`;
  };

  // ✅ Initial Load - Sync dengan Balance Context
  useEffect(() => {
    if (authUser) {
      const avatarUrl = authUser.avatar || buildAvatarUrl('default-avatar.png');
      
      setProfile({ ...authUser, balance: userBalance }); // ✅ Gunakan balance dari context
      setProfileForm({ name: authUser.name, email: authUser.email });
      setAvatarPreview(avatarUrl);
      
      loadStats();
      fetchBalance(); // ✅ Fetch balance terbaru
      setLoading(false);
    } else {
      loadProfile();
    }
  }, [authUser]);

  // ✅ Update balance ketika context berubah
  useEffect(() => {
    setProfile(prev => ({ ...prev, balance: userBalance }));
  }, [userBalance]);
  
  // ✅ Update avatar ketika authUser berubah
  useEffect(() => {
    if (authUser?.avatar) {
      setAvatarPreview(authUser.avatar);
      setProfile(prev => ({ ...prev, avatar: authUser.avatar }));
    }
  }, [authUser?.avatar]);
  
  // ✅ Tab change handler
  useEffect(() => { 
    if (activeTab === 'history') {
      loadTransactions();
    }
    if (activeTab === 'balance') {
      fetchBalance(); // ✅ Refresh balance saat buka tab
    }
  }, [activeTab]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile');
      const userData = response.data.user;

      const avatarUrl = buildAvatarUrl(userData.avatar);
      const userWithAvatar = { ...userData, avatar: avatarUrl };
      
      setProfile(userWithAvatar);
      setStats(response.data.stats);
      setProfileForm({ name: userData.name, email: userData.email });
      setAvatarPreview(avatarUrl);

      // ✅ Fetch balance dari context
      await fetchBalance();

      if (updateUser) {
        updateUser(userWithAvatar);
      }
    } catch (err) {
      console.error('Load profile error:', err);
      showModal('error', 'Gagal Memuat Profil', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/profile');
      setStats(response.data.stats || { total_orders: 0, completed_orders: 0, total_spent: 0 });
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadTransactions = async () => {
    try {
      const response = await api.get('/profile/transactions');
      setTransactions(response.data.data || []);
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      showModal('error', 'Ukuran File Terlalu Besar', 'Ukuran file maksimal 2MB');
      return;
    }
    
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      showModal('error', 'Format File Tidak Valid', 'Hanya file JPG, JPEG, dan PNG yang diizinkan');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('avatar', file);

    setActionLoading(true);
    try {
      const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const avatarFilename = response.data.avatar;
      const avatarUrl = buildAvatarUrl(avatarFilename);

      const updatedUser = { 
        ...profile,
        id: authUser?.id || profile.id,
        name: authUser?.name || profile.name,
        email: authUser?.email || profile.email,
        role: authUser?.role || profile.role,
        balance: userBalance, // ✅ Gunakan balance dari context
        avatar: avatarUrl 
      };
      
      setProfile(updatedUser);
      setAvatarPreview(avatarUrl);

      if (updateUser) {
        updateUser(updatedUser);
      }

      showModal('success', 'Berhasil!', response.data.message || 'Foto profil berhasil diperbarui!');
    } catch (err) {
      console.error('Upload error:', err);
      showModal('error', 'Gagal Upload', err.response?.data?.message || 'Gagal mengupload foto');
      const previousUrl = buildAvatarUrl(profile.avatar);
      setAvatarPreview(previousUrl);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setActionLoading(true);
    try {
      const payload = { ...profileForm };
      const response = await api.put('/profile', payload);

      setProfile(prev => ({ ...prev, ...payload }));

      if (updateUser) {
        updateUser({ ...authUser, ...payload });
      }

      showModal('success', 'Berhasil!', response.data.message || 'Profil berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      showModal('error', 'Gagal', err.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      showModal('error', 'Password Tidak Cocok', 'Password baru dan konfirmasi password tidak cocok!');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      showModal('error', 'Password Terlalu Pendek', 'Password minimal 8 karakter!');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await api.put('/profile/password', passwordForm);
      showModal('success', 'Berhasil!', response.data.message || 'Password berhasil diperbarui!');
      setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    } catch (err) {
      console.error(err);
      showModal('error', 'Gagal', err.response?.data?.message || 'Gagal memperbarui password');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!topupAmount || parseInt(topupAmount) < 10000) {
      showModal('warning', 'Nominal Terlalu Kecil', 'Minimal top up Rp 10.000');
      return;
    }
    
    setActionLoading(true);
    try {
      const response = await api.post('/profile/topup', { amount: parseInt(topupAmount) });

      // ✅ Fetch balance terbaru dari server
      await fetchBalance();

      if (updateUser) {
        updateUser({ ...authUser, balance: response.data.balance });
      }

      showModal('success', 'Top Up Berhasil!', response.data.message || 'Saldo berhasil ditambahkan!');
      setTopupAmount('');
      
      if (activeTab === 'history') loadTransactions();
    } catch (err) {
      console.error(err);
      showModal('error', 'Gagal', err.response?.data?.message || 'Gagal melakukan top up');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price) => 'Rp ' + parseInt(price || 0).toLocaleString('id-ID');
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  const getTransactionIcon = (type) => {
    if (type === 'topup') return { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' };
    if (type === 'payment') return { icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-100' };
    return { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' };
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Memuat profil...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-24">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-6">
        {/* Sidebar & Tabs */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border p-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.name.charAt(0).toUpperCase()
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full cursor-pointer hover:bg-gray-50 shadow-lg">
                <Camera className="w-4 h-4 text-gray-600" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarChange} 
                  className="hidden" 
                  disabled={actionLoading} 
                />
              </label>
            </div>
            <h3 className="font-bold mt-4">{profile.name}</h3>
            <p className="text-sm text-gray-500">{profile.email}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border p-6 space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                    isActive ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* ✅ Balance Card - Menggunakan Balance dari Context */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white">
            <Wallet className="w-8 h-8 mb-3 opacity-90" />
            <div className="text-sm opacity-90 mb-1">Saldo Anda</div>
            <div className="text-2xl font-bold">{formatPrice(userBalance)}</div>
          </div>
        </div>

        {/* Content - Profile Tab */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-lg border p-8">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Informasi Profil</h2>
              <div>
                <label className="block text-sm mb-2">Nama Lengkap</label>
                <input 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm mb-2">Email</label>
                <input 
                  type="email" 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
              <button 
                onClick={handleUpdateProfile} 
                disabled={actionLoading} 
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Keamanan</h2>
              <div>
                <label className="block text-sm mb-2">Password Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'} 
                    value={passwordForm.current_password} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Password Baru</label>
                <div className="relative">
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    value={passwordForm.new_password} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">Konfirmasi Password Baru</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    value={passwordForm.new_password_confirmation} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password_confirmation: e.target.value })}
                    className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <button 
                onClick={handleUpdatePassword} 
                disabled={actionLoading} 
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Menyimpan...' : 'Simpan Password'}
              </button>
            </div>
          )}

          {/* Balance Tab */}
          {activeTab === 'balance' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Saldo & Top Up</h2>
              <div>
                <label className="block text-sm mb-2">Jumlah Top Up</label>
                <input 
                  type="number" 
                  value={topupAmount} 
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Masukkan nominal"
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500" 
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {quickTopupAmounts.map(amount => (
                  <button 
                    key={amount} 
                    type="button" 
                    onClick={() => setTopupAmount(amount.toString())}
                    className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl font-medium hover:bg-orange-100 transition"
                  >
                    {formatPrice(amount)}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleTopup} 
                disabled={actionLoading} 
                className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Memproses...' : 'Top Up Sekarang'}
              </button>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Riwayat Transaksi</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-gray-500">Belum ada transaksi</p>
                ) : transactions.map(tx => {
                  const { icon: Icon, color, bg } = getTransactionIcon(tx.type);
                  return (
                    <div key={tx.id} className="flex items-center gap-4 p-4 border rounded-xl hover:shadow-md transition">
                      <div className={`${bg} p-3 rounded-xl`}>
                        <Icon className={`${color} w-6 h-6`} />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{tx.description || tx.type}</div>
                        <div className="text-sm text-gray-500">{formatDate(tx.created_at)}</div>
                      </div>
                      <div className={`font-semibold ${tx.type === 'topup' ? 'text-green-600' : 'text-orange-600'}`}>
                        {tx.type === 'topup' ? '+' : '-'}{formatPrice(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Component */}
      <ProfileModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
      />
    </div>
  );
}