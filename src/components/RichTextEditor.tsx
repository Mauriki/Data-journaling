import React, { useRef, useEffect, useState } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);
    const editableRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Toggle checkbox state
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

    // Handle text input in contenteditable line
    const handleLineInput = (lineIndex: number, newText: string) => {
        const lines = value.split('\n');
        const oldLine = lines[lineIndex];

        // Preserve checkbox prefix
        if (oldLine.startsWith('- [ ] ')) {
            lines[lineIndex] = '- [ ] ' + newText;
        } else if (oldLine.startsWith('- [x] ')) {
            lines[lineIndex] = '- [x] ' + newText;
        } else if (oldLine.startsWith('• ')) {
            lines[lineIndex] = '• ' + newText;
        } else {
            lines[lineIndex] = newText;
        }

        onChange(lines.join('\n'));
    };

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent, lineIndex: number) => {
        const lines = value.split('\n');
        const currentLine = lines[lineIndex];

        if (e.key === 'Enter') {
            e.preventDefault();

            // Continue list patterns
            let newLinePrefix = '';
            if (currentLine.startsWith('- [ ] ') || currentLine.startsWith('- [x] ')) {
                // If line is just empty checkbox, remove it
                if (currentLine === '- [ ] ' || currentLine === '- [x] ') {
                    lines[lineIndex] = '';
                    onChange(lines.join('\n'));
                    return;
                }
                newLinePrefix = '- [ ] ';
            } else if (currentLine.startsWith('• ')) {
                if (currentLine === '• ') {
                    lines[lineIndex] = '';
                    onChange(lines.join('\n'));
                    return;
                }
                newLinePrefix = '• ';
            } else if (/^\d+\. /.test(currentLine)) {
                const num = parseInt(currentLine.match(/^(\d+)/)?.[1] || '0');
                if (currentLine.trim() === `${num}.`) {
                    lines[lineIndex] = '';
                    onChange(lines.join('\n'));
                    return;
                }
                newLinePrefix = `${num + 1}. `;
            }

            lines.splice(lineIndex + 1, 0, newLinePrefix);
            onChange(lines.join('\n'));

            // Focus next line
            setTimeout(() => {
                const nextLine = containerRef.current?.querySelector(`[data-line="${lineIndex + 1}"]`) as HTMLElement;
                nextLine?.focus();
            }, 10);
        } else if (e.key === 'Backspace' && !lines[lineIndex].replace(/^(- \[[ x]\] |• |\d+\. )/, '')) {
            e.preventDefault();
            if (lineIndex > 0) {
                lines.splice(lineIndex, 1);
                onChange(lines.join('\n'));
            }
        } else if (e.key === 'ArrowUp' && lineIndex > 0) {
            e.preventDefault();
            const prevLine = containerRef.current?.querySelector(`[data-line="${lineIndex - 1}"]`) as HTMLElement;
            prevLine?.focus();
        } else if (e.key === 'ArrowDown' && lineIndex < lines.length - 1) {
            e.preventDefault();
            const nextLine = containerRef.current?.querySelector(`[data-line="${lineIndex + 1}"]`) as HTMLElement;
            nextLine?.focus();
        }
    };

    // Auto-format when typing shortcuts
    const handleInput = (lineIndex: number, e: React.FormEvent<HTMLSpanElement>) => {
        const text = (e.target as HTMLElement).textContent || '';
        const lines = value.split('\n');

        // Detect checkbox pattern: [] followed by space anywhere, or just []  
        if (text.includes('[] ') || text === '[]' || text.includes('[ ] ')) {
            // Convert to checkbox
            const content = text.replace(/\[\] ?/g, '').replace(/\[ \] ?/g, '').trim();
            lines[lineIndex] = '- [ ] ' + content;
            onChange(lines.join('\n'));
            setTimeout(() => {
                const line = containerRef.current?.querySelector(`[data-line="${lineIndex}"]`) as HTMLElement;
                if (line) {
                    line.focus();
                    // Move cursor to end
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(line);
                    range.collapse(false);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                }
            }, 10);
            return;
        }

        // Detect bullet pattern
        if (text === '- ' || text === '* ' || text.startsWith('- ') && text.length === 2 || text.startsWith('* ') && text.length === 2) {
            lines[lineIndex] = '• ';
            onChange(lines.join('\n'));
            setTimeout(() => {
                const line = containerRef.current?.querySelector(`[data-line="${lineIndex}"]`) as HTMLElement;
                line?.focus();
            }, 10);
            return;
        }

        handleLineInput(lineIndex, text);
    };

    // Add new line
    const addNewLine = () => {
        onChange(value + (value ? '\n' : ''));
        setTimeout(() => {
            const lines = value.split('\n');
            const lastLine = containerRef.current?.querySelector(`[data-line="${lines.length}"]`) as HTMLElement;
            lastLine?.focus();
        }, 10);
    };

    // Toolbar actions
    const insertAtCursor = (prefix: string) => {
        const lines = value.split('\n');
        lines.push(prefix);
        onChange(lines.join('\n'));
        setTimeout(() => {
            const lastLine = containerRef.current?.querySelector(`[data-line="${lines.length - 1}"]`) as HTMLElement;
            lastLine?.focus();
        }, 10);
    };

    const toolbarButtons = [
        { icon: Bold, action: () => { }, title: 'Bold (Cmd+B)' },
        { icon: Italic, action: () => { }, title: 'Italic (Cmd+I)' },
        { icon: Heading2, action: () => insertAtCursor('## '), title: 'Heading' },
        { icon: List, action: () => insertAtCursor('• '), title: 'Bullet' },
        { icon: CheckSquare, action: () => insertAtCursor('- [ ] '), title: 'Checkbox' },
        { icon: ListOrdered, action: () => insertAtCursor('1. '), title: 'Number' },
        { icon: Quote, action: () => insertAtCursor('> '), title: 'Quote' },
        { icon: Minus, action: () => insertAtCursor('---'), title: 'Line' },
    ];

    // Render a single line
    const renderLine = (line: string, index: number) => {
        // Checkbox unchecked
        if (line.startsWith('- [ ] ')) {
            const content = line.substring(6);
            return (
                <div key={index} className="flex items-start gap-2 py-0.5 group">
                    <button
                        type="button"
                        onClick={() => toggleCheckbox(index)}
                        className="mt-1 w-4 h-4 rounded border-2 border-stone-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 hover:border-accent-leather dark:hover:border-accent-warm transition-colors flex-shrink-0 flex items-center justify-center cursor-pointer"
                    />
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        data-line={index}
                        onInput={(e) => handleInput(index, e)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setIsFocused(true)}
                        className="flex-1 outline-none text-stone-800 dark:text-gray-200 min-h-[1.5em]"
                    >
                        {content}
                    </span>
                </div>
            );
        }

        // Checkbox checked
        if (line.startsWith('- [x] ')) {
            const content = line.substring(6);
            return (
                <div key={index} className="flex items-start gap-2 py-0.5 group">
                    <button
                        type="button"
                        onClick={() => toggleCheckbox(index)}
                        className="mt-1 w-4 h-4 rounded border-2 border-accent-leather dark:border-accent-warm bg-accent-leather dark:bg-accent-warm flex-shrink-0 flex items-center justify-center cursor-pointer"
                    >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        data-line={index}
                        onInput={(e) => handleInput(index, e)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setIsFocused(true)}
                        className="flex-1 outline-none text-stone-400 dark:text-zinc-500 line-through min-h-[1.5em]"
                    >
                        {content}
                    </span>
                </div>
            );
        }

        // Bullet point
        if (line.startsWith('• ')) {
            const content = line.substring(2);
            return (
                <div key={index} className="flex items-start gap-2 py-0.5">
                    <span className="mt-0.5 text-accent-leather dark:text-accent-warm font-bold">•</span>
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        data-line={index}
                        onInput={(e) => handleInput(index, e)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setIsFocused(true)}
                        className="flex-1 outline-none text-stone-800 dark:text-gray-200 min-h-[1.5em]"
                    >
                        {content}
                    </span>
                </div>
            );
        }

        // Heading
        if (line.startsWith('## ')) {
            return (
                <h2
                    key={index}
                    contentEditable
                    suppressContentEditableWarning
                    data-line={index}
                    onInput={(e) => {
                        const text = (e.target as HTMLElement).textContent || '';
                        const lines = value.split('\n');
                        lines[index] = '## ' + text;
                        onChange(lines.join('\n'));
                    }}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={() => setIsFocused(true)}
                    className="text-lg font-bold text-stone-900 dark:text-white my-1 outline-none"
                >
                    {line.substring(3)}
                </h2>
            );
        }

        // Quote
        if (line.startsWith('> ')) {
            return (
                <div key={index} className="border-l-3 border-accent-leather pl-3 py-0.5">
                    <span
                        contentEditable
                        suppressContentEditableWarning
                        data-line={index}
                        onInput={(e) => handleInput(index, e)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => setIsFocused(true)}
                        className="text-stone-500 dark:text-zinc-400 italic outline-none block min-h-[1.5em]"
                    >
                        {line.substring(2)}
                    </span>
                </div>
            );
        }

        // HR
        if (line === '---') {
            return <hr key={index} className="border-t border-stone-200 dark:border-zinc-700 my-2" />;
        }

        // Regular paragraph
        return (
            <p
                key={index}
                contentEditable
                suppressContentEditableWarning
                data-line={index}
                onInput={(e) => handleInput(index, e)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={() => setIsFocused(true)}
                className="text-stone-800 dark:text-gray-200 outline-none min-h-[1.5em] py-0.5"
            >
                {line || '\u200B'}
            </p>
        );
    };

    const lines = value ? value.split('\n') : [''];

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Toolbar */}
            {isFocused && (
                <>
                    {!showToolbar ? (
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => setShowToolbar(true)}
                            className={`flex items-center gap-1 px-2 py-1 mb-2 rounded-md text-xs font-medium text-stone-400 hover:text-stone-600 dark:text-zinc-500 dark:hover:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all ${isMobile ? 'fixed bottom-4 left-3 z-50 bg-white dark:bg-zinc-800 shadow-lg border border-stone-200 dark:border-zinc-700' : ''}`}
                        >
                            <Type size={14} />
                            <span className="hidden sm:inline">Format</span>
                        </button>
                    ) : (
                        <div className={`flex items-center gap-px p-1 bg-stone-50 dark:bg-zinc-800/80 rounded-lg border border-stone-200/50 dark:border-zinc-700/50 mb-2 ${isMobile ? 'fixed bottom-4 left-3 right-3 z-50 shadow-lg' : 'w-fit'}`}>
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
                </>
            )}

            {/* Editor */}
            <div
                ref={editableRef}
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        addNewLine();
                    }
                }}
                onBlur={(e) => {
                    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                        setIsFocused(false);
                    }
                }}
                className="min-h-[60px] cursor-text"
            >
                {!value && animatedPlaceholder && (
                    <div
                        className="absolute top-0 left-0 pointer-events-none"
                        onClick={() => {
                            const firstLine = containerRef.current?.querySelector('[data-line="0"]') as HTMLElement;
                            firstLine?.focus();
                        }}
                    >
                        <TypewriterPlaceholder
                            prompts={animatedPlaceholder}
                            className="text-stone-400 dark:text-zinc-500 text-base"
                        />
                    </div>
                )}
                {lines.map((line, i) => renderLine(line, i))}
            </div>
        </div>
    );
};

export default RichTextEditor;
