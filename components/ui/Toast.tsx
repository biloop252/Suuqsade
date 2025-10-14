'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, X, ShoppingCart, AlertCircle } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'confirm';
  title: string;
  message?: string;
  duration?: number;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface ToastProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto remove after duration (but not for confirm toasts)
    if (toast.type !== 'confirm') {
      const autoRemoveTimer = setTimeout(() => {
        handleRemove();
      }, toast.duration || 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(autoRemoveTimer);
      };
    }

    return () => {
      clearTimeout(timer);
    };
  }, [toast.duration, toast.type]);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <ShoppingCart className="h-4 w-4 text-blue-600" />;
      case 'confirm':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-100 border-green-500';
      case 'error':
        return 'bg-red-100 border-red-500';
      case 'info':
        return 'bg-blue-100 border-blue-500';
      case 'confirm':
        return 'bg-orange-100 border-orange-500';
      default:
        return 'bg-green-100 border-green-500';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'info':
        return 'text-blue-900';
      case 'confirm':
        return 'text-orange-900';
      default:
        return 'text-green-900';
    }
  };

  return (
    <div
      className={`
        max-w-sm w-full bg-white rounded-lg shadow-xl border-l-4 transform transition-all duration-300 ease-in-out
        ${getBackgroundColor()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-3">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-sm font-medium ${getTextColor()} truncate`}>
              {toast.title}
            </p>
            {toast.message && (
              <p className={`mt-1 text-xs ${getTextColor()} opacity-90 line-clamp-2`}>
                {toast.message}
              </p>
            )}
          </div>
          {toast.type !== 'confirm' && (
            <div className="ml-2 flex-shrink-0">
              <button
                className={`inline-flex rounded-md p-1 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 ${getTextColor()}`}
                onClick={handleRemove}
              >
                <span className="sr-only">Close</span>
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
        
        {/* Confirmation buttons */}
        {toast.type === 'confirm' && (
          <div className="mt-3 flex justify-end space-x-2">
            <button
              onClick={() => {
                toast.onCancel?.();
                handleRemove();
              }}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-500"
            >
              {toast.cancelText || 'Cancel'}
            </button>
            <button
              onClick={() => {
                toast.onConfirm?.();
                handleRemove();
              }}
              className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
            >
              {toast.confirmText || 'Remove'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
          style={{ 
            transform: `translateY(${index * 8}px)`,
            zIndex: 9999 - index 
          }}
        >
          <ToastComponent toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
