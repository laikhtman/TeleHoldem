import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: {componentStack: string} | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state to render the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: {componentStack: string}) {
    // Log error to console with full context
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info in state
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));
    
    // Store error in localStorage for debugging
    try {
      const errorLog = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      
      // Keep only last 10 errors
      if (existingLogs.length > 10) {
        existingLogs.shift();
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.error('Failed to store error log:', storageError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = (): { title: string; description: string } => {
    const { error, errorCount } = this.state;
    
    if (errorCount > 3) {
      return {
        title: 'Multiple Errors Detected',
        description: 'The application is experiencing repeated errors. Please refresh the page or contact support if the issue persists.'
      };
    }
    
    if (!error) {
      return {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again.'
      };
    }

    // Check for specific error types
    if (error.message.includes('Network')) {
      return {
        title: 'Network Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.'
      };
    }
    
    if (error.message.includes('chunk') || error.message.includes('Loading')) {
      return {
        title: 'Loading Error',
        description: 'Failed to load application resources. This might be due to a poor connection.'
      };
    }
    
    if (error.message.includes('Permission') || error.message.includes('denied')) {
      return {
        title: 'Permission Denied',
        description: 'You do not have permission to access this resource. Please check your credentials.'
      };
    }
    
    // Generic error
    return {
      title: 'Application Error',
      description: 'An unexpected error occurred. Our team has been notified and is working to fix it.'
    };
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description } = this.getErrorMessage();
      const isDevelopment = import.meta.env.DEV;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl">{title}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="rounded-lg bg-muted/50 p-4 text-sm">
                <p className="text-muted-foreground">
                  Error Code: <span className="font-mono">ERR_{Date.now().toString(36).toUpperCase()}</span>
                </p>
                {isDevelopment && this.state.error && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                      <Bug className="inline h-4 w-4 mr-1" />
                      Technical Details
                    </summary>
                    <div className="mt-2 space-y-2">
                      <div className="p-2 bg-background rounded text-xs font-mono overflow-auto max-h-40">
                        {this.state.error.message}
                      </div>
                      {this.state.error.stack && (
                        <div className="p-2 bg-background rounded text-xs font-mono overflow-auto max-h-40">
                          {this.state.error.stack}
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex gap-2 flex-wrap">
              <Button 
                onClick={this.handleReset} 
                className="flex-1 min-w-[120px]"
                data-testid="button-error-retry"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleReload} 
                variant="secondary"
                className="flex-1 min-w-[120px]"
                data-testid="button-error-reload"
              >
                Reload Page
              </Button>
              <Button 
                onClick={this.handleHome} 
                variant="outline"
                className="flex-1 min-w-[120px]"
                data-testid="button-error-home"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}