import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Minus, Quote } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = '120px' }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  // Sync initial value
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      // Only update if significantly different to avoid cursor jumps
      // Simple check: if empty, just set it.
      if (value === '' && contentRef.current.innerHTML === '<br>') return;
      contentRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (contentRef.current) {
      contentRef.current.focus();
      onChange(contentRef.current.innerHTML);
    }
  };

  const ToolbarButton = ({ icon: Icon, command, arg, label }: any) => (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); executeCommand(command, arg); }}
      className="p-1.5 rounded-md text-apple-gray hover:text-apple-blue hover:bg-blue-50 transition-colors"
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="relative group">
      {/* Toolbar - Appears on hover/focus */}
      <div className={`
        absolute -top-10 left-0 flex items-center gap-1 bg-white/90 backdrop-blur-md border border-gray-200 
        rounded-lg shadow-apple px-2 py-1 transition-all duration-200 z-20
        ${showToolbar ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-2 invisible group-hover:visible group-hover:opacity-100 group-hover:translate-y-0'}
      `}>
        <ToolbarButton icon={Bold} command="bold" label="Bold" />
        <ToolbarButton icon={Italic} command="italic" label="Italic" />
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarButton icon={Heading1} command="formatBlock" arg="H1" label="Heading 1" />
        <ToolbarButton icon={Heading2} command="formatBlock" arg="H2" label="Heading 2" />
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" />
        <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" />
        <ToolbarButton icon={Quote} command="formatBlock" arg="blockquote" label="Quote" />
        <div className="w-px h-4 bg-gray-200 mx-1" />
        <ToolbarButton icon={Minus} command="insertHorizontalRule" label="Divider" />
      </div>

      <div
        ref={contentRef}
        className="editor-content w-full bg-transparent text-lg text-apple-text dark:text-gray-100 leading-relaxed outline-none font-serif empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 dark:empty:before:text-zinc-600"
        contentEditable
        onInput={handleInput}
        onFocus={() => setShowToolbar(true)}
        onBlur={() => setTimeout(() => setShowToolbar(false), 200)} // Delay to allow button clicks
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
};

// Export as Memoized component to prevent parent re-renders from slowing down typing
export default React.memo(RichTextEditor);