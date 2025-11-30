import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

interface FireArrowProps {
    startPos: { x: number; y: number };
    endPos: { x: number; y: number };
    onComplete: () => void;
}

const FireArrow: React.FC<FireArrowProps> = ({ startPos, endPos, onComplete }) => {
    const controls = useAnimation();

    useEffect(() => {
        const animate = async () => {
            await controls.start({
                x: [startPos.x, endPos.x],
                y: [startPos.y, endPos.y],
                scale: [0.5, 1.2, 0.8], // Grow then shrink slightly on impact
                opacity: [0, 1, 1],
                transition: {
                    duration: 0.45,
                    ease: [0.2, 0.8, 0.2, 1], // Custom ease for "shoot" feel
                }
            });
            onComplete();
        };
        animate();
    }, [startPos, endPos, controls, onComplete]);

    // Calculate angle for rotation
    const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x) * (180 / Math.PI);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <motion.div
                initial={{ x: startPos.x, y: startPos.y, opacity: 0 }}
                animate={controls}
                className="absolute w-8 h-8 flex items-center justify-center"
                style={{ rotate: angle }}
            >
                {/* Arrow Head (Fire) */}
                <div className="relative w-full h-full">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-orange-500 rounded-full blur-[2px] shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-300 rounded-full blur-[1px]" />

                    {/* Trail Particles */}
                    <motion.div
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-2 bg-gradient-to-l from-orange-500 to-transparent opacity-80 blur-[1px]"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default FireArrow;
