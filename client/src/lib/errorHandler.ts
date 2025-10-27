import { toast } from '@/hooks/use-toast';

// Error types for categorization
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error log entry
interface ErrorLogEntry {
  id: string;
  timestamp: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  code?: string;
  stack?: string;
  context?: Record<string, any>;
  userAgent: string;
  url: string;
  retryCount?: number;
}

// Error patterns for detection
const errorPatterns = {
  network: [
    /network/i,
    /fetch/i,
    /xhr/i,
    /connection/i,
    /offline/i,
    /timeout/i,
    /ERR_INTERNET_DISCONNECTED/,
    /ERR_NAME_NOT_RESOLVED/
  ],
  auth: [
    /unauthorized/i,
    /authentication/i,
    /401/,
    /403/,
    /forbidden/i,
    /token/i,
    /expired/i,
    /credentials/i
  ],
  validation: [
    /validation/i,
    /invalid/i,
    /required/i,
    /format/i,
    /constraint/i,
    /400/
  ],
  server: [
    /500/,
    /502/,
    /503/,
    /504/,
    /server/i,
    /internal/i,
    /database/i
  ]
};

class ErrorHandler {
  private errorLog: ErrorLogEntry[] = [];
  private errorFrequency: Map<string, number> = new Map();
  private maxLogSize = 50;
  private reportingEndpoint?: string;
  private isDevelopment = import.meta.env.DEV;
  
  constructor() {
    // Load existing error logs from localStorage
    this.loadErrorLogs();
    
    // Setup global error handlers
    this.setupGlobalHandlers();
    
    // Cleanup old logs periodically
    setInterval(() => this.cleanupOldLogs(), 60000); // Every minute
  }
  
  // Setup global error handlers
  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(event.reason, {
        type: 'unhandledRejection',
        promise: event.promise
      });
    });
    
    // Handle global errors
    window.addEventListener('error', (event) => {
      this.logError(event.error || new Error(event.message), {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
  }
  
  // Categorize error based on patterns
  private categorizeError(error: Error | any): ErrorCategory {
    const errorString = String(error?.message || error || '').toLowerCase();
    
    for (const [category, patterns] of Object.entries(errorPatterns)) {
      if (patterns.some(pattern => pattern.test(errorString))) {
        return category.toUpperCase() as ErrorCategory;
      }
    }
    
    // Check status code if available
    if (error?.status || error?.code) {
      const code = error.status || error.code;
      if (code === 401 || code === 403) return ErrorCategory.AUTH;
      if (code === 400) return ErrorCategory.VALIDATION;
      if (code >= 500) return ErrorCategory.SERVER;
    }
    
    return ErrorCategory.UNKNOWN;
  }
  
  // Determine error severity
  private determineErrorSeverity(error: Error | any, category: ErrorCategory): ErrorSeverity {
    // Critical errors
    if (category === ErrorCategory.AUTH || category === ErrorCategory.SERVER) {
      return ErrorSeverity.HIGH;
    }
    
    // Check for specific critical patterns
    if (error?.message?.includes('CRITICAL') || error?.message?.includes('FATAL')) {
      return ErrorSeverity.CRITICAL;
    }
    
    // Network errors are usually medium severity
    if (category === ErrorCategory.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }
    
    // Validation errors are low severity
    if (category === ErrorCategory.VALIDATION) {
      return ErrorSeverity.LOW;
    }
    
    return ErrorSeverity.MEDIUM;
  }
  
  // Log an error
  public logError(
    error: Error | any,
    context?: Record<string, any>,
    options?: {
      showToast?: boolean;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
    }
  ): string {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const category = options?.category || this.categorizeError(error);
    const severity = options?.severity || this.determineErrorSeverity(error, category);
    
    const logEntry: ErrorLogEntry = {
      id: errorId,
      timestamp: Date.now(),
      category,
      severity,
      message: error?.message || String(error),
      code: error?.code || error?.status?.toString(),
      stack: error?.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: context?.retryCount || 0
    };
    
    // Add to log
    this.errorLog.push(logEntry);
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }
    
    // Update frequency tracking
    const errorKey = `${category}_${error?.message}`;
    this.errorFrequency.set(errorKey, (this.errorFrequency.get(errorKey) || 0) + 1);
    
    // Log to console in development
    if (this.isDevelopment) {
      console.group(`🚨 Error [${severity}] [${category}]`);
      console.error('Message:', error?.message);
      console.error('Error:', error);
      console.error('Context:', context);
      console.error('Log Entry:', logEntry);
      console.groupEnd();
    } else {
      console.error(`Error [${errorId}]:`, error?.message);
    }
    
    // Save to localStorage
    this.saveErrorLogs();
    
    // Report to server if configured
    if (this.reportingEndpoint && severity >= ErrorSeverity.HIGH) {
      this.reportError(logEntry);
    }
    
    // Show toast notification if requested
    if (options?.showToast !== false && severity >= ErrorSeverity.MEDIUM) {
      this.showErrorToast(error, category, errorId);
    }
    
    return errorId;
  }
  
  // Show error toast
  private showErrorToast(error: Error | any, category: ErrorCategory, errorId: string) {
    let title = 'Error';
    let description = error?.message || 'An unexpected error occurred';
    
    // Customize toast based on category
    switch (category) {
      case ErrorCategory.NETWORK:
        title = 'Connection Error';
        description = 'Please check your internet connection';
        break;
      case ErrorCategory.AUTH:
        title = 'Authentication Error';
        description = 'Please sign in again';
        break;
      case ErrorCategory.SERVER:
        title = 'Server Error';
        description = 'Something went wrong on our end';
        break;
      case ErrorCategory.VALIDATION:
        title = 'Validation Error';
        description = 'Please check your input';
        break;
    }
    
    toast({
      variant: 'destructive',
      title,
      description: `${description} (${errorId})`,
      duration: 5000,
    });
  }
  
  // Report error to server
  private async reportError(logEntry: ErrorLogEntry) {
    if (!this.reportingEndpoint) return;
    
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }
  
  // Get error logs
  public getErrorLogs(): ErrorLogEntry[] {
    return [...this.errorLog];
  }
  
  // Get error frequency
  public getErrorFrequency(): Map<string, number> {
    return new Map(this.errorFrequency);
  }
  
  // Get errors by category
  public getErrorsByCategory(category: ErrorCategory): ErrorLogEntry[] {
    return this.errorLog.filter(log => log.category === category);
  }
  
  // Get recent errors
  public getRecentErrors(minutes: number = 5): ErrorLogEntry[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.errorLog.filter(log => log.timestamp > cutoff);
  }
  
  // Clear error logs
  public clearErrorLogs() {
    this.errorLog = [];
    this.errorFrequency.clear();
    this.saveErrorLogs();
  }
  
  // Save error logs to localStorage
  private saveErrorLogs() {
    try {
      localStorage.setItem('errorHandler_logs', JSON.stringify(this.errorLog));
      localStorage.setItem('errorHandler_frequency', JSON.stringify(Array.from(this.errorFrequency.entries())));
    } catch (error) {
      console.error('Failed to save error logs:', error);
    }
  }
  
  // Load error logs from localStorage
  private loadErrorLogs() {
    try {
      const logs = localStorage.getItem('errorHandler_logs');
      const frequency = localStorage.getItem('errorHandler_frequency');
      
      if (logs) {
        this.errorLog = JSON.parse(logs);
      }
      
      if (frequency) {
        this.errorFrequency = new Map(JSON.parse(frequency));
      }
    } catch (error) {
      console.error('Failed to load error logs:', error);
    }
  }
  
  // Cleanup old logs
  private cleanupOldLogs() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.errorLog = this.errorLog.filter(log => log.timestamp > oneHourAgo);
    
    // Cleanup frequency map
    for (const [key, _] of this.errorFrequency) {
      const lastError = this.errorLog.find(log => 
        `${log.category}_${log.message}` === key
      );
      if (!lastError) {
        this.errorFrequency.delete(key);
      }
    }
    
    this.saveErrorLogs();
  }
  
  // Set reporting endpoint
  public setReportingEndpoint(endpoint: string) {
    this.reportingEndpoint = endpoint;
  }
  
  // Check if we have repeated errors
  public hasRepeatedErrors(threshold: number = 5): boolean {
    for (const count of this.errorFrequency.values()) {
      if (count >= threshold) return true;
    }
    return false;
  }
  
  // Get error summary
  public getErrorSummary(): {
    total: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recentCount: number;
  } {
    const summary = {
      total: this.errorLog.length,
      byCategory: {} as Record<ErrorCategory, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      recentCount: this.getRecentErrors(5).length,
    };
    
    for (const log of this.errorLog) {
      summary.byCategory[log.category] = (summary.byCategory[log.category] || 0) + 1;
      summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;
    }
    
    return summary;
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export convenience functions
export const logError = errorHandler.logError.bind(errorHandler);
export const getErrorLogs = errorHandler.getErrorLogs.bind(errorHandler);
export const clearErrorLogs = errorHandler.clearErrorLogs.bind(errorHandler);
export const getErrorSummary = errorHandler.getErrorSummary.bind(errorHandler);