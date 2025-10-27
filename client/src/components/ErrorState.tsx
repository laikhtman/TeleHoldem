import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertTriangle, 
  WifiOff, 
  ServerCrash, 
  FileX, 
  Lock, 
  RefreshCw, 
  Home,
  ArrowLeft,
  XCircle,
  AlertCircle
} from 'lucide-react';

export type ErrorType = 
  | 'network' 
  | 'server' 
  | 'not-found' 
  | 'unauthorized' 
  | 'forbidden'
  | 'timeout'
  | 'generic';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message?: string;
  error?: Error | unknown;
  onRetry?: () => void;
  onGoBack?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

const errorConfigs: Record<ErrorType, {
  icon: typeof AlertTriangle;
  title: string;
  message: string;
  color: string;
}> = {
  network: {
    icon: WifiOff,
    title: 'Connection Lost',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    color: 'text-orange-500'
  },
  server: {
    icon: ServerCrash,
    title: 'Server Error',
    message: 'Our servers are experiencing issues. Please try again in a few moments.',
    color: 'text-red-500'
  },
  'not-found': {
    icon: FileX,
    title: 'Not Found',
    message: 'The requested resource could not be found. It may have been moved or deleted.',
    color: 'text-yellow-500'
  },
  unauthorized: {
    icon: Lock,
    title: 'Authentication Required',
    message: 'Please sign in to access this content.',
    color: 'text-blue-500'
  },
  forbidden: {
    icon: Lock,
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    color: 'text-red-500'
  },
  timeout: {
    icon: AlertCircle,
    title: 'Request Timeout',
    message: 'The request took too long to complete. Please check your connection and try again.',
    color: 'text-orange-500'
  },
  generic: {
    icon: AlertTriangle,
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    color: 'text-yellow-500'
  }
};

export function ErrorState({
  type = 'generic',
  title,
  message,
  error,
  onRetry,
  onGoBack,
  onGoHome,
  showDetails = false,
  compact = false,
  className = ''
}: ErrorStateProps) {
  const config = errorConfigs[type];
  const Icon = config.icon;
  const displayTitle = title || config.title;
  const displayMessage = message || config.message;
  
  // Extract error details
  const errorDetails = error instanceof Error ? error.message : 
                       error && typeof error === 'object' && 'message' in error ? 
                       (error as any).message : null;
  
  const errorCode = `ERR_${type.toUpperCase()}_${Date.now().toString(36).toUpperCase()}`;
  
  // Compact version for inline errors
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 ${className}`}>
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{displayTitle}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{displayMessage}</p>
        </div>
        {onRetry && (
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={onRetry}
            className="flex-shrink-0"
            data-testid="button-error-retry-compact"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
  
  // Full card version
  return (
    <Card className={`max-w-lg mx-auto ${className}`}>
      <CardHeader className="text-center">
        <div className={`mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center`}>
          <Icon className={`h-8 w-8 ${config.color}`} />
        </div>
        <CardTitle className="text-xl">{displayTitle}</CardTitle>
        <CardDescription className="mt-2">
          {displayMessage}
        </CardDescription>
      </CardHeader>
      
      {(showDetails || errorDetails) && (
        <CardContent>
          <div className="rounded-lg bg-muted/50 p-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Error Code: <span className="font-mono">{errorCode}</span>
            </p>
            {errorDetails && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Technical Details
                </summary>
                <pre className="mt-2 p-2 bg-background rounded overflow-auto max-h-32 text-xs">
                  {errorDetails}
                </pre>
              </details>
            )}
          </div>
        </CardContent>
      )}
      
      <CardFooter className="flex gap-2 flex-wrap">
        {onRetry && (
          <Button 
            onClick={onRetry} 
            className="flex-1 min-w-[100px]"
            data-testid="button-error-retry"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        )}
        {onGoBack && (
          <Button 
            onClick={onGoBack} 
            variant="secondary"
            className="flex-1 min-w-[100px]"
            data-testid="button-error-go-back"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        )}
        {onGoHome && (
          <Button 
            onClick={onGoHome} 
            variant="outline"
            className="flex-1 min-w-[100px]"
            data-testid="button-error-go-home"
          >
            <Home className="h-4 w-4 mr-2" />
            Home
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Specialized error components for common scenarios
export function NetworkError({ onRetry, ...props }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="network" onRetry={onRetry} {...props} />;
}

export function ServerError({ onRetry, ...props }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="server" onRetry={onRetry} {...props} />;
}

export function NotFoundError({ onGoHome, ...props }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="not-found" onGoHome={onGoHome} {...props} />;
}

export function UnauthorizedError({ ...props }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="unauthorized" {...props} />;
}

export function TimeoutError({ onRetry, ...props }: Omit<ErrorStateProps, 'type'>) {
  return <ErrorState type="timeout" onRetry={onRetry} {...props} />;
}