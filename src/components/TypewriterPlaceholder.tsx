import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypewriterPlaceholderProps {
    prompts: string[];
    className?: string;
}

const TypewriterPlaceholder: React.FC<TypewriterPlaceholderProps> = ({ prompts, className }) => {
    const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);

    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setCursorVisible((v) => !v);
        }, 500);
        return () => clearInterval(cursorInterval);
    }, []);

    useEffect(() => {
        const currentPrompt = prompts[currentPromptIndex];
        const typeSpeed = isDeleting ? 30 : 50; // Faster delete, natural type
        const pauseEnd = 3000; // Pause at end of sentence

        const handleTyping = () => {
            if (!isDeleting) {
                // Typing
                if (displayedText.length < currentPrompt.length) {
                    setDisplayedText(currentPrompt.slice(0, displayedText.length + 1));
                } else {
                    // Finished typing, wait then delete
                    setTimeout(() => setIsDeleting(true), pauseEnd);
                    return;
                }
            } else {
                // Deleting
                if (displayedText.length > 0) {
                    setDisplayedText(currentPrompt.slice(0, displayedText.length - 1));
                } else {
                    // Finished deleting, move to next prompt
                    setIsDeleting(false);
                    setCurrentPromptIndex((prev) => (prev + 1) % prompts.length);
                    return;
                }
            }
        };

        const timer = setTimeout(handleTyping, typeSpeed);
        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentPromptIndex, prompts]);

    return (
        <div className={`pointer-events-none absolute top-0 left-0 w-full h-full p-0 ${className}`}>
            <span className="opacity-40 dark:opacity-30">{displayedText}</span>
            <motion.span
                animate={{ opacity: cursorVisible ? 1 : 0 }}
                transition={{ duration: 0.1 }}
                className="inline-block w-[2px] h-[1em] bg-blue-500 dark:bg-blue-400 ml-0.5 align-middle"
            />
        </div>
    );
};

export default TypewriterPlaceholder;
