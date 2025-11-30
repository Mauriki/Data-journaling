import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import TypewriterPlaceholder from './TypewriterPlaceholder';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  animatedPlaceholder?: string[];
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder, minHeight = '120px', animatedPlaceholder }) => {
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
        const toolbarWidth = 200; // Approx width
        let leftPos = coords.left + (coords.width / 2) - (toolbarWidth / 2);

        // Clamp to viewport
        leftPos = Math.max(10, Math.min(window.innerWidth - toolbarWidth - 10, leftPos));

        setToolbarPosition({
          top: coords.top - 52,
          left: leftPos,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Allow Backspace to delete lists
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);

      // If at the start of a list item, allow un-listing (even if not empty)
      if (range.startOffset === 0) {
        const node = range.startContainer;
        const parent = node.parentElement;

        if (parent?.tagName === 'LI') {
          e.preventDefault();
          executeCommand('insertUnorderedList'); // Toggle off the list
          return;
        }
      }
    }

    if (e.key === ' ') {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const node = range.startContainer;

      // Get text before cursor in the current node
      const text = node.textContent || '';
      const offset = range.startOffset;
      const textBefore = text.slice(0, offset);

      // Markdown Patterns
      if (textBefore.endsWith('-') || textBefore.endsWith('*')) {
        // Bullet List
        if (/^[-*]$/.test(textBefore.trim())) {
          e.preventDefault();
          // Remove the trigger char
          const newText = text.slice(offset); // Text after cursor
          node.textContent = newText;
          executeCommand('insertUnorderedList');
        }
      } else if (textBefore.endsWith('1.')) {
        // Numbered List
        if (/^1\.$/.test(textBefore.trim())) {
          e.preventDefault();
          const newText = text.slice(offset);
          node.textContent = newText;
          executeCommand('insertOrderedList');
        }
      } else if (textBefore.endsWith('#')) {
        // Heading 1
        if (/^#$/.test(textBefore.trim())) {
          e.preventDefault();
          const newText = text.slice(offset);
          node.textContent = newText;
          executeCommand('formatBlock', 'H1');
        }
      } else if (textBefore.endsWith('##')) {
        // Heading 2
        if (/^##$/.test(textBefore.trim())) {
          e.preventDefault();
          const newText = text.slice(offset);
          node.textContent = newText;
          executeCommand('formatBlock', 'H2');
        }
      }
    }
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

      <style>{`
        .editor-content { line-height: 1.6; }
        .editor-content p { margin-bottom: 0.3em; }
        .editor-content ul, .editor-content ol { margin: 0.5em 0; padding-left: 1.5em; }
        .editor-content li { margin-bottom: 0.3em; padding-left: 0.2em; }
        .editor-content h1 { font-size: 1.3rem; font-weight: 700; margin-top: 0.5em; margin-bottom: 0.2em; line-height: 1.2; letter-spacing: -0.01em; }
        .editor-content h2 { font-size: 1.15rem; font-weight: 600; margin-top: 0.4em; margin-bottom: 0.2em; line-height: 1.2; }
        .editor-content:focus { outline: none; }
        .editor-content div { margin: 0; }
        .editor-content br + br { display: none; }
        
        /* 3D Layered Fire Animation */
        @keyframes flicker-layer-1 {
          0% { transform: scale(1) rotate(-2deg); opacity: 0.8; }
          25% { transform: scale(1.05) rotate(2deg); opacity: 1; }
          50% { transform: scale(0.95) rotate(-1deg); opacity: 0.9; }
          75% { transform: scale(1.1) rotate(1deg); opacity: 1; }
          100% { transform: scale(1) rotate(-2deg); opacity: 0.8; }
        }
        @keyframes flicker-layer-2 {
          0% { transform: translate(0, 0) scale(0.9); opacity: 0.7; }
          50% { transform: translate(1px, -2px) scale(1); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(0.9); opacity: 0.7; }
        }
        
        .animate-fire {
          position: relative;
          filter: drop-shadow(0 0 6px rgba(255, 80, 0, 0.6));
        }
        .animate-fire::before, .animate-fire::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 0 0;
          transform-origin: bottom center;
          pointer-events: none;
        }
        /* Core Flame (Orange) */
        .animate-fire {
          animation: flicker-layer-1 0.15s infinite alternate ease-in-out;
        }
        /* Inner Flame (Yellow/White) - Simulated with pseudo-element if SVG not used, 
           but since we apply this to an SVG icon, we rely on the filter and transform.
           To make it truly "3D", we add a pulsing glow behind it. */
        .animate-fire::before {
          background: radial-gradient(circle, rgba(255,200,0,0.4) 0%, transparent 70%);
          width: 140%;
          height: 140%;
          left: -20%;
          top: -20%;
          animation: flicker-layer-2 0.2s infinite alternate-reverse;
          z-index: -1;
        }
      `}</style>

      <div
        ref={contentRef}
        className="editor-content w-full bg-transparent text-[17px] text-apple-text dark:text-gray-100 leading-relaxed outline-none font-serif empty:before:content-[attr(data-placeholder)] empty:before:text-gray-300 dark:empty:before:text-zinc-600"
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
      {!value && animatedPlaceholder && (
        <TypewriterPlaceholder
          prompts={animatedPlaceholder}
          className="text-[17px] font-serif leading-relaxed text-apple-text dark:text-gray-100"
        />
      )}
    </div>
  );
};

// Export as Memoized component to prevent parent re-renders from slowing down typing
export default React.memo(RichTextEditor);