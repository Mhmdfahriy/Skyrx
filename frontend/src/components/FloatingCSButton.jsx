import { useState } from 'react';

export default function FloatingCSButton({ onOpenChat }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute bottom-full right-0 mb-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg">
          Ada yang bisa kami bantu?
          <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-2 h-2 bg-gray-800"></div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={onOpenChat}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group relative bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-3 overflow-hidden"
        aria-label="Customer Service"
      >
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-30"></div>
        
        {/* Content */}
        <div className="relative flex items-center gap-3 px-5 py-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="hidden md:block font-semibold text-sm">Customer Care</span>
        </div>

        
      </button>
    </div>
  );
}