import React from 'react';

interface StreakFlameProps {
  status: 'unlit' | 'igniting' | 'burning';
  size?: number;
  className?: string;
}

const StreakFlame: React.FC<StreakFlameProps> = ({ status, size = 24, className = '' }) => {
  if (status === 'unlit') {
    return (
      <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.7 1.7 1.2 2.5 2.9 2.8z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <div className="relative w-full h-full">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="w-full h-full drop-shadow-[0_0_10px_rgba(255,100,0,0.5)]"
          style={{ transformOrigin: 'bottom center' }}
        >
          <defs>
            <linearGradient id="flameGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>

          <path
            d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.7 1.7 1.2 2.5 2.9 2.8z"
            fill="url(#flameGradient)"
            className="animate-flame-outer"
            style={{ transformOrigin: 'center bottom' }}
          />

          <path
            d="M12 10c0-1 .5-2 1.5-2.5-1 1.5-1 2.5-1 3.5 0 1 .5 1.5 1 2-.5-.2-1-.8-1.5-1.5-.5.7-1 1.3-1.5 1.5.5-.5 1-1 1-2 0-1 0-2-1-3.5 1 .5 1.5 1.5 1.5 2.5z"
            fill="#fff"
            fillOpacity="0.8"
            className="animate-flame-inner"
            style={{ transformOrigin: 'center bottom' }}
          />
        </svg>

        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
          <div className="absolute bottom-0 left-1/2 w-[2px] h-[2px] bg-yellow-200 rounded-full animate-ember-1"></div>
          <div className="absolute bottom-0 left-1/2 w-[2px] h-[2px] bg-orange-200 rounded-full animate-ember-2"></div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StreakFlame);
