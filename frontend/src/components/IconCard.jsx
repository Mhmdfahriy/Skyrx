export default function EmptyCartIcon() {
  return (
    <svg 
      className="w-full h-full" 
      viewBox="0 0 200 200" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shopping basket body with pattern */}
      <path 
        d="M40 80 L50 160 C50 165 55 170 60 170 L140 170 C145 170 150 165 150 160 L160 80"
        stroke="#0891b2" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Vertical lines (basket weave pattern) */}
      <line x1="70" y1="85" x2="65" y2="165" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <line x1="100" y1="85" x2="100" y2="165" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      <line x1="130" y1="85" x2="135" y2="165" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" opacity="0.5"/>
      
      {/* Horizontal lines (basket weave) */}
      <line x1="45" y1="110" x2="155" y2="110" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="47" y1="135" x2="153" y2="135" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" opacity="0.3"/>
      
      {/* Top edge/rim with shadow */}
      <line 
        x1="30" y1="80" x2="170" y2="80"
        stroke="#0891b2" 
        strokeWidth="7"
        strokeLinecap="round"
      />
      
      {/* Left handle */}
      <path 
        d="M60 80 L68 52 C69 47 73 43 78 42 L85 42"
        stroke="#0891b2" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Right handle */}
      <path 
        d="M140 80 L132 52 C131 47 127 43 122 42 L115 42"
        stroke="#0891b2" 
        strokeWidth="6" 
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Handle connector top */}
      <line x1="85" y1="42" x2="115" y2="42" stroke="#0891b2" strokeWidth="6" strokeLinecap="round"/>
      
      {/* X Badge with glow effect */}
      <circle cx="155" cy="55" r="26" fill="#ef4444" opacity="0.2"/>
      <circle cx="155" cy="55" r="23" fill="#ef4444"/>
      <line 
        x1="144" y1="44" x2="166" y2="66"
        stroke="white" 
        strokeWidth="5"
        strokeLinecap="round"
      />
      <line 
        x1="166" y1="44" x2="144" y2="66"
        stroke="white" 
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}