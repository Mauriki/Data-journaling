import React from 'react';
import { Flame } from 'lucide-react';

interface StreakFlameProps {
    size?: number;
    status: 'unlit' | 'igniting' | 'burning';
    className?: string;
}

const StreakFlame: React.FC<StreakFlameProps> = ({ size = 24, status, className = '' }) => {
    const getColors = () => {
        switch (status) {
            case 'burning':
                return 'text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse';
            case 'igniting':
                return 'text-yellow-400 fill-yellow-400/50';
            case 'unlit':
            default:
                return 'text-gray-400 dark:text-gray-600';
        }
    };

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            <Flame
                size={size}
                className={`transition-all duration-500 ${getColors()}`}
            />
            {status === 'burning' && (
                <>
                    <div className="absolute inset-0 animate-ping opacity-20 blur-xl bg-orange-500 rounded-full scale-150" />
                    <div className="absolute inset-0 animate-pulse opacity-40 blur-md bg-orange-400 rounded-full scale-110" />
                </>
            )}
        </div>
    );
};

export default StreakFlame;
