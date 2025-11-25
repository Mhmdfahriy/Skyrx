// src/components/ChatModal.jsx
import { useEffect } from 'react';
import Chat from '../pages/Chat';

export default function ChatModal({ isOpen, onClose }) {
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

  return (
    <>
      {/* Backdrop/Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      
      <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 z-50 w-full md:w-96 animate-slide-up">
        <div className="bg-white rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden h-[100vh] md:h-[600px] flex flex-col">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
                <img 
                  src="https://ui-avatars.com/api/?name=MinSkyrx&background=0D9488&color=fff&size=128" 
                  alt="MinSkyrx"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div>
                <h3 className="font-bold text-base">MinSkyrx</h3>
                <p className="text-xs text-teal-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">

              {/* Close Button */}
              <button
                onClick={onClose}
                className="hover:bg-white/20 p-2 rounded-lg transition"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Chat Content - Flex Grow */}
          <div className="flex-1 overflow-hidden">
            <Chat />
          </div>
        </div>
      </div>

      {/* Animation */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
