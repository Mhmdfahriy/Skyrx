import { useState, useEffect } from 'react';
import api from "../../api/axios";
import SidebarAdmin from "../../components/SidebarAdmin";

export default function AdminFlashSaleBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_base64: '',
    order: 0,
    is_active: true,
    start_date: '',
    end_date: ''
  });
  const [preview, setPreview] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      // Tambahkan timestamp untuk prevent cache
      const timestamp = new Date().getTime();
      const response = await api.get(`/admin/flash-sale-banners?t=${timestamp}`);
      console.log('Loaded banners:', response.data); // Debug
      setBanners(response.data);
    } catch (error) {
      console.error('Failed to load banners:', error);
      alert('Gagal memuat banner');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2048000) {
        alert('Ukuran file maksimal 2MB');
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'].includes(file.type)) {
        alert('Format file harus JPG, PNG, GIF, atau WebP');
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setFormData({ ...formData, image_base64: base64 });
        setPreview(base64);
      } catch (error) {
        console.error('Error converting file:', error);
        alert('Gagal memproses gambar');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    // Validasi - HANYA GAMBAR YANG WAJIB
    if (!editMode && !formData.image_base64) {
      alert('Gambar harus dipilih');
      setSubmitLoading(false);
      return;
    }

    const payload = {
      order: formData.order,
      is_active: formData.is_active,
    };

    // Untuk CREATE: hanya kirim jika diisi
    // Untuk EDIT: kirim null jika dikosongkan (untuk hapus data lama)
    if (editMode) {
      // Saat edit: selalu kirim title dan subtitle (null jika kosong)
      payload.title = formData.title && formData.title.trim() !== '' ? formData.title.trim() : null;
      payload.subtitle = formData.subtitle && formData.subtitle.trim() !== '' ? formData.subtitle.trim() : null;
      payload.start_date = formData.start_date || null;
      payload.end_date = formData.end_date || null;
    } else {
      // Saat create: title dan subtitle opsional
      if (formData.title && formData.title.trim() !== '') {
        payload.title = formData.title.trim();
      }
      
      if (formData.subtitle && formData.subtitle.trim() !== '') {
        payload.subtitle = formData.subtitle.trim();
      }

      if (formData.start_date) {
        payload.start_date = formData.start_date;
      }
      
      if (formData.end_date) {
        payload.end_date = formData.end_date;
      }
    }

    // Image wajib saat create, opsional saat edit
    if (formData.image_base64) {
      payload.image_base64 = formData.image_base64;
    }

    try {
      if (editMode) {
        console.log('Payload yang dikirim:', payload); // Debug
        const response = await api.post(`/admin/flash-sale-banners/${currentBanner.id}`, payload);
        console.log('Response dari backend:', response.data); // Debug
        alert('Banner berhasil diupdate');
      } else {
        await api.post('/admin/flash-sale-banners', payload);
        alert('Banner berhasil ditambahkan');
      }
      
      await loadBanners(); // Tambahkan await
      resetForm();
      setShowModal(false);
    } catch (error) {
      console.error('Failed to save banner:', error);
      console.error('Error response:', error.response?.data); // Debug error detail
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Gagal menyimpan banner';
      alert(errorMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (banner) => {
    setCurrentBanner(banner);
    setEditMode(true);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image_base64: '',
      order: banner.order || 0,
      is_active: banner.is_active,
      start_date: banner.start_date ? banner.start_date.split('T')[0] : '',
      end_date: banner.end_date ? banner.end_date.split('T')[0] : ''
    });
    setPreview(banner.image);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus banner ini?')) return;
    
    try {
      await api.delete(`/admin/flash-sale-banners/${id}`);
      alert('Banner berhasil dihapus');
      loadBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      alert('Gagal menghapus banner');
    }
  };

  const toggleActive = async (id) => {
    try {
      await api.patch(`/admin/flash-sale-banners/${id}/toggle`);
      loadBanners();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      alert('Gagal mengubah status banner');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      subtitle: '',
      image_base64: '',
      order: 0,
      is_active: true,
      start_date: '',
      end_date: ''
    });
    setPreview(null);
    setEditMode(false);
    setCurrentBanner(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <SidebarAdmin />
        <div className="flex-1 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <SidebarAdmin />
      
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-screen text-gray-100 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Flash Sale Banners</h1>
                <p className="text-gray-400">Kelola banner promosi Anda (gambar wajib, info opsional)</p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition transform hover:scale-105"
              >
                + Tambah Banner
              </button>
            </div>

            {/* Banner List */}
            {banners.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
                <svg className="w-24 h-24 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xl text-gray-400">Belum ada banner</p>
                <p className="text-gray-500 mt-2">Klik tombol "Tambah Banner" untuk membuat banner pertama</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {banners.map((banner) => (
                  <div key={banner.id} className="bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-700 hover:border-orange-600 transition">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Image Preview */}
                      <div className="md:w-80 flex-shrink-0">
                        <img
                          src={banner.image}
                          alt={banner.title || 'Banner'}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        {banner.title && banner.title !== '' && (
                          <h3 className="text-2xl font-bold text-white mb-2">{banner.title}</h3>
                        )}
                        {!banner.title && (
                          <p className="text-gray-500 italic mb-2">(Tanpa judul)</p>
                        )}
                        {banner.subtitle && banner.subtitle !== '' && (
                          <p className="text-gray-400 mb-3">{banner.subtitle}</p>
                        )}
                        {!banner.subtitle && (
                          <p className="text-gray-500 italic text-sm mb-3">(Tanpa subtitle)</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="bg-gray-700 px-3 py-1 rounded-full text-gray-300">
                            Order: {banner.order}
                          </span>
                          <span className={`px-3 py-1 rounded-full font-semibold ${
                            banner.is_active 
                              ? 'bg-green-900 text-green-300' 
                              : 'bg-red-900 text-red-300'
                          }`}>
                            {banner.is_active ? '✓ Aktif' : '✗ Nonaktif'}
                          </span>
                          {banner.start_date && (
                            <span className="bg-blue-900 text-blue-300 px-3 py-1 rounded-full">
                              Mulai: {new Date(banner.start_date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                          {banner.end_date && (
                            <span className="bg-purple-900 text-purple-300 px-3 py-1 rounded-full">
                              Selesai: {new Date(banner.end_date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleActive(banner.id)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${
                            banner.is_active
                              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          {banner.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => handleEdit(banner)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
                  <h2 className="text-2xl font-bold mb-6 text-white">
                    {editMode ? 'Edit Banner' : 'Tambah Banner'}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      {/* Image - WAJIB */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Gambar Banner <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                          onChange={handleImageChange}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-orange-600 file:text-white hover:file:bg-orange-700 file:cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, GIF, WebP. Max: 2MB. <span className="text-orange-400 font-semibold">WAJIB</span></p>
                        {preview && (
                          <img src={preview} alt="Preview" className="mt-3 w-full h-48 object-cover rounded-lg border border-gray-600" />
                        )}
                      </div>

                      {/* Title - OPSIONAL */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Judul <span className="text-gray-500 text-xs">(opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Flash Sale Hari Ini!"
                        />
                      </div>

                      {/* Subtitle - OPSIONAL */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-300">
                          Subtitle <span className="text-gray-500 text-xs">(opsional)</span>
                        </label>
                        <input
                          type="text"
                          value={formData.subtitle}
                          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Diskon hingga 50%"
                        />
                      </div>

                      {/* Order & Status */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Urutan</label>
                          <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">Status</label>
                          <select
                            value={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          >
                            <option value="true">Aktif</option>
                            <option value="false">Nonaktif</option>
                          </select>
                        </div>
                      </div>

                      {/* Dates - OPSIONAL */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">
                            Tanggal Mulai <span className="text-gray-500 text-xs">(opsional)</span>
                          </label>
                          <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-gray-300">
                            Tanggal Selesai <span className="text-gray-500 text-xs">(opsional)</span>
                          </label>
                          <input
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 rounded-lg font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitLoading ? 'Menyimpan...' : (editMode ? 'Update' : 'Simpan')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        disabled={submitLoading}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}