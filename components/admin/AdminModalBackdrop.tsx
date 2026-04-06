'use client';

import type { ReactNode } from 'react';

type AdminModalBackdropProps = {
  children: ReactNode;
  /** Override inner flex row (padding, alignment). */
  innerClassName?: string;
  /** Fires when the user clicks the dimmed area outside the modal content. */
  onBackdropClick?: () => void;
};

/**
 * Scrollable admin modal overlay: generous bottom padding so the last actions
 * stay reachable when the page scrolls, instead of sitting under the viewport edge.
 */
export default function AdminModalBackdrop({
  children,
  innerClassName = 'flex min-h-full items-start justify-center p-4 pb-32 pt-10 sm:p-6 sm:pb-40 sm:pt-12',
  onBackdropClick,
}: AdminModalBackdropProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600/50">
      <div
        className={innerClassName}
        onClick={
          onBackdropClick
            ? (e) => {
                if (e.target === e.currentTarget) onBackdropClick();
              }
            : undefined
        }
        role={onBackdropClick ? 'presentation' : undefined}
      >
        {children}
      </div>
    </div>
  );
}

type AdminTallFormPanelProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Constrains tall form modals to the viewport; pair with a scrollable middle
 * and shrink-0 footer row for primary actions.
 */
export function AdminTallFormPanel({ children, className = '' }: AdminTallFormPanelProps) {
  return (
    <div
      className={`relative flex max-h-[min(92dvh,calc(100dvh-2rem))] w-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
