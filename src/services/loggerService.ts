export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: Error;
}

export interface ILogger {
  debug(message: string, context?: string, data?: Record<string, unknown>): void;
  info(message: string, context?: string, data?: Record<string, unknown>): void;
  warn(message: string, error?: Error, data?: Record<string, unknown>): void;
  error(message: string, error?: Error, data?: Record<string, unknown>): void;
  setLogLevel(level: LogLevel): void;
}

class Logger implements ILogger {
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  constructor() {
    // Set log level based on environment
    if (import.meta.env.DEV) {
      // Use INFO level in dev to reduce spam, DEBUG for detailed debugging
      this.logLevel = LogLevel.INFO;
    }
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, data, error);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, undefined, data, error);
  }

  private log(
    level: LogLevel,
    message: string,
    context?: string,
    data?: Record<string, unknown>,
    error?: Error
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
      error,
    };

    // Add to internal log store
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    this.outputToConsole(entry);

    // In Electron, also send to main process for file logging
    this.sendToElectron(entry);
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const prefix = `${timestamp} ${context}`;

    const logData = entry.data ? [entry.data] : [];
    if (entry.error) {
      logData.push(entry.error);
    }

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, ...logData);
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, ...logData);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, ...logData);
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, ...logData);
        break;
    }
  }

  private sendToElectron(entry: LogEntry): void {
    // Send logs to Electron main process for file logging if available
    if (window.electronAPI?.sendLog) {
      try {
        window.electronAPI.sendLog(entry);
      } catch (error) {
        // Silently fail if electron logging is not available
      }
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return this.logs
      .map(entry => {
        const timestamp = entry.timestamp.toISOString();
        const level = LogLevel[entry.level];
        const context = entry.context ? `[${entry.context}]` : '';
        const data = entry.data ? ` Data: ${JSON.stringify(entry.data)}` : '';
        const error = entry.error ? ` Error: ${entry.error.stack || entry.error.message}` : '';
        
        return `${timestamp} [${level}] ${context} ${entry.message}${data}${error}`;
      })
      .join('\n');
  }
}

// Singleton instance
export const logger = new Logger();

// Helper functions for common logging patterns
export const createContextLogger = (context: string) => ({
  debug: (message: string, data?: Record<string, unknown>) => logger.debug(message, context, data),
  info: (message: string, data?: Record<string, unknown>) => logger.info(message, context, data),
  warn: (message: string, error?: Error, data?: Record<string, unknown>) => logger.warn(message, error, data),
  error: (message: string, error?: Error, data?: Record<string, unknown>) => logger.error(message, error, data),
});

export default logger;