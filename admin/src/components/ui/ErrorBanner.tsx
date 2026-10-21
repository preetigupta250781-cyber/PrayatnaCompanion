import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorBannerProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  title = 'Failed to load data',
}) => {
  return (
    <div className="w-full p-6 border border-error/30 bg-error/10 rounded-xl flex flex-col items-center justify-center text-center space-y-3">
      <div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center text-error">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-md">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-2 text-error border-error/40 hover:bg-error/20"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          Retry Request
        </Button>
      )}
    </div>
  );
};
