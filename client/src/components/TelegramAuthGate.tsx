import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface TelegramAuthGateProps {
  children: React.ReactNode;
}

/**
 * Authentication gate for Telegram Mini App
 * - Shows loading state while authenticating in Telegram
 * - Shows error if authentication fails
 * - Renders children when authenticated OR in standalone mode
 * - Standalone mode (not in Telegram) allows playing without auth
 */
export function TelegramAuthGate({ children }: TelegramAuthGateProps) {
  const { isInTelegram, isAuthenticated, isLoading, error, isStandalone } = useTelegramAuth();

  // Show loading state while authenticating in Telegram
  if (isInTelegram && isLoading) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen bg-background"
        data-testid="auth-loading"
      >
        <LoadingSpinner className="w-12 h-12 mb-4 text-poker-chipGold" />
        <p className="text-lg font-semibold text-foreground">Authenticating...</p>
        <p className="text-sm text-muted-foreground mt-2">Verifying your Telegram account</p>
      </div>
    );
  }

  // Show error state if authentication failed in Telegram
  if (isInTelegram && !isAuthenticated && error) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen bg-background p-4"
        data-testid="auth-error"
      >
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Authentication Failed</CardTitle>
            </div>
            <CardDescription>
              We couldn't verify your Telegram account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Please try again or contact support if the problem persists.'}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
              data-testid="button-retry-auth"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render children when:
  // 1. Authenticated in Telegram, OR
  // 2. Running in standalone mode (not in Telegram)
  if (isAuthenticated || isStandalone) {
    return <>{children}</>;
  }

  // Fallback - should not reach here, but show loading just in case
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-background"
      data-testid="auth-fallback"
    >
      <LoadingSpinner className="w-12 h-12 text-poker-chipGold" />
    </div>
  );
}
