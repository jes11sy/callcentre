'use client';

import { toast } from 'sonner';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { playNotificationSound, playMessageSound, playErrorSound } from '@/lib/sound';

export interface NotificationOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  success(message: string, options?: NotificationOptions) {
    playNotificationSound();
    toast.success(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
    });
  }

  error(message: string, options?: NotificationOptions) {
    playErrorSound();
    toast.error(message, {
      description: options?.description,
      duration: options?.duration || 6000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
    });
  }

  warning(message: string, options?: NotificationOptions) {
    playNotificationSound();
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration || 5000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
    });
  }

  info(message: string, options?: NotificationOptions) {
    playMessageSound();
    toast.info(message, {
      description: options?.description,
      duration: options?.duration || 4000,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
    });
  }

  loading(message: string) {
    return toast.loading(message);
  }

  dismiss(id: string) {
    toast.dismiss(id);
  }

  promise<T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  }
}

export const notifications = new NotificationService();

// Хук для удобного использования уведомлений
export function useNotifications() {
  return {
    success: notifications.success,
    error: notifications.error,
    warning: notifications.warning,
    info: notifications.info,
    loading: notifications.loading,
    dismiss: notifications.dismiss,
    promise: notifications.promise,
  };
}

// Компонент для отображения статуса операций
interface OperationStatusProps {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  loadingMessage: string;
  successMessage: string;
  errorMessage: string;
  onRetry?: () => void;
}

export function OperationStatus({
  isLoading,
  isSuccess,
  isError,
  loadingMessage,
  successMessage,
  errorMessage,
  onRetry
}: OperationStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-blue-600">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm">{loadingMessage}</span>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">{successMessage}</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{errorMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs underline hover:no-underline"
          >
            Повторить
          </button>
        )}
      </div>
    );
  }

  return null;
}
