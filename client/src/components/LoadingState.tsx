import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Spade, Heart, Diamond, Club } from 'lucide-react';
import { cn } from '@/lib/utils';

// Rotating loading messages for longer operations
const loadingMessages = [
  "Setting up the table...",
  "Shuffling the deck...",
  "Dealing cards...",
  "Preparing your seat...",
  "Almost ready...",
  "Just a moment more..."
];

interface LoadingStateProps {
  type?: 'spinner' | 'skeleton' | 'progress' | 'poker';
  message?: string;
  progress?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showMessage?: boolean;
  variant?: 'default' | 'card' | 'inline';
}

export function LoadingState({
  type = 'spinner',
  message,
  progress,
  className = '',
  size = 'md',
  showMessage = true,
  variant = 'default'
}: LoadingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dots, setDots] = useState('');
  
  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);
  
  // Rotate loading messages for long operations
  useEffect(() => {
    if (type === 'progress' && !message) {
      const interval = setInterval(() => {
        setMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [type, message]);
  
  const displayMessage = message || (type === 'progress' ? loadingMessages[messageIndex] : 'Loading' + dots);
  
  const sizeClasses = {
    sm: { spinner: 'h-4 w-4', text: 'text-sm', container: 'p-2' },
    md: { spinner: 'h-6 w-6', text: 'text-base', container: 'p-4' },
    lg: { spinner: 'h-8 w-8', text: 'text-lg', container: 'p-6' }
  };
  
  const sizes = sizeClasses[size];
  
  // Inline variant for small loading indicators
  if (variant === 'inline') {
    return (
      <span className={cn('inline-flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', sizes.spinner)} />
        {showMessage && <span className={sizes.text}>{displayMessage}</span>}
      </span>
    );
  }
  
  // Card variant for loading inside card components
  if (variant === 'card') {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className={cn('flex flex-col items-center justify-center', sizes.container)}>
          {renderLoadingContent()}
        </CardContent>
      </Card>
    );
  }
  
  // Default centered loading state
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', sizes.container, className)}>
      {renderLoadingContent()}
    </div>
  );
  
  function renderLoadingContent() {
    switch (type) {
      case 'spinner':
        return (
          <>
            <Loader2 className={cn('animate-spin text-primary', sizes.spinner)} />
            {showMessage && <p className={cn('text-muted-foreground', sizes.text)}>{displayMessage}</p>}
          </>
        );
        
      case 'skeleton':
        return <SkeletonLoader size={size} />;
        
      case 'progress':
        return (
          <>
            <div className="w-full max-w-xs space-y-2">
              <Progress value={progress || 0} className="h-2" />
              {showMessage && (
                <p className={cn('text-center text-muted-foreground', sizes.text)}>
                  {displayMessage}
                  {progress !== undefined && ` (${Math.round(progress)}%)`}
                </p>
              )}
            </div>
          </>
        );
        
      case 'poker':
        return <PokerLoader showMessage={showMessage} message={displayMessage} size={size} />;
        
      default:
        return null;
    }
  }
}

// Skeleton loader for content
function SkeletonLoader({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const heightClasses = {
    sm: 'h-32',
    md: 'h-48',
    lg: 'h-64'
  };
  
  return (
    <div className="w-full space-y-3">
      <Skeleton className={cn('w-full', heightClasses[size])} />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

// Animated poker-themed loader
function PokerLoader({ 
  showMessage, 
  message, 
  size 
}: { 
  showMessage?: boolean; 
  message?: string; 
  size: 'sm' | 'md' | 'lg';
}) {
  const [suitIndex, setSuitIndex] = useState(0);
  const suits = [Spade, Heart, Diamond, Club];
  const colors = ['text-black', 'text-red-500', 'text-red-500', 'text-black'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setSuitIndex(prev => (prev + 1) % suits.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);
  
  const Icon = suits[suitIndex];
  const color = colors[suitIndex];
  
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };
  
  return (
    <>
      <div className="relative">
        <Icon className={cn('animate-pulse', color, sizeClasses[size])} />
      </div>
      {showMessage && (
        <p className="text-muted-foreground">
          {message}
        </p>
      )}
    </>
  );
}

// Table skeleton for loading tables in lobby
export function TableSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Player seat skeleton for loading game
export function PlayerSeatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-background/80 backdrop-blur border border-border">
      <Skeleton className="h-10 w-10 rounded-full" />
      <Skeleton className="h-4 w-20" />
      <div className="flex gap-1">
        <Skeleton className="h-16 w-12 rounded" />
        <Skeleton className="h-16 w-12 rounded" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  );
}

// Action button skeleton
export function ActionButtonSkeleton() {
  return (
    <Skeleton className="h-12 w-28 rounded-lg" />
  );
}

// Community cards skeleton
export function CommunityCardsSkeleton() {
  return (
    <div className="flex gap-2 justify-center">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-24 w-16 rounded" />
      ))}
    </div>
  );
}

// Full page loading state
export function FullPageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingState type="poker" message={message} size="lg" />
    </div>
  );
}

// Inline loading for buttons
export function ButtonLoader({ className }: { className?: string }) {
  return <Loader2 className={cn("h-4 w-4 animate-spin", className)} />;
}