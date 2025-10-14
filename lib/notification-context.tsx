'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastContainer } from '@/components/ui/Toast';

interface NotificationContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 4000,
    };
    
    setToasts(prev => [...prev, newToast]);
  };

  const showSuccess = (title: string, message?: string) => {
    showToast({
      type: 'success',
      title,
      message,
      duration: 3000,
    });
  };

  const showError = (title: string, message?: string) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: 5000,
    });
  };

  const showInfo = (title: string, message?: string) => {
    showToast({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    showToast({
      type: 'confirm',
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: 'Remove',
      cancelText: 'Cancel',
    });
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showInfo,
        showConfirm,
        removeToast,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
