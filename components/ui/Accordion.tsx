'use client';

import { useState, ReactNode } from 'react';
import { ChevronDownIcon } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

interface AccordionProps {
  children: ReactNode;
  className?: string;
  allowMultiple?: boolean;
}

export function AccordionItem({ title, children, defaultOpen = false, className = '' }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border-b border-gray-200 last:border-b-0 ${className}`}>
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between py-4 text-left hover:bg-gray-50 transition-colors duration-200 focus:outline-none"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        </div>
      </button>
      <div
        id={`accordion-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Accordion({ children, className = '', allowMultiple = true }: AccordionProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
}
