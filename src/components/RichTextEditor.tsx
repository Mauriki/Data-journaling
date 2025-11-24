import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = '120px' }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });

  // Sync initial value
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value) {
      if (value === '' && contentRef.current.innerHTML === '<br>') return;
      contentRef.current.innerHTML = value;
    }
  }, [value]);

  const getCaretCoordinates = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  };

  const handleInput = () => {
    if (contentRef.current) {
      const text = contentRef.current.textContent || '';

      // Check for slash command
      if (text.endsWith('/')) {
        const coords = getCaretCoordinates();
        if (coords) {
          setToolbarPosition({
            top: coords.top - 52, // Toolbar height (44px) + padding (8px)
            left: coords.left, // At cursor position
          });
          setShowToolbar(true);
        }
      } else if (!text.includes('/')) {
        // Hide toolbar if slash is removed and no selection
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
          setShowToolbar(false);
        }
      }

      onChange(contentRef.current.innerHTML);
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0 && contentRef.current?.contains(selection.anchorNode)) {
      const coords = getCaretCoordinates();
      if (coords) {
        // Position toolbar ABOVE selection: selectionTop - toolbarHeight - padding
        setToolbarPosition({
          top: coords.top - 52, // Toolbar height (44px) + padding (8px) = 52px above
          left: coords.left + (coords.width / 2) - 100, // Center it
        });
        setShowToolbar(true);
      }
    } else {
      // Don't hide if slash command is present
      const text = contentRef.current?.textContent || '';
      if (!text.includes('/')) {
        setShowToolbar(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);

    if (contentRef.current) {
      // Remove slash if it exists
      const content = contentRef.current.innerHTML;
      contentRef.current.innerHTML = content.replace(/\/$/g, '');

      onChange(contentRef.current.innerHTML);

      // Focus without scrolling (KEY FIX)
      contentRef.current.focus({ preventScroll: true });
    }

    setShowToolbar(false);
  };

  const ToolbarButton = ({ icon: Icon, command, arg, label }: any) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        executeCommand(command, arg);
      }}
      className="p-1.5 rounded-md text-gray-600 dark:text-gray-300 hover:text-apple-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="relative">
      {/* Floating Toolbar - Appears on text selection or slash command (Notion-style) */}
      {showToolbar && (
        <div
          className="fixed flex items-center gap-1 bg-white dark:bg-zinc-800 backdrop-blur-md border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg px-2 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
            willChange: 'transform'
          }}
        >
          <ToolbarButton icon={Bold} command="bold" label="Bold (⌘B)" />
          <ToolbarButton icon={Italic} command="italic" label="Italic (⌘I)" />
          <div className="w-px h-4 bg-gray-200 dark:bg-zinc-600 mx-1" />
          <ToolbarButton icon={Heading1} command="formatBlock" arg="H1" label="Heading 1" />
          <ToolbarButton icon={Heading2} command="formatBlock" arg="H2" label="Heading 2" />
          <div className="w-px h-4 bg-gray-200 dark:bg-zinc-600 mx-1" />
          <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" />
        </div>
      )}

      <div
        ref={contentRef}
        className="editor-content w-full bg-transparent text-lg text-apple-text dark:text-gray-100 leading-relaxed outline-none font-serif empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 dark:empty:before:text-zinc-600"
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
    </div>
  );
};

// Export as Memoized component to prevent parent re-renders from slowing down typing
export default React.memo(RichTextEditor);