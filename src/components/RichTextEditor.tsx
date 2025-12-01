import React, { useRef, useEffect } from 'react';
import TypewriterPlaceholder from './TypewriterPlaceholder';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    animatedPlaceholder?: string[];
    className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    animatedPlaceholder,
    className = ''
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <div className={`relative w-full min-h-[100px] ${className}`}>
            {/* Placeholder Layer */}
            {!value && animatedPlaceholder && animatedPlaceholder.length > 0 && (
                <TypewriterPlaceholder
                    prompts={animatedPlaceholder}
                    className="text-apple-gray/50 dark:text-zinc-500/50 text-base leading-relaxed pl-1 pt-1"
                />
            )}

            {/* Input Layer */}
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none resize-none text-base leading-relaxed text-gray-800 dark:text-gray-100 placeholder-transparent focus:ring-0 p-1"
                spellCheck={false}
            />
        </div>
    );
};

export default RichTextEditor;
