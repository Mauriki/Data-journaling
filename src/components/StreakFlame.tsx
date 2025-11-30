import React from 'react';
import { motion } from 'framer-motion';

interface StreakFlameProps {
    size?: number;
    className?: string;
}

const StreakFlame: React.FC<StreakFlameProps> = ({ size = 24, className = '' }) => {
    return (
        <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
            {/* Outer Glow */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute inset-0 bg-orange-500/30 rounded-full blur-md"
            />

            {/* Smoke/Steam Particles - Refined to be wispy and not "dot-like" */}
            {[...Array(3)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -5, x: 0, opacity: 0, scale: 0.5 }}
                    animate={{
                        y: -size * 1.8,
                        x: (i % 2 === 0 ? 1 : -1) * (size * 0.4) + (Math.random() * 4 - 2), // Natural spread
                        opacity: [0, 0.3, 0], // Lower max opacity for subtlety
                        scale: [0.8, 1.5, 0.8], // Grow larger to diffuse
                    }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: i * 0.8,
                        ease: "easeOut"
                    }}
                    className="absolute top-[-10%] w-2 h-2 bg-white/20 rounded-full blur-[2px]" // Increased blur, lower opacity
                />
            ))}

            {/* Steam Particles */}


            {/* Base Flame (Orange/Red) */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 0.95, 1], // More dynamic scale
                    rotate: [-3, 3, -2, 0], // More dynamic rotation
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute bottom-0 w-full h-full origin-bottom"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full drop-shadow-sm"
                >
                    <path
                        d="M8.5 14.5C8.5 14.5 9.5 12.5 12 12.5C14.5 12.5 15.5 14.5 15.5 14.5"
                        stroke="#F97316"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0" // Hidden guide path
                    />
                    <path
                        d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z"
                        fill="url(#flameGradient)"
                    />
                    <defs>
                        <linearGradient id="flameGradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#FDBA74" /> {/* Orange-300 */}
                            <stop offset="50%" stopColor="#F97316" /> {/* Orange-500 */}
                            <stop offset="100%" stopColor="#EF4444" /> {/* Red-500 */}
                        </linearGradient>
                    </defs>
                </svg>
            </motion.div>

            {/* Inner Core (Yellow/White) */}
            <motion.div
                animate={{
                    scale: [0.8, 0.9, 0.8],
                    y: [0, -1, 0],
                }}
                transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                }}
                className="absolute bottom-[15%] w-[40%] h-[40%] origin-bottom"
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-full h-full"
                >
                    <path
                        d="M12 18C14.2091 18 16 16.2091 16 14C16 11 12 8 12 8C12 8 8 11 8 14C8 16.2091 9.79086 18 12 18Z"
                        fill="#FEF08A" // Yellow-200
                        className="drop-shadow-[0_0_4px_rgba(253,224,71,0.8)]"
                    />
                </svg>
            </motion.div>
        </div>
    );
};

export default StreakFlame;
