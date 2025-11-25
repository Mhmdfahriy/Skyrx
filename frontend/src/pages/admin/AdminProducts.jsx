import { useState, useEffect } from "react";
import api from "../../api/axios";
import ModalProducts from "./ModalProducts";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category: "",
    image: "",
  });

  const [notification, setNotification] = useState({
    isOpen: false,
    type: '',
    message: '',
    productName: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get("/admin/products");
      setProducts(response.data || []);
      setCurrentPage(1);
    } catch (err) {
      console.error("Error loading products:", err);
      setNotification({
        isOpen: true,
        type: 'error',
        message: 'Gagal memuat daftar produk',
        productName: ''
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          isOpen: true,
          type: 'error',
          message: 'Ukuran file terlalu besar (maksimal 5MB)',
          productName: ''
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData({ ...formData, image: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock || !formData.category || !formData.description) {
      setNotification({
        isOpen: true,
        type: 'error',
        message: 'Semua field harus diisi',
        productName: ''
      });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, formData);
        setNotification({
          isOpen: true,
          type: 'edit',
          message: '',
          productName: formData.name
        });
      } else {
        await api.post("/admin/products", formData);
        setNotification({
          isOpen: true,
          type: 'create',
          message: '',
          productName: formData.name
        });
      }
      resetForm();
      loadProducts();
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        message: err.response?.data?.message || 'Gagal menyimpan produk',
        productName: ''
      });
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category,
      image: product.image || "",
    });
    setImagePreview(product.image || null);
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Yakin ingin menghapus produk ${name}?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      setNotification({
        isOpen: true,
        type: 'delete',
        message: '',
        productName: name
      });
      loadProducts();
    } catch (err) {
      setNotification({
        isOpen: true,
        type: 'error',
        message: 'Gagal menghapus produk',
        productName: ''
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      stock: "",
      category: "",
      image: "",
    });
    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  // Filter produk berdasarkan pencarian
  let filteredProducts = products.filter((product) => {
    const matchSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Daftar Produk</h1>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className={`px-6 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              showForm
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {showForm ? (
              <>
                <span>✕</span> Tutup
              </>
            ) : (
              <>
                <span className="text-lg">+</span> Tambah
              </>
            )}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? "✏️ Edit Produk" : "➕ Tambah Produk Baru"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Gambar Produk
                </label>
                <div className="flex gap-6 items-start">
                  {imagePreview ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={imagePreview}
                        alt="Pratinjau"
                        className="w-full h-full object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-white">
                      <span className="text-4xl">🖼️</span>
                    </div>
                  )}

                  <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-100 transition">
                    <div className="text-4xl mb-2">📤</div>
                    <p className="font-medium text-gray-700">
                      Klik untuk mengunggah gambar
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, GIF (Maks 5MB)
                    </p>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Produk *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Kaos Putih"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contoh: Pakaian Wanita"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga (Rp) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="79800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stok *
                  </label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="79"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="4"
                  placeholder="Jelaskan detail produk Anda..."
                  required
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  {editingId ? "💾 Perbarui" : "✅ Simpan"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        {!showForm && (
          <div className="mb-8">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Cari nama produk atau kategori..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Products Table */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "Produk tidak ditemukan" : "Belum ada produk"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "Coba ubah pencarian Anda"
                : "Tambahkan produk pertama Anda menggunakan tombol di atas"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input type="checkbox" className="rounded cursor-pointer" />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Nama Produk
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Kategori
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Harga
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Stok
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product, idx) => (
                    <tr
                      key={product.id || idx}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                    >
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded cursor-pointer" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || "https://via.placeholder.com/40?text=No+Image"}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded border border-gray-200"
                          />
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">
                        Rp {parseInt(product.price).toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{product.stock}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50 flex-wrap gap-4">
                <div className="text-sm text-gray-600">
                  Menampilkan <span className="font-semibold">{startIndex + 1}</span> sampai <span className="font-semibold">{Math.min(endIndex, filteredProducts.length)}</span> dari <span className="font-semibold">{filteredProducts.length}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition font-medium"
                  >
                    ← Sebelumnya
                  </button>

                  <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1 rounded text-sm font-medium transition ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === currentPage - 2 ||
                        pageNum === currentPage + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 py-1 text-gray-600">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition font-medium"
                  >
                    Berikutnya →
                  </button>
                </div>

                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value={5}>5 per halaman</option>
                  <option value={10}>10 per halaman</option>
                  <option value={20}>20 per halaman</option>
                  <option value={50}>50 per halaman</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notification Modal */}
      <ModalProducts
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        message={notification.message}
        productName={notification.productName}
      />
    </div>
  );
}