import { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Loader2, X } from 'lucide-react';

const PaymentModal = ({ isOpen, onClose, type = 'success', title, message, autoClose = false, autoCloseDelay = 3000 }) => {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'error':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      case 'loading':
        return <Loader2 className="w-16 h-16 text-orange-500 animate-spin" />;
      default:
        return <CheckCircle className="w-16 h-16 text-blue-500" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          button: 'bg-green-500 hover:bg-green-600'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          button: 'bg-red-500 hover:bg-red-600'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          button: 'bg-yellow-500 hover:bg-yellow-600'
        };
      case 'loading':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          button: 'bg-orange-500 hover:bg-orange-600'
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          button: 'bg-blue-500 hover:bg-blue-600'
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={type !== 'loading' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
        {/* Close Button - hanya tampil jika bukan loading */}
        {type !== 'loading' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            {getIcon()}
          </div>

          {/* Title */}
          {title && (
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {title}
            </h3>
          )}

          {/* Message */}
          {message && (
            <div className={`${styles.bg} ${styles.border} border rounded-xl p-4 mb-6`}>
              <p className={`${styles.text} text-sm leading-relaxed`}>
                {message}
              </p>
            </div>
          )}

          {/* Auto Close Progress Bar */}
          {autoClose && type === 'success' && (
            <div className="mb-6">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 animate-progress"
                  style={{ 
                    animation: `progress ${autoCloseDelay}ms linear forwards` 
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Otomatis tertutup dalam {autoCloseDelay / 1000} detik...
              </p>
            </div>
          )}

          {/* Action Button - hanya tampil jika bukan loading dan bukan auto close */}
          {type !== 'loading' && !autoClose && (
            <button
              onClick={onClose}
              className={`w-full py-3 ${styles.button} text-white rounded-lg font-semibold transition-colors shadow-lg`}
            >
              Tutup
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-progress {
          width: 0%;
        }
      `}</style>
    </div>
  );
};

export default PaymentModal;