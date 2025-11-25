import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ProfileModal({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  onConfirm,
  confirmText = 'OK',
  cancelText = 'Batal',
  showCancel = false
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    }
  }, [isOpen]);

  if (!isOpen && !isAnimating) return null;

  const typeConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-500'
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-500'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      borderColor: 'border-yellow-500'
    },
    info: {
      icon: Info,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-500'
    },
    confirm: {
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-500'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    handleClose();
  };

  return (
    <>
      {/* Backdrop with fade animation */}
      <div 
        className={`fixed inset-0 bg-black z-[9998] transition-opacity duration-300 ease-out ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Modal with scale and fade animation */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div 
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transition-all duration-300 ease-out ${
            isAnimating 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 translate-y-4'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className={`${config.bgColor} p-2 rounded-lg transition-transform hover:scale-110`}>
                <Icon className={`${config.color} w-6 h-6`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 duration-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-2xl">
            {showCancel && (
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                type === 'error' 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : type === 'success'
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : type === 'warning'
                  ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}