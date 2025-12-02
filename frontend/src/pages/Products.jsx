import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCard } from '../context/CardContext';
import api from '../api/axios';
import IconProduk from '../components/IconProduk';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { user } = useAuth();
  const { addToCard } = useCard();
  const navigate = useNavigate();

  // Banner states
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const intervalRef = useRef(null);

  useEffect(() => {
    loadProducts();
    loadBanners();
    return () => clearInterval(intervalRef.current);
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

  const loadBanners = async () => {
    try {
      const res = await api.get('/flash-sale-banners');
      setBanners(res.data);

      if (res.data.length > 1) startFadeLoop(res.data.length);
    } catch (err) {
      console.error("Banner load failed", err);
    }
  };

  const startFadeLoop = (length) => {
    clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % length);
    }, 5000);
  };

  const nextBanner = () => {
    clearInterval(intervalRef.current);
    setCurrentIndex(prev => (prev + 1) % banners.length);
    if (banners.length > 1) startFadeLoop(banners.length);
  };

  const prevBanner = () => {
    clearInterval(intervalRef.current);
    setCurrentIndex(prev => (prev - 1 + banners.length) % banners.length);
    if (banners.length > 1) startFadeLoop(banners.length);
  };

  const handleAddToCart = (product) => {
    if (!user) return navigate('/login');
    addToCard(product);
    navigate('/card');
  };

  const categories = ['all', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter((product) => {
    const matchSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedCategory === 'all' || product.category === selectedCategory;

    return matchSearch && matchCategory;
  });

  const getStockBadge = (stock) => {
    if (stock === 0)
      return <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded text-xs font-medium">Habis</span>;
    if (stock <= 5)
      return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs font-medium">Sisa {stock}</span>;
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-200 pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-sm">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 min-h-screen text-gray-100 pt-14">

      {/* ====================== HERO BANNER ====================== */}
      <div className="relative w-full h-[200px] sm:h-[250px] md:h-[320px] lg:h-[400px] overflow-hidden rounded-b-[2rem] sm:rounded-b-[3rem] md:rounded-b-[4rem] bg-gradient-to-r from-orange-800 to-red-800">

        {/* Banner images with slide animation */}
        <div className="relative w-full h-full">
          {banners.length > 0 ? (
            banners.map((banner, index) => (
              <img
                key={index}
                src={banner.image}
                alt={`Flash sale banner ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-in-out
                  ${index === currentIndex 
                    ? 'translate-x-0 z-10' 
                    : index < currentIndex 
                      ? '-translate-x-full z-0' 
                      : 'translate-x-full z-0'
                  }`}
              />
            ))
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
              </div>
            </div>
          )}
        </div>

        {/* Arrows (only if >1 banner) */}
        {banners.length > 1 && (
          <>
            <button
              onClick={prevBanner}
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-20 
              bg-black/20 hover:bg-black/40 backdrop-blur-md text-white
              p-2.5 sm:p-3 rounded-full transition-all duration-300 touch-manipulation active:scale-95"
              aria-label="Previous banner"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={nextBanner}
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 
              bg-black/20 hover:bg-black/40 backdrop-blur-md text-white
              p-2.5 sm:p-3 rounded-full transition-all duration-300 touch-manipulation active:scale-95"
              aria-label="Next banner"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* ====================== PRODUCT LIST ====================== */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 relative z-10">

        {/* Search bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 pr-14 sm:pr-16 rounded-xl sm:rounded-2xl 
              bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-400 
              focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent
              shadow-lg text-sm sm:text-base touch-manipulation"
            />

            <button 
              className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 
              bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700
              text-white p-2.5 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 touch-manipulation active:scale-95 shadow-md"
              aria-label="Search"
            >
              <svg className="w-5 h-5 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Category buttons */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-hide bg-gray-900/80 backdrop-blur-sm p-3 sm:p-4 rounded-2xl shadow-xl border border-gray-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all duration-300
              text-sm sm:text-base touch-manipulation active:scale-95
                ${selectedCategory === cat
                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105'
                  : 'bg-gray-800/80 text-gray-300 hover:bg-gray-700 border border-gray-700 hover:border-orange-600/50'
                }`}
            >
              {cat === 'all' ? '🔥 Semua' : cat}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* No results - IKON MENGGUNAKAN FILE SVG DENGAN PATH YANG BENAR */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 sm:py-20">
            <div className="inline-flex items-center justify-center w-32 h-32 sm:w-40 sm:h-40 bg-gray-800/30 rounded-3xl mb-6 shadow-2xl border border-gray-700/50 backdrop-blur-sm p-4">
              {/* PATH DIPERBAIKI: Menggunakan /storage/icon/produk-not-found.svg (lowercase & hyphen) */}
              <IconProduk />
            </div>
            
            <h3 className="text-xl sm:text-2xl font-bold text-gray-200 mb-2">Produk tidak ditemukan</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 px-4 max-w-md mx-auto">
              Maaf, kami tidak menemukan produk yang Anda cari. Silakan coba kata kunci lain.
            </p>
            
            
          </div>
        )}

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id}
              className="bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-orange-900/50 
              transition-all duration-300 group overflow-hidden border border-gray-700 
              hover:border-orange-700/50 active:scale-[0.98] hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 aspect-square flex items-center justify-center p-2 sm:p-3 md:p-4">
                <img
                  src={product.image || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain transition duration-500 group-hover:scale-105"
                />

                {getStockBadge(product.stock) && (
                  <div className="absolute top-1 sm:top-2 left-1 sm:left-2">{getStockBadge(product.stock)}</div>
                )}

                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded sm:rounded-lg shadow-lg animate-pulse">
                  🔥
                </div>
              </div>

              {/* Product Info */}
              <div className="p-2 sm:p-3 md:p-4">
                <h3 className="font-semibold text-gray-100 mb-1 sm:mb-2 line-clamp-2 text-xs sm:text-sm md:text-base min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem]">
                  {product.name}
                </h3>

                <div className="mb-1.5 sm:mb-2 md:mb-3">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-orange-400">
                    Rp{parseInt(product.price).toLocaleString('id-ID')}
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1">
                    <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-500 line-through">
                      Rp{parseInt(product.price * 1.2).toLocaleString('id-ID')}
                    </span>
                    <span className="bg-red-900 text-red-300 text-[9px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 md:px-2 py-0.5 rounded font-semibold">
                      -50%
                    </span>
                  </div>
                </div>

                {/* Rating & Sales */}
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-gray-400 mb-1.5 sm:mb-2 md:mb-3">
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 text-yellow-500 fill-current" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                    </svg>
                    <span>4.9</span>
                  </div>
                  <div className="truncate">Terjual 100rb+</div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white 
                  py-1.5 sm:py-2 md:py-3 rounded-lg sm:rounded-xl hover:from-orange-700 hover:to-red-700 
                  active:from-orange-800 active:to-red-800
                  transition-all duration-200
                  disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed 
                  font-bold text-[10px] sm:text-xs md:text-sm lg:text-base shadow-lg hover:shadow-xl
                  touch-manipulation active:scale-95 flex items-center justify-center gap-1 sm:gap-2"
                >
                  {product.stock === 0 ? (
                    <>
                      <span>❌</span>
                      <span className="hidden sm:inline">Stok Habis</span>
                      <span className="sm:hidden">Habis</span>
                    </>
                  ) : (
                    <>
                      {/* Anda bisa menambahkan ikon cart/keranjang di sini jika mau */}
                      <span className="hidden sm:inline">Beli Sekarang</span>
                      <span className="sm:hidden">Beli Sekarang</span>
                    </>
                  )}
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Style untuk menyembunyikan scrollbar pada kategori */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}