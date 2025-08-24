import { createContextLogger } from "./loggerService";

export interface AppError {
  id: string;
  message: string;
  type: ErrorType;
  severity: ErrorSeverity;
  context?: string;
  timestamp: Date;
  stack?: string;
  metadata?: Record<string, unknown>;
  userFriendlyMessage?: string;
}

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  CLIENT_ERROR = 'client_error',
  UNKNOWN = 'unknown',
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ErrorHandler {
  canHandle(error: unknown): boolean;
  handle(error: unknown, context?: string): AppError;
}

class NetworkErrorHandler implements ErrorHandler {
  canHandle(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('Network Error') ||
      error.message.includes('Failed to fetch') ||
      (error as any)?.code === 'NETWORK_ERROR'
    );
  }

  handle(error: unknown, context?: string): AppError {
    const err = error as Error;
    return {
      id: crypto.randomUUID(),
      message: err.message,
      type: ErrorType.NETWORK,
      severity: ErrorSeverity.HIGH,
      context,
      timestamp: new Date(),
      stack: err.stack,
      userFriendlyMessage: 'Network connection failed. Please check your internet connection.',
    };
  }
}

class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: unknown): boolean {
    return error instanceof Error && (
      error.message.includes('validation') ||
      error.message.includes('invalid') ||
      (error as any)?.type === 'validation'
    );
  }

  handle(error: unknown, context?: string): AppError {
    const err = error as Error;
    return {
      id: crypto.randomUUID(),
      message: err.message,
      type: ErrorType.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
      context,
      timestamp: new Date(),
      stack: err.stack,
      userFriendlyMessage: 'Please check your input and try again.',
    };
  }
}

class ServerErrorHandler implements ErrorHandler {
  canHandle(error: unknown): boolean {
    const status = (error as any)?.status;
    return typeof status === 'number' && status >= 500 && status < 600;
  }

  handle(error: unknown, context?: string): AppError {
    const err = error as any;
    return {
      id: crypto.randomUUID(),
      message: err.message || 'Server error occurred',
      type: ErrorType.SERVER_ERROR,
      severity: ErrorSeverity.HIGH,
      context,
      timestamp: new Date(),
      stack: err.stack,
      metadata: { status: err.status },
      userFriendlyMessage: 'Server is temporarily unavailable. Please try again later.',
    };
  }
}

class GenericErrorHandler implements ErrorHandler {
  canHandle(): boolean {
    return true; // Always can handle as fallback
  }

  handle(error: unknown, context?: string): AppError {
    const err = error as Error;
    return {
      id: crypto.randomUUID(),
      message: err?.message || 'An unexpected error occurred',
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      context,
      timestamp: new Date(),
      stack: err?.stack,
      userFriendlyMessage: 'Something went wrong. Please try again.',
    };
  }
}

export interface ErrorReporter {
  report(error: AppError): void;
}

class ConsoleErrorReporter implements ErrorReporter {
  private logger = createContextLogger('ErrorReporter');

  report(error: AppError): void {
    const errorObj = new Error(error.message);
    errorObj.stack = error.stack;

    switch (error.severity) {
      case ErrorSeverity.LOW:
        this.logger.info(`[${error.type}] ${error.message}`, {
          id: error.id,
          context: error.context,
          metadata: error.metadata,
        });
        break;
      case ErrorSeverity.MEDIUM:
        this.logger.warn(`[${error.type}] ${error.message}`, errorObj, {
          id: error.id,
          context: error.context,
          metadata: error.metadata,
        });
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        this.logger.error(`[${error.type}] ${error.message}`, errorObj, {
          id: error.id,
          context: error.context,
          metadata: error.metadata,
        });
        break;
    }
  }
}

export class ErrorService {
  private handlers: ErrorHandler[] = [
    new NetworkErrorHandler(),
    new ValidationErrorHandler(),
    new ServerErrorHandler(),
    new GenericErrorHandler(), // Always last as fallback
  ];

  private reporters: ErrorReporter[] = [
    new ConsoleErrorReporter(),
  ];

  private errors: AppError[] = [];
  private readonly maxErrors = 100;

  handleError(error: unknown, context?: string): AppError {
    const handler = this.handlers.find(h => h.canHandle(error));
    const appError = handler!.handle(error, context);

    // Store error
    this.errors.push(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Report error
    this.reporters.forEach(reporter => reporter.report(appError));

    return appError;
  }

  addHandler(handler: ErrorHandler): void {
    // Insert before the generic handler (which should always be last)
    this.handlers.splice(this.handlers.length - 1, 0, handler);
  }

  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  getErrorsByType(type: ErrorType): AppError[] {
    return this.errors.filter(error => error.type === type);
  }

  getErrorsBySeverity(severity: ErrorSeverity): AppError[] {
    return this.errors.filter(error => error.severity === severity);
  }

  clearErrors(): void {
    this.errors = [];
  }

  createUserFriendlyMessage(error: AppError): string {
    return error.userFriendlyMessage || error.message;
  }
}

// Singleton instance
export const errorService = new ErrorService();

// Helper function for easy error handling
export const handleError = (error: unknown, context?: string): AppError => {
  return errorService.handleError(error, context);
};

// React hook for error handling
import { useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

export const useErrorHandler = () => {
  const { addToast } = useToast();

  const handleError = useCallback((error: unknown, context?: string, showToast: boolean = true) => {
    const appError = errorService.handleError(error, context);
    
    if (showToast) {
      const message = errorService.createUserFriendlyMessage(appError);
      const toastType = appError.severity === ErrorSeverity.CRITICAL ? 'error' : 'warning';
      addToast(message, toastType);
    }

    return appError;
  }, [addToast]);

  return { handleError };
};