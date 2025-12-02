export default function IconProduk() {
  return (
    <svg 
      className="w-full h-full" 
      viewBox="0 0 200 200" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shopping bag body */}
      <path 
        d="M50 70 L50 165 C50 170 55 175 60 175 L140 175 C145 175 150 170 150 165 L150 70"
        stroke="#f97316" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Handles */}
      <path 
        d="M70 70 L70 58 C70 40 82 28 100 28 C118 28 130 40 130 58 L130 70"
        stroke="#f97316" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Top edge */}
      <line 
        x1="40" y1="70" x2="160" y2="70"
        stroke="#f97316" 
        strokeWidth="6"
        strokeLinecap="round"
      />
      
      {/* Sad smile face */}
      <circle cx="80" cy="115" r="4" fill="#9ca3af"/>
      <circle cx="120" cy="115" r="4" fill="#9ca3af"/>
      <path d="M80 145 Q100 133 120 145" stroke="#9ca3af" strokeWidth="3" fill="none" strokeLinecap="round"/>
    </svg>
  );
}