import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCard } from '../context/CardContext';
import api from '../api/axios';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();
  const { addToCard } = useCard();
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (err) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    addToCard(product);
    navigate('/card');
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockBadge = (stock) => {
    if (stock === 0) {
      return <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-medium">Habis</span>;
    } else if (stock <= 5) {
      return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs font-medium">Sisa {stock}</span>;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200 pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-gray-100 pt-16">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-orange-800 via-red-800 to-rose-900 py-32 shadow-inner flex flex-col justify-center items-center">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 text-white drop-shadow-lg">✨ Flash Sale Hari Ini!</h1>
          <p className="text-2xl mb-10 text-orange-200">Diskon hingga 50% untuk produk pilihan</p>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Cari produk yang kamu mau..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 rounded-full bg-gray-800 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-orange-700 shadow-lg text-lg"
              />
              <button className="absolute right-2 top-2 bg-orange-800 hover:bg-orange-900 text-white px-6 py-2 rounded-full transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-orange-700 to-red-700 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {category === 'all' ? '🔥 Semua' : category}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-32 h-32 mx-auto text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl text-gray-400">Produk tidak ditemukan</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-gray-800 rounded-xl shadow hover:shadow-orange-900 transition group overflow-hidden border border-gray-700">
                <div className="relative overflow-hidden bg-white aspect-square rounded-t-xl flex items-center justify-center">
                  <img
                    src={product.image || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="w-32 h-32 md:w-40 md:h-40 object-contain transition duration-500"
                  />
                  {getStockBadge(product.stock) && (
                    <div className="absolute top-2 left-2">
                      {getStockBadge(product.stock)}
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-red-700 text-white text-xs font-bold px-2 py-1 rounded">
                    SALE
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-100 mb-2 line-clamp-2 min-h-[3rem]">
                    {product.name}
                  </h3>
                  <div className="mb-3">
                    <div className="text-2xl font-bold text-orange-400">
                      Rp{parseInt(product.price).toLocaleString('id-ID')}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 line-through">
                        Rp{parseInt(product.price * 1.2).toLocaleString('id-ID')}
                      </span>
                      <span className="bg-red-900 text-red-300 text-xs px-2 py-0.5 rounded font-semibold">
                        -50%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                      <span>5.9</span>
                    </div>
                    <div>Terjual 100rb+</div>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-gradient-to-r from-orange-700 to-red-700 text-white py-2.5 rounded-lg hover:from-orange-800 hover:to-red-800 transition disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed font-semibold text-sm shadow-md"
                  >
                    {product.stock === 0 ? '❌ Habis' : 'Pesan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}