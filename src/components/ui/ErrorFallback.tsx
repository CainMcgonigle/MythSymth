import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  title?: string;
  description?: string;
  showError?: boolean;
}

const ErrorFallback = React.memo<ErrorFallbackProps>(({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showError = import.meta.env.DEV,
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-red-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        
        <p className="text-gray-400 mb-6">{description}</p>
        
        {showError && error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400">
              Show error details
            </summary>
            <pre className="mt-2 p-4 bg-gray-800 rounded text-xs text-red-400 overflow-auto max-h-40">
              {error.message}
              {error.stack && (
                <>
                  {'\n\nStack trace:\n'}
                  {error.stack}
                </>
              )}
            </pre>
          </details>
        )}
        
        {resetErrorBoundary && (
          <Button
            onClick={resetErrorBoundary}
            variant="primary"
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
});

ErrorFallback.displayName = 'ErrorFallback';

export default ErrorFallback;