'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return <DefaultErrorFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-red-700">Произошла ошибка</CardTitle>
        </div>
        <CardDescription>
          Что-то пошло не так. Попробуйте обновить страницу или обратитесь к администратору.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-mono">
              {error.message}
            </p>
          </div>
        )}
        <div className="flex space-x-2">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
          <Button onClick={() => window.location.reload()} size="sm">
            Обновить страницу
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ErrorMessageProps {
  error: string | Error;
  className?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ error, className, onRetry }: ErrorMessageProps) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <div className={`flex items-center justify-center py-8 ${className || ''}`}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div className="text-center">
              <h3 className="text-lg font-semibold text-red-700">Ошибка</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {errorMessage}
              </p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Попробовать снова
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
