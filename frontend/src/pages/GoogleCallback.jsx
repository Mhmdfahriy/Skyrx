import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleGoogleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      console.log('Google Callback - Token:', token ? 'received' : 'none');
      console.log('Google Callback - Error:', error);

      if (token) {
        try {
          setStatus('success');
          localStorage.setItem('token', token);
          
          // Tunggu checkAuth selesai
          await checkAuth();
          
          // Redirect ke products
          setTimeout(() => {
            navigate('/products', { replace: true });
          }, 500);
          
        } catch (err) {
          console.error('Error during Google callback:', err);
          setStatus('error');
          setTimeout(() => {
            navigate('/login?error=Authentication failed', { replace: true });
          }, 1500);
        }
      } else if (error) {
        setStatus('error');
        setTimeout(() => {
          navigate('/login?error=' + encodeURIComponent(error), { replace: true });
        }, 1500);
      } else {
        setStatus('error');
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 1000);
      }
    };

    handleGoogleCallback();
  }, [searchParams, navigate, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center">
        {status === 'processing' && (
          <>
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-xl font-semibold text-gray-700">Menyelesaikan login dengan Google...</div>
            <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="text-xl font-semibold text-gray-700">Login berhasil!</div>
            <p className="text-sm text-gray-500 mt-2">Mengalihkan ke halaman produk...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-xl font-semibold text-gray-700">Login gagal</div>
            <p className="text-sm text-gray-500 mt-2">Mengalihkan kembali ke halaman login...</p>
          </>
        )}
      </div>
    </div>
  );
}