'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Bold, Italic, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  disabled
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Check formatting state
  const updateFormattingState = () => {
    if (editorRef.current) {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
    }
  };

  // Handle keyboard shortcuts and selection changes
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b' || e.key === 'B') {
        e.preventDefault();
        toggleBold();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        toggleItalic();
      }
    }
  };

  const handleSelectionChange = () => {
    updateFormattingState();
  };

  useEffect(() => {
    const handleSelection = () => {
      if (document.activeElement === editorRef.current) {
        updateFormattingState();
      }
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      updateFormattingState();
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const toggleBold = () => {
    execCommand('bold');
    setIsBold(!isBold);
  };
  
  const toggleItalic = () => {
    execCommand('italic');
    setIsItalic(!isItalic);
  };
  
  const removeFormatting = () => {
    execCommand('removeFormat');
    setIsBold(false);
    setIsItalic(false);
  };
  
  const setFontSize = (size: string) => execCommand('fontSize', size);

  return (
    <div className={cn('relative', className)}>
      {/* Toolbar */}
      <div className={cn(
        "flex items-center gap-1 p-2 border border-border bg-muted/50 rounded-t-md",
        isFocused && "border-primary"
      )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isBold ? "default" : "ghost"}
              size="sm"
              onClick={toggleBold}
              disabled={disabled}
              className={cn(
                "h-8 w-8 p-0",
                isBold && "bg-primary text-primary-foreground"
              )}
            >
              <Bold size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bold (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={isItalic ? "default" : "ghost"}
              size="sm"
              onClick={toggleItalic}
              disabled={disabled}
              className={cn(
                "h-8 w-8 p-0",
                isItalic && "bg-primary text-primary-foreground"
              )}
            >
              <Italic size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italic (Ctrl+I)</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removeFormatting}
              disabled={disabled}
              className="h-8 w-8 p-0"
            >
              <Type size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove formatting</p>
          </TooltipContent>
        </Tooltip>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Select onValueChange={setFontSize} disabled={disabled}>
              <SelectTrigger className="h-8 w-18 text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">10px</SelectItem>
                <SelectItem value="2">12px</SelectItem>
                <SelectItem value="3">14px</SelectItem>
                <SelectItem value="4">16px</SelectItem>
                <SelectItem value="5">18px</SelectItem>
                <SelectItem value="6">20px</SelectItem>
                <SelectItem value="7">24px</SelectItem>
              </SelectContent>
            </Select>
          </TooltipTrigger>
          <TooltipContent>
            <p>Font size</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onMouseUp={handleSelectionChange}
        onKeyUp={handleSelectionChange}
        onFocus={() => {
          setIsFocused(true);
          updateFormattingState();
        }}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'min-h-[72px] px-3 py-2 border border-t-0 border-border text-base md:text-sm rounded-b-md',
          'focus:outline-none focus:border-primary focus:rounded-t-none',
          'bg-background text-foreground',
          isFocused && 'border-primary',
          disabled && 'opacity-50 cursor-not-allowed bg-muted'
        )}
        style={{
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
        data-placeholder={placeholder}
      />

      {/* Placeholder styling */}
      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
          pointer-events: none;
        }
        [contenteditable] font[size="1"] { font-size: 10px !important; }
        [contenteditable] font[size="2"] { font-size: 12px !important; }
        [contenteditable] font[size="3"] { font-size: 14px !important; }
        [contenteditable] font[size="4"] { font-size: 16px !important; }
        [contenteditable] font[size="5"] { font-size: 18px !important; }
        [contenteditable] font[size="6"] { font-size: 20px !important; }
        [contenteditable] font[size="7"] { font-size: 24px !important; }
      `}</style>
    </div>
  );
}

export function RichTextDisplay({ content, className }: { content: string; className?: string }) {
  return (
    <>
      <div
        className={cn('prose prose-sm max-w-none', className)}
        dangerouslySetInnerHTML={{ __html: content }}
      />
      <style jsx>{`
        div font[size="1"] { font-size: 10px !important; }
        div font[size="2"] { font-size: 12px !important; }
        div font[size="3"] { font-size: 14px !important; }
        div font[size="4"] { font-size: 16px !important; }
        div font[size="5"] { font-size: 18px !important; }
        div font[size="6"] { font-size: 20px !important; }
        div font[size="7"] { font-size: 24px !important; }
      `}</style>
    </>
  );
}
