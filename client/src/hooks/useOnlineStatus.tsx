import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface QueuedAction {
  id: string;
  action: () => Promise<any>;
  description: string;
  timestamp: number;
  retryCount: number;
}

interface UseOnlineStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  enableToasts?: boolean;
  enableBanner?: boolean;
  retryInterval?: number;
  maxRetries?: number;
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}) {
  const {
    onOnline,
    onOffline,
    enableToasts = true,
    enableBanner = true,
    retryInterval = 5000,
    maxRetries = 3,
  } = options;

  const [isOnline, setIsOnline] = useState(() => 
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [queuedActions, setQueuedActions] = useState<QueuedAction[]>([]);
  const [connectionSpeed, setConnectionSpeed] = useState<'fast' | 'slow' | 'offline'>('fast');
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastOnlineTime = useRef<number>(Date.now());
  const offlineToastId = useRef<string | null>(null);
  const { toast, dismiss } = useToast();

  // Check actual connection (not just navigator.onLine)
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch with a small timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);
      
      clearTimeout(timeoutId);
      
      if (!response || !response.ok) {
        return false;
      }
      
      // Measure connection speed based on response time
      const responseTime = Date.now() - performance.now();
      if (responseTime < 300) {
        setConnectionSpeed('fast');
      } else if (responseTime < 1000) {
        setConnectionSpeed('slow');
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  // Queue an action to be retried when online
  const queueAction = useCallback((
    action: () => Promise<any>,
    description: string
  ): string => {
    const id = `action_${Date.now()}_${Math.random()}`;
    const queuedAction: QueuedAction = {
      id,
      action,
      description,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    setQueuedActions(prev => [...prev, queuedAction]);
    
    if (enableToasts) {
      toast({
        title: 'Action Queued',
        description: `"${description}" will be executed when connection is restored.`,
        variant: 'default' as any,
        duration: 3000,
      });
    }
    
    return id;
  }, [enableToasts, toast]);

  // Remove action from queue
  const removeFromQueue = useCallback((id: string) => {
    setQueuedActions(prev => prev.filter(action => action.id !== id));
  }, []);

  // Process queued actions when back online
  const processQueue = useCallback(async () => {
    if (queuedActions.length === 0) return;
    
    const actionsToProcess = [...queuedActions];
    const succeeded: string[] = [];
    const failed: QueuedAction[] = [];
    
    for (const queuedAction of actionsToProcess) {
      try {
        await queuedAction.action();
        succeeded.push(queuedAction.id);
        
        if (enableToasts) {
          toast({
            title: 'Action Completed',
            description: queuedAction.description,
            variant: 'success' as any,
            duration: 2000,
          });
        }
      } catch (error) {
        queuedAction.retryCount++;
        
        if (queuedAction.retryCount < maxRetries) {
          failed.push(queuedAction);
        } else {
          if (enableToasts) {
            toast({
              title: 'Action Failed',
              description: `Failed to ${queuedAction.description} after ${maxRetries} attempts.`,
              variant: 'destructive',
              duration: 5000,
              action: (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    queuedAction.retryCount = 0;
                    setQueuedActions(prev => [...prev, queuedAction]);
                  }}
                >
                  Retry
                </Button>
              ),
            });
          }
        }
      }
    }
    
    // Update queue with only failed actions that haven't exceeded retry limit
    setQueuedActions(failed);
    
    // If there are still failed actions, retry after interval
    if (failed.length > 0) {
      setTimeout(() => processQueue(), retryInterval);
    }
  }, [queuedActions, enableToasts, toast, maxRetries, retryInterval]);

  // Handle going online
  const handleOnline = useCallback(async () => {
    const isActuallyOnline = await checkConnection();
    
    if (!isActuallyOnline) {
      setIsReconnecting(true);
      // Retry connection check
      reconnectTimeout.current = setTimeout(() => {
        handleOnline();
      }, retryInterval);
      return;
    }
    
    setIsOnline(true);
    setIsReconnecting(false);
    
    // Dismiss offline toast if it exists
    if (offlineToastId.current) {
      dismiss(offlineToastId.current);
      offlineToastId.current = null;
    }
    
    const offlineDuration = Date.now() - lastOnlineTime.current;
    
    if (enableToasts && offlineDuration > 2000) {
      toast({
        title: 'Connection Restored',
        description: 'You are back online.',
        variant: 'success' as any,
        duration: 3000,
      });
    }
    
    // Process queued actions
    if (queuedActions.length > 0) {
      processQueue();
    }
    
    onOnline?.();
  }, [checkConnection, dismiss, enableToasts, toast, queuedActions, processQueue, onOnline, retryInterval]);

  // Handle going offline
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setConnectionSpeed('offline');
    lastOnlineTime.current = Date.now();
    
    if (enableToasts && !offlineToastId.current) {
      const { id } = toast({
        title: 'Connection Lost',
        description: 'You are currently offline. Actions will be queued.',
        variant: 'destructive',
        duration: Infinity,
        action: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsReconnecting(true);
              handleOnline();
            }}
          >
            Retry
          </Button>
        ),
      });
      offlineToastId.current = id;
    }
    
    onOffline?.();
  }, [enableToasts, toast, onOffline, handleOnline]);

  // Setup event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial connection check
    checkConnection().then(connected => {
      if (!connected && navigator.onLine) {
        handleOffline();
      }
    });
    
    // Periodic connection check
    const interval = setInterval(() => {
      if (navigator.onLine) {
        checkConnection().then(connected => {
          if (connected && !isOnline) {
            handleOnline();
          } else if (!connected && isOnline) {
            handleOffline();
          }
        });
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [handleOnline, handleOffline, checkConnection, isOnline]);

  return {
    isOnline,
    isReconnecting,
    connectionSpeed,
    queueAction,
    removeFromQueue,
    queuedActions,
    checkConnection,
    retryConnection: handleOnline,
  };
}

// Offline banner component
export function OfflineBanner() {
  const { isOnline, isReconnecting, retryConnection } = useOnlineStatus({ enableToasts: false });
  
  if (isOnline) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-2 text-center">
      <div className="flex items-center justify-center gap-2">
        <span className="text-sm font-medium">
          {isReconnecting ? 'Reconnecting...' : 'You are currently offline'}
        </span>
        {!isReconnecting && (
          <Button
            size="sm"
            variant="secondary"
            onClick={retryConnection}
            className="h-6 px-2 text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}