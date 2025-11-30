import React from 'react';
import { motion } from 'framer-motion';

interface MenuIconProps {
    isOpen: boolean;
    className?: string;
}

export const MenuIcon: React.FC<MenuIconProps> = ({ isOpen, className = '' }) => {
    const variant = isOpen ? "opened" : "closed";

    const top = {
        closed: { rotate: 0, translateY: 0 },
        opened: { rotate: 45, translateY: 6 }
    };

    const bottom = {
        closed: { rotate: 0, translateY: 0 },
        opened: { rotate: -45, translateY: -6 }
    };

    return (
        <div className={`flex flex-col justify-center items-center w-6 h-6 gap-[10px] ${className}`}>
            <motion.span
                animate={variant}
                variants={top}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-5 h-[2px] bg-current rounded-full origin-center block"
            />
            <motion.span
                animate={variant}
                variants={bottom}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="w-5 h-[2px] bg-current rounded-full origin-center block"
            />
        </div>
    );
};
