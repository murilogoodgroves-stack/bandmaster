import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface FieldHintProps {
  content: React.ReactNode;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const FieldHint: React.FC<FieldHintProps> = ({
  content,
  title,
  position = 'top',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const close = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsOpen(false);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsOpen(prev => !prev);
  };

  // Close on outside click or ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  return (
    <span
      className={`relative inline-flex items-center align-middle ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={title ? `Help for ${title}` : 'Help information'}
        aria-expanded={isOpen}
        className="w-4 h-4 rounded-full border border-gray-500/70 text-gray-400 hover:text-white hover:border-brand-accent hover:bg-brand-accent/20 flex items-center justify-center text-[10px] font-bold leading-none cursor-pointer transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-brand-accent ml-1.5 flex-shrink-0"
      >
        ?
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          role="tooltip"
          className={`absolute ${getPositionClasses()} z-50 w-64 sm:w-72 p-3 bg-brand-bg-card border border-brand-border text-gray-200 text-xs rounded-xl shadow-2xl backdrop-blur-md pointer-events-auto animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent inline-block"></span>
              {title || 'Hint'}
            </span>
            <button
              type="button"
              onClick={close}
              className="text-gray-400 hover:text-white text-xs px-1 -mr-1 -mt-1 leading-none rounded"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="text-gray-300 leading-relaxed font-normal whitespace-normal">
            {content}
          </div>
        </div>
      )}
    </span>
  );
};
