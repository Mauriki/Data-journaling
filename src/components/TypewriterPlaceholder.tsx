import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TypewriterPlaceholderProps {
    prompts: string[];
    className?: string;
}

const TypewriterPlaceholder: React.FC<TypewriterPlaceholderProps> = ({ prompts, className }) => {
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
        }, 5000); // Change every 5 seconds
        return () => clearInterval(interval);
    }, [prompts]);

    return (
        <div className={`pointer-events-none absolute top-0 left-0 w-full h-full p-0 overflow-hidden ${className}`}>
            <AnimatePresence mode="wait">
                <motion.span
                    key={currentPromptIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }} // 30% opacity as requested
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }} // 0.4s fade
                    className="block"
                >
                    {prompts[currentPromptIndex]}
                </motion.span>
            </AnimatePresence>
        </div>
    );
};

export default TypewriterPlaceholder;
