import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error while loading this content. Please check your connection and try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-3xl bg-surface/60 border border-red-500/20 max-w-md mx-auto my-6 ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/5">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={onRetry}
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
};
