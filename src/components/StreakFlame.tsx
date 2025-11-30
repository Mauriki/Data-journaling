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
            {/* Container for the flame */}
            <div className="relative w-full h-full">
                {/* Main Flame SVG */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-full h-full drop-shadow-[0_0_8px_rgba(255,107,56,0.6)] animate-flame-flicker"
                    style={{ transformOrigin: 'bottom center' }}
                >
                    <defs>
                        <linearGradient id="flameGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#fbbf24" /> {/* Amber-400 */}
                            <stop offset="40%" stopColor="#f97316" /> {/* Orange-500 */}
                            <stop offset="100%" stopColor="#ef4444" /> {/* Red-500 */}
                        </linearGradient>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>

                    {/* Inner Spark/Core */}
                    <path
                        d="M12 10c0-1 .5-2 1.5-2.5-1 1.5-1 2.5-1 3.5 0 1 .5 1.5 1 2-.5-.2-1-.8-1.5-1.5-.5.7-1 1.3-1.5 1.5.5-.5 1-1 1-2 0-1 0-2-1-3.5 1 .5 1.5 1.5 1.5 2.5z"
                        fill="#fff"
                        className="animate-pulse"
                        style={{ opacity: 0.8 }}
                    />

                    {/* Main Flame Body */}
                    <path
                        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.6-3.3.7 1.7 1.2 2.5 2.9 2.8z"
                        fill="url(#flameGradient)"
                        filter="url(#glow)"
                    />
                </svg>

                {/* Floating Embers/Sparks */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute bottom-1 left-1/2 w-0.5 h-0.5 bg-yellow-200 rounded-full animate-ember-rise" style={{ animationDelay: '0s', left: '40%' }}></div>
                    <div className="absolute bottom-2 left-1/2 w-0.5 h-0.5 bg-orange-200 rounded-full animate-ember-rise" style={{ animationDelay: '1.2s', left: '60%' }}></div>
                    <div className="absolute bottom-1 left-1/2 w-0.5 h-0.5 bg-yellow-100 rounded-full animate-ember-rise" style={{ animationDelay: '2.5s', left: '50%' }}></div>
                </div>
            </div>

            <style>{`
        @keyframes flame-flicker {
          0%, 100% { transform: scale3d(1, 1, 1) skewX(0deg); filter: brightness(1); }
          25% { transform: scale3d(1.02, 1.02, 1) skewX(1deg); filter: brightness(1.1); }
          50% { transform: scale3d(0.98, 0.98, 1) skewX(-1deg); filter: brightness(1); }
          75% { transform: scale3d(1.02, 1.02, 1) skewX(1deg); filter: brightness(1.1); }
        }
        @keyframes ember-rise {
          0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
          20% { opacity: 0.8; }
          100% { transform: translate3d(0, -14px, 0) scale(0); opacity: 0; }
        }
        .animate-flame-flicker {
          animation: flame-flicker 3s infinite ease-in-out;
          will-change: transform;
        }
        .animate-ember-rise {
          animation: ember-rise 2s infinite ease-out;
          will-change: transform, opacity;
        }
      `}</style>
        </div>
    );
};

export default React.memo(StreakFlame);
