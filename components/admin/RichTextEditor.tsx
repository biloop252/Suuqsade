'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Unlink, 
  Type, 
  Quote, 
  Image as ImageIcon, 
  Undo, 
  Redo, 
  Eraser, 
  Code,
  Minus
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeightPx?: number;
}

export interface RichTextEditorHandle {
  getPendingImages: () => { id: string; file: File }[];
  replacePendingImage: (id: string, url: string) => void;
  getHtml: () => string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor(
  { value, onChange, placeholder = 'Start writing...', className = '', minHeightPx = 240 },
  ref
) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceHtml, setSourceHtml] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingImages, setPendingImages] = useState<{ id: string; file: File; objectUrl: string }[]>([]);

  useEffect(() => {
    if (!editorRef.current) return;
    // Only set when not focused to avoid clobbering user typing
    if (!isFocused && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, isFocused]);

  const exec = (command: string, valueArg?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(command, false, valueArg);
    // Emit updated HTML
    onChange(editorRef.current.innerHTML);
  };

  const handleCreateLink = () => {
    const url = window.prompt('Enter URL');
    if (!url) return;
    exec('createLink', url);
  };

  const handleInsertImage = () => {
    const url = window.prompt('Enter image URL');
    if (!url) return;
    exec('insertImage', url);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const setHtml = (html: string) => {
    if (!editorRef.current) return;
    editorRef.current.innerHTML = html;
    onChange(editorRef.current.innerHTML);
  };

  useImperativeHandle(ref, () => ({
    getPendingImages: () => pendingImages.map(({ id, file }) => ({ id, file })),
    replacePendingImage: (id: string, url: string) => {
      if (!editorRef.current) return;
      const img = editorRef.current.querySelector(`img[data-pending-id="${id}"]`) as HTMLImageElement | null;
      if (img) {
        img.src = url;
        img.removeAttribute('data-pending-id');
        // remove from state and revoke object URL
        setPendingImages(prev => {
          const item = prev.find(p => p.id === id);
          if (item) URL.revokeObjectURL(item.objectUrl);
          return prev.filter(p => p.id !== id);
        });
        onChange(editorRef.current.innerHTML);
      }
    },
    getHtml: () => editorRef.current?.innerHTML || ''
  }), [pendingImages, onChange]);

  const toolbarButton = (
    { title, onClick, children, disabled = false }: { title: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }
  ) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded text-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-1 border border-gray-200 rounded-t-md px-2 py-1 bg-gray-50">
        {toolbarButton({ title: 'Paragraph', onClick: () => exec('formatBlock', 'p'), children: <Type className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Heading 1', onClick: () => exec('formatBlock', 'h1'), children: <span className="text-xs font-semibold">H1</span> })}
        {toolbarButton({ title: 'Heading 2', onClick: () => exec('formatBlock', 'h2'), children: <span className="text-xs font-semibold">H2</span> })}
        {toolbarButton({ title: 'Heading 3', onClick: () => exec('formatBlock', 'h3'), children: <span className="text-xs font-semibold">H3</span> })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: 'Bold', onClick: () => exec('bold'), children: <Bold className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Italic', onClick: () => exec('italic'), children: <Italic className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Underline', onClick: () => exec('underline'), children: <Underline className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Strikethrough', onClick: () => exec('strikeThrough'), children: <Strikethrough className="h-4 w-4" /> })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: 'Bulleted List', onClick: () => exec('insertUnorderedList'), children: <List className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Numbered List', onClick: () => exec('insertOrderedList'), children: <ListOrdered className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Blockquote', onClick: () => exec('formatBlock', 'blockquote'), children: <Quote className="h-4 w-4" /> })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: 'Insert Link', onClick: handleCreateLink, children: <LinkIcon className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Remove Link', onClick: () => exec('unlink'), children: <Unlink className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Insert Image URL', onClick: handleInsertImage, children: <ImageIcon className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Add Image (upload on save)', onClick: () => fileInputRef.current?.click(), children: <ImageIcon className="h-4 w-4" />, disabled: uploading })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: 'Align Left', onClick: () => exec('justifyLeft'), children: <AlignLeft className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Align Center', onClick: () => exec('justifyCenter'), children: <AlignCenter className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Align Right', onClick: () => exec('justifyRight'), children: <AlignRight className="h-4 w-4" /> })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: 'Horizontal Rule', onClick: () => exec('insertHorizontalRule'), children: <Minus className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Clear Formatting', onClick: () => exec('removeFormat'), children: <Eraser className="h-4 w-4" /> })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: 'Undo', onClick: () => exec('undo'), children: <Undo className="h-4 w-4" /> })}
        {toolbarButton({ title: 'Redo', onClick: () => exec('redo'), children: <Redo className="h-4 w-4" /> })}
        <span className="mx-1 h-5 w-px bg-gray-200" />
        {toolbarButton({ title: isSourceMode ? 'WYSIWYG' : 'HTML', onClick: () => {
          if (!isSourceMode) {
            setSourceHtml(editorRef.current?.innerHTML || '');
            setIsSourceMode(true);
          } else {
            setIsSourceMode(false);
            setHtml(sourceHtml);
          }
        }, children: <Code className="h-4 w-4" /> })}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file || !editorRef.current) return;
          const id = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
          const objectUrl = URL.createObjectURL(file);
          setPendingImages(prev => [...prev, { id, file, objectUrl }]);
          // Insert placeholder image element with pending id
          // eslint-disable-next-line deprecation/deprecation
          document.execCommand('insertHTML', false, `<img src="${objectUrl}" data-pending-id="${id}" />`);
          onChange(editorRef.current.innerHTML);
          if (e.target) e.target.value = '';
        }}
      />
      {isSourceMode ? (
        <textarea
          value={sourceHtml}
          onChange={(e) => setSourceHtml(e.target.value)}
          className="border border-gray-200 border-t-0 rounded-b-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 w-full font-mono text-sm"
          style={{ minHeight: `${minHeightPx}px` }}
          placeholder="Edit HTML source"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="border border-gray-200 border-t-0 rounded-b-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[1px]"
          style={{ minHeight: `${minHeightPx}px` }}
          data-placeholder={placeholder}
          suppressContentEditableWarning
        />
      )}
      <style jsx>{`
        [contenteditable="true"][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF; /* text-gray-400 */
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

);

export default RichTextEditor;



