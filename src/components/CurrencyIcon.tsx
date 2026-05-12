import React from 'react';

interface CurrencyIconProps {
  className?: string;
  size?: number;
}

export const CurrencyIcon: React.FC<CurrencyIconProps> = ({ className = "", size = 12 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ml-2 ${className}`}
      title="Osmic Coins"
    >
      {/* Outer Cosmic Glow */}
      <div 
        className="absolute inset-0 bg-cyan-400/20 blur-[6px] rounded-full scale-[2.5] animate-pulse"
        style={{ width: size, height: size }}
      />
      <div 
        className="absolute inset-0 bg-purple-500/20 blur-[4px] rounded-full scale-[1.8]"
        style={{ width: size, height: size }}
      />
      
      {/* The Space Gem */}
      <div 
        className="relative rotate-45 overflow-hidden shadow-[0_0_15px_rgba(34,211,238,0.4)] border-[0.5px] border-white/40"
        style={{ 
          width: size, 
          height: size,
          background: 'linear-gradient(135deg, #22d3ee 0%, #3b82f6 30%, #8b5cf6 70%, #d946ef 100%)',
          borderRadius: size * 0.05 // sharper corners for a gem feel
        }}
      >
        {/* Main Vertical Facet */}
        <div 
          className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{ transform: 'rotate(-45deg) translateX(-20%)' }}
        />
        
        {/* Nebula/Inner Cloud Effect */}
        <div 
          className="absolute inset-[10%] bg-white/10 blur-[2px] rounded-full"
        />
        
        {/* Star Glint (The Sparkle) */}
        <div 
          className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-white rounded-full blur-[1px] opacity-90 shadow-[0_0_8px_white]"
        />
        
        {/* Bottom Shade for Depth */}
        <div 
          className="absolute bottom-0 right-0 w-full h-1/2 bg-black/20"
        />
      </div>
    </div>
  );
};
