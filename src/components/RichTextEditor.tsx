import React, { useRef, useEffect, useState, useCallback } from 'react';
import TypewriterPlaceholder from './TypewriterPlaceholder';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Minus, CheckSquare, X, Type } from 'lucide-react';

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
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.max(80, textareaRef.current.scrollHeight) + 'px';
        }
    }, [value]);

    const handleFocus = () => setIsFocused(true);

    const handleBlur = (e: React.FocusEvent) => {
        if (containerRef.current?.contains(e.relatedTarget as Node)) return;
        setIsFocused(false);
        setShowToolbar(false);
    };

    // Insert markdown around selection or at cursor
    const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const beforeText = value.substring(0, start);
        const afterText = value.substring(end);

        let newValue: string;
        let newCursorPos: number;

        if (selectedText) {
            newValue = beforeText + prefix + selectedText + suffix + afterText;
            newCursorPos = start + prefix.length + selectedText.length + suffix.length;
        } else {
            newValue = beforeText + prefix + suffix + afterText;
            newCursorPos = start + prefix.length;
        }

        onChange(newValue);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }, [value, onChange]);

    // Insert prefix at start of current line
    const insertLinePrefix = useCallback((prefix: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const beforeLine = value.substring(0, lineStart);
        const afterLineStart = value.substring(lineStart);

        const newValue = beforeLine + prefix + afterLineStart;
        onChange(newValue);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }, 0);
    }, [value, onChange]);

    // Auto-format markdown shortcuts
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        const textarea = textareaRef.current;
        if (!textarea) {
            onChange(newValue);
            return;
        }

        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = newValue.substring(0, cursorPos);
        const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
        const currentLine = textBeforeCursor.substring(lineStart);

        // Auto-format on space
        if (newValue[cursorPos - 1] === ' ') {
            const beforeLine = newValue.substring(0, lineStart);
            const afterCursor = newValue.substring(cursorPos);

            // [] or [ ] -> checkbox
            if (currentLine === '[] ' || currentLine === '[ ] ') {
                onChange(beforeLine + '- [ ] ' + afterCursor);
                setTimeout(() => textarea.setSelectionRange(lineStart + 6, lineStart + 6), 0);
                return;
            }
            // - or * -> bullet
            if (currentLine === '- ' || currentLine === '* ') {
                onChange(beforeLine + '• ' + afterCursor);
                setTimeout(() => textarea.setSelectionRange(lineStart + 2, lineStart + 2), 0);
                return;
            }
        }

        onChange(newValue);
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const isMod = e.metaKey || e.ctrlKey;
        const textarea = textareaRef.current;

        if (isMod && e.key === 'b') {
            e.preventDefault();
            insertMarkdown('**', '**');
        } else if (isMod && e.key === 'i') {
            e.preventDefault();
            insertMarkdown('*', '*');
        } else if (e.key === 'Enter' && textarea) {
            const cursorPos = textarea.selectionStart;
            const textBeforeCursor = value.substring(0, cursorPos);
            const lineStart = textBeforeCursor.lastIndexOf('\n') + 1;
            const currentLine = textBeforeCursor.substring(lineStart);

            // Auto-continue bullets
            if (/^• .+/.test(currentLine)) {
                e.preventDefault();
                const afterCursor = value.substring(cursorPos);
                onChange(value.substring(0, cursorPos) + '\n• ' + afterCursor);
                setTimeout(() => textarea.setSelectionRange(cursorPos + 3, cursorPos + 3), 0);
                return;
            }
            // Empty bullet - remove it
            if (currentLine === '• ' || currentLine === '• ') {
                e.preventDefault();
                onChange(value.substring(0, lineStart) + value.substring(cursorPos));
                setTimeout(() => textarea.setSelectionRange(lineStart, lineStart), 0);
                return;
            }
            // Auto-continue checkboxes
            if (/^- \[[ x]\] .+/.test(currentLine)) {
                e.preventDefault();
                const afterCursor = value.substring(cursorPos);
                onChange(value.substring(0, cursorPos) + '\n- [ ] ' + afterCursor);
                setTimeout(() => textarea.setSelectionRange(cursorPos + 7, cursorPos + 7), 0);
                return;
            }
            // Empty checkbox - remove it
            if (/^- \[[ x]\] ?$/.test(currentLine)) {
                e.preventDefault();
                onChange(value.substring(0, lineStart) + value.substring(cursorPos));
                setTimeout(() => textarea.setSelectionRange(lineStart, lineStart), 0);
                return;
            }
            // Auto-continue numbered lists
            const numMatch = currentLine.match(/^(\d+)\. .+/);
            if (numMatch) {
                e.preventDefault();
                const nextNum = parseInt(numMatch[1]) + 1;
                const afterCursor = value.substring(cursorPos);
                const prefix = `\n${nextNum}. `;
                onChange(value.substring(0, cursorPos) + prefix + afterCursor);
                setTimeout(() => textarea.setSelectionRange(cursorPos + prefix.length, cursorPos + prefix.length), 0);
                return;
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            insertMarkdown('  ');
        }
    };

    // Toggle checkbox in value
    const toggleCheckbox = (lineIndex: number) => {
        const lines = value.split('\n');
        const line = lines[lineIndex];

        if (line.startsWith('- [ ] ')) {
            lines[lineIndex] = line.replace('- [ ] ', '- [x] ');
        } else if (line.startsWith('- [x] ')) {
            lines[lineIndex] = line.replace('- [x] ', '- [ ] ');
        }

        onChange(lines.join('\n'));
    };

    // Render preview with interactive checkboxes
    const renderPreview = () => {
        if (!value) return null;

        return value.split('\n').map((line, i) => {
            // Unchecked checkbox
            if (line.startsWith('- [ ] ')) {
                return (
                    <div key={i} className="flex items-start gap-2 my-0.5">
                        <button
                            type="button"
                            onClick={() => toggleCheckbox(i)}
                            className="mt-1 w-4 h-4 rounded border-2 border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-accent-leather dark:hover:border-accent-warm transition-colors flex-shrink-0"
                        />
                        <span className="text-stone-700 dark:text-gray-300">{line.substring(6)}</span>
                    </div>
                );
            }
            // Checked checkbox
            if (line.startsWith('- [x] ')) {
                return (
                    <div key={i} className="flex items-start gap-2 my-0.5">
                        <button
                            type="button"
                            onClick={() => toggleCheckbox(i)}
                            className="mt-1 w-4 h-4 rounded border-2 border-accent-leather dark:border-accent-warm bg-accent-leather dark:bg-accent-warm flex-shrink-0 flex items-center justify-center"
                        >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </button>
                        <span className="text-stone-400 dark:text-zinc-500 line-through">{line.substring(6)}</span>
                    </div>
                );
            }
            // Bullet
            if (line.startsWith('• ')) {
                return <div key={i} className="flex items-start gap-2 my-0.5"><span className="text-accent-leather">•</span><span className="text-stone-700 dark:text-gray-300">{line.substring(2)}</span></div>;
            }
            // Headers
            if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold text-stone-800 dark:text-gray-200 mt-2">{line.substring(4)}</h3>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-stone-800 dark:text-gray-200 mt-2">{line.substring(3)}</h2>;
            if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold text-stone-800 dark:text-gray-200 mt-2">{line.substring(2)}</h1>;
            // Quote
            if (line.startsWith('> ')) return <blockquote key={i} className="border-l-3 border-accent-leather pl-3 text-stone-500 dark:text-zinc-400 italic my-1">{line.substring(2)}</blockquote>;
            // HR
            if (line === '---') return <hr key={i} className="border-t border-stone-200 dark:border-zinc-700 my-2" />;
            // Regular text
            if (!line) return <br key={i} />;
            return <p key={i} className="text-stone-700 dark:text-gray-300 my-0.5">{line}</p>;
        });
    };

    const toolbarButtons = [
        { icon: Bold, action: () => insertMarkdown('**', '**'), title: 'Bold' },
        { icon: Italic, action: () => insertMarkdown('*', '*'), title: 'Italic' },
        { icon: Heading2, action: () => insertLinePrefix('## '), title: 'Heading' },
        { icon: List, action: () => insertLinePrefix('• '), title: 'Bullet' },
        { icon: CheckSquare, action: () => insertLinePrefix('- [ ] '), title: 'Checkbox' },
        { icon: ListOrdered, action: () => insertLinePrefix('1. '), title: 'Number' },
        { icon: Quote, action: () => insertLinePrefix('> '), title: 'Quote' },
        { icon: Minus, action: () => insertMarkdown('\n---\n'), title: 'Line' },
    ];

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Toolbar - at TOP of text box */}
            {isFocused && (
                <div className="mb-2">
                    {!showToolbar ? (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowToolbar(true)}
                            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all"
                            title="Show formatting"
                        >
                            <Type size={14} />
                            <span>Format</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-px p-1 bg-stone-50 dark:bg-zinc-800/80 rounded-lg border border-stone-200/50 dark:border-zinc-700/50 w-fit">
                            {toolbarButtons.map((btn, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={btn.action}
                                    title={btn.title}
                                    className="p-1.5 rounded text-stone-500 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700 hover:text-stone-700 dark:hover:text-white transition-all"
                                >
                                    <btn.icon size={14} />
                                </button>
                            ))}
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowToolbar(false)}
                                className="p-1.5 rounded text-stone-400 hover:bg-stone-200 dark:hover:bg-zinc-700 ml-1"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Editor or Preview */}
            <div className="relative min-h-[80px]">
                {isFocused ? (
                    <>
                        {/* Animated placeholder */}
                        {!value && animatedPlaceholder && animatedPlaceholder.length > 0 && (
                            <div className="absolute top-0 left-0 pointer-events-none z-10">
                                <TypewriterPlaceholder
                                    prompts={animatedPlaceholder}
                                    className="text-stone-400 dark:text-zinc-500 text-base leading-relaxed"
                                />
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={value}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            className="w-full bg-transparent border-none outline-none resize-none text-base leading-relaxed text-stone-800 dark:text-gray-100 placeholder-transparent focus:ring-0 min-h-[80px]"
                            spellCheck={false}
                        />
                    </>
                ) : (
                    <div
                        onClick={() => {
                            setIsFocused(true);
                            setTimeout(() => textareaRef.current?.focus(), 0);
                        }}
                        className="cursor-text min-h-[80px]"
                    >
                        {value ? (
                            renderPreview()
                        ) : (
                            animatedPlaceholder && animatedPlaceholder.length > 0 && (
                                <TypewriterPlaceholder
                                    prompts={animatedPlaceholder}
                                    className="text-stone-400 dark:text-zinc-500 text-base leading-relaxed"
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RichTextEditor;
