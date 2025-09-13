/**
 * hooks/useInventoryToast.ts
 * Hook for managing inventory toast notifications
 */

import { useState, useCallback } from 'react';
import { Item } from '../types';

export interface ToastData {
  item: Item;
  action: 'collected' | 'stolen' | 'found' | 'looted';
  id: string;
}

export function useInventoryToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((item: Item, action: ToastData['action'] = 'collected') => {
    const newToast: ToastData = {
      item,
      action,
      id: `${Date.now()}-${Math.random()}`
    };

    setToasts(current => [...current, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    clearAllToasts
  };
}