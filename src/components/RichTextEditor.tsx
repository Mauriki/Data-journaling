import React, { useRef, useEffect, useState, useCallback } from 'react';
import TypewriterPlaceholder from './TypewriterPlaceholder';
import { Bold, Italic, List, ListOrdered, Heading2, Quote, Minus, CheckSquare, X, Type } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    animatedPlaceholder?: string[];
    className?: string;
}

// Parse value into lines with checkbox metadata
interface ParsedLine {
    type: 'checkbox' | 'checked' | 'bullet' | 'text';
    content: string;
    raw: string;
}

const parseLine = (line: string): ParsedLine => {
    if (line.startsWith('- [ ] ')) return { type: 'checkbox', content: line.substring(6), raw: line };
    if (line.startsWith('- [x] ')) return { type: 'checked', content: line.substring(6), raw: line };
    if (line.startsWith('• ')) return { type: 'bullet', content: line.substring(2), raw: line };
    return { type: 'text', content: line, raw: line };
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    animatedPlaceholder,
    className = ''
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [editingLine, setEditingLine] = useState<number | null>(null);
    const lineRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleContainerClick = () => {
        if (!isFocused) {
            setIsFocused(true);
            // Focus last line or create new one
            const lines = value.split('\n');
            setEditingLine(lines.length - 1);
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (containerRef.current?.contains(e.relatedTarget as Node)) return;
        setIsFocused(false);
        setShowToolbar(false);
        setEditingLine(null);
    };

    // Toggle checkbox
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

    // Handle line text change
    const handleLineChange = (lineIndex: number, newContent: string, prefix: string = '') => {
        const lines = value.split('\n');

        // Auto-format shortcuts at start of line
        if (newContent === '[]' || newContent === '[ ]') {
            lines[lineIndex] = '- [ ] ';
            onChange(lines.join('\n'));
            return;
        }
        if (newContent === '-' || newContent === '*') {
            // Don't convert yet, wait for space
        }
        if (newContent.startsWith('[] ') || newContent.startsWith('[ ] ')) {
            const rest = newContent.replace(/^\[\] ?|^\[ \] ?/, '');
            lines[lineIndex] = '- [ ] ' + rest;
            onChange(lines.join('\n'));
            return;
        }
        if (newContent.startsWith('- ') && !newContent.startsWith('- [')) {
            lines[lineIndex] = '• ' + newContent.substring(2);
            onChange(lines.join('\n'));
            return;
        }
        if (newContent.startsWith('* ')) {
            lines[lineIndex] = '• ' + newContent.substring(2);
            onChange(lines.join('\n'));
            return;
        }

        lines[lineIndex] = prefix + newContent;
        onChange(lines.join('\n'));
    };

    // Handle keyboard events
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, lineIndex: number) => {
        const lines = value.split('\n');
        const line = lines[lineIndex];
        const parsed = parseLine(line);

        if (e.key === 'Enter') {
            e.preventDefault();

            // Continue list patterns
            let newLinePrefix = '';
            if (parsed.type === 'checkbox' || parsed.type === 'checked') {
                if (!parsed.content) {
                    // Empty checkbox - remove it
                    lines.splice(lineIndex, 1);
                    onChange(lines.join('\n'));
                    setEditingLine(Math.max(0, lineIndex - 1));
                    return;
                }
                newLinePrefix = '- [ ] ';
            } else if (parsed.type === 'bullet') {
                if (!parsed.content) {
                    lines.splice(lineIndex, 1);
                    onChange(lines.join('\n'));
                    setEditingLine(Math.max(0, lineIndex - 1));
                    return;
                }
                newLinePrefix = '• ';
            }

            lines.splice(lineIndex + 1, 0, newLinePrefix);
            onChange(lines.join('\n'));
            setEditingLine(lineIndex + 1);
        } else if (e.key === 'Backspace' && !parsed.content) {
            e.preventDefault();
            if (lineIndex > 0 || lines.length > 1) {
                lines.splice(lineIndex, 1);
                onChange(lines.join('\n') || '');
                setEditingLine(Math.max(0, lineIndex - 1));
            }
        } else if (e.key === 'ArrowUp' && lineIndex > 0) {
            e.preventDefault();
            setEditingLine(lineIndex - 1);
        } else if (e.key === 'ArrowDown' && lineIndex < lines.length - 1) {
            e.preventDefault();
            setEditingLine(lineIndex + 1);
        }
    };

    // Focus effect
    useEffect(() => {
        if (editingLine !== null && lineRefs.current[editingLine]) {
            lineRefs.current[editingLine]?.focus();
        }
    }, [editingLine]);

    // Insert at cursor position
    const insertLinePrefix = useCallback((prefix: string) => {
        const lines = value.split('\n');
        lines.push(prefix);
        onChange(lines.join('\n'));
        setEditingLine(lines.length - 1);
        setIsFocused(true);
    }, [value, onChange]);

    const toolbarButtons = [
        { icon: Bold, action: () => { }, title: 'Bold' },
        { icon: Italic, action: () => { }, title: 'Italic' },
        { icon: Heading2, action: () => insertLinePrefix('## '), title: 'Heading' },
        { icon: List, action: () => insertLinePrefix('• '), title: 'Bullet' },
        { icon: CheckSquare, action: () => insertLinePrefix('- [ ] '), title: 'Checkbox' },
        { icon: ListOrdered, action: () => insertLinePrefix('1. '), title: 'Number' },
        { icon: Quote, action: () => insertLinePrefix('> '), title: 'Quote' },
        { icon: Minus, action: () => insertLinePrefix('---'), title: 'Line' },
    ];

    const lines = value ? value.split('\n') : [''];

    // Render a single line
    const renderLine = (line: string, index: number) => {
        const parsed = parseLine(line);

        // Checkbox unchecked
        if (parsed.type === 'checkbox') {
            return (
                <div key={index} className="flex items-center gap-2 min-h-[28px] group">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleCheckbox(index); }}
                        className="w-[18px] h-[18px] rounded-[4px] border-2 border-stone-300 dark:border-zinc-500 bg-white dark:bg-zinc-800 hover:border-accent-leather dark:hover:border-accent-warm transition-all flex-shrink-0 shadow-sm"
                    />
                    <input
                        ref={el => lineRefs.current[index] = el}
                        type="text"
                        value={parsed.content}
                        onChange={(e) => handleLineChange(index, e.target.value, '- [ ] ')}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => { setIsFocused(true); setEditingLine(index); }}
                        onBlur={handleBlur}
                        className="flex-1 bg-transparent border-none outline-none text-stone-700 dark:text-gray-200 placeholder-stone-400"
                        placeholder="Task..."
                    />
                </div>
            );
        }

        // Checkbox checked
        if (parsed.type === 'checked') {
            return (
                <div key={index} className="flex items-center gap-2 min-h-[28px] group">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleCheckbox(index); }}
                        className="w-[18px] h-[18px] rounded-[4px] border-2 border-accent-leather dark:border-accent-warm bg-accent-leather dark:bg-accent-warm flex-shrink-0 flex items-center justify-center shadow-sm"
                    >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </button>
                    <input
                        ref={el => lineRefs.current[index] = el}
                        type="text"
                        value={parsed.content}
                        onChange={(e) => handleLineChange(index, e.target.value, '- [x] ')}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => { setIsFocused(true); setEditingLine(index); }}
                        onBlur={handleBlur}
                        className="flex-1 bg-transparent border-none outline-none text-stone-400 dark:text-zinc-500 line-through placeholder-stone-300"
                        placeholder=""
                    />
                </div>
            );
        }

        // Bullet point
        if (parsed.type === 'bullet') {
            return (
                <div key={index} className="flex items-center gap-2 min-h-[28px]">
                    <span className="w-[18px] text-center text-accent-leather dark:text-accent-warm font-bold text-lg">•</span>
                    <input
                        ref={el => lineRefs.current[index] = el}
                        type="text"
                        value={parsed.content}
                        onChange={(e) => handleLineChange(index, e.target.value, '• ')}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        onFocus={() => { setIsFocused(true); setEditingLine(index); }}
                        onBlur={handleBlur}
                        className="flex-1 bg-transparent border-none outline-none text-stone-700 dark:text-gray-200"
                        placeholder=""
                    />
                </div>
            );
        }

        // Header
        if (line.startsWith('## ')) {
            return (
                <h2 key={index} className="text-lg font-bold text-stone-800 dark:text-gray-100 my-1">
                    {line.substring(3)}
                </h2>
            );
        }

        // Quote
        if (line.startsWith('> ')) {
            return (
                <blockquote key={index} className="border-l-3 border-accent-leather pl-3 text-stone-500 dark:text-zinc-400 italic my-1">
                    {line.substring(2)}
                </blockquote>
            );
        }

        // HR
        if (line === '---') {
            return <hr key={index} className="border-t border-stone-200 dark:border-zinc-700 my-2" />;
        }

        // Regular text line
        return (
            <div key={index} className="min-h-[28px]">
                <input
                    ref={el => lineRefs.current[index] = el}
                    type="text"
                    value={line}
                    onChange={(e) => handleLineChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={() => { setIsFocused(true); setEditingLine(index); }}
                    onBlur={handleBlur}
                    className="w-full bg-transparent border-none outline-none text-stone-700 dark:text-gray-200"
                    placeholder=""
                />
            </div>
        );
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Polished Format Button Container - Apple-style subtle glass */}
            {isFocused && (
                <div className="mb-3">
                    {!showToolbar ? (
                        <div className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-stone-50/80 dark:bg-zinc-800/60 border border-stone-200/60 dark:border-zinc-700/40 backdrop-blur-sm shadow-sm">
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowToolbar(true)}
                                className="flex items-center gap-1.5 text-xs font-medium text-stone-500 dark:text-zinc-400 hover:text-stone-700 dark:hover:text-zinc-200 transition-colors"
                                title="Show formatting"
                            >
                                <Type size={13} />
                                <span>Format</span>
                            </button>
                        </div>
                    ) : (
                        <div className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-stone-50/90 dark:bg-zinc-800/80 border border-stone-200/60 dark:border-zinc-700/40 backdrop-blur-sm shadow-sm">
                            {toolbarButtons.map((btn, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={btn.action}
                                    title={btn.title}
                                    className="p-1.5 rounded-md text-stone-500 dark:text-zinc-400 hover:bg-stone-200/80 dark:hover:bg-zinc-700/80 hover:text-stone-700 dark:hover:text-white transition-all"
                                >
                                    <btn.icon size={14} />
                                </button>
                            ))}
                            <div className="w-px h-5 bg-stone-200 dark:bg-zinc-700 mx-1" />
                            <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowToolbar(false)}
                                className="p-1.5 rounded-md text-stone-400 hover:bg-stone-200/80 dark:hover:bg-zinc-700/80"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Editor Content */}
            <div
                onClick={handleContainerClick}
                className="min-h-[80px] cursor-text space-y-0.5"
            >
                {/* Animated placeholder */}
                {!value && animatedPlaceholder && animatedPlaceholder.length > 0 && !isFocused && (
                    <div className="pointer-events-none">
                        <TypewriterPlaceholder
                            prompts={animatedPlaceholder}
                            className="text-stone-400 dark:text-zinc-500 text-base"
                        />
                    </div>
                )}

                {/* Lines */}
                {(value || isFocused) && lines.map((line, i) => renderLine(line, i))}
            </div>
        </div>
    );
};

export default RichTextEditor;
