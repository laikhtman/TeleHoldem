import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  isReconnecting: boolean;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isReconnecting: false
  });
  const { toast } = useToast();
  
  // Get connection info if available
  const getConnectionInfo = () => {
    const nav = navigator as any;
    if (nav.connection || nav.mozConnection || nav.webkitConnection) {
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      return {
        connectionType: connection.type,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    return {};
  };

  const handleOnline = useCallback(() => {
    const connectionInfo = getConnectionInfo();
    setNetworkStatus({
      isOnline: true,
      isReconnecting: false,
      ...connectionInfo
    });
    
    toast({
      variant: 'success',
      title: 'Connection Restored',
      description: 'You are back online!',
      duration: 3000,
    });
  }, [toast]);

  const handleOffline = useCallback(() => {
    setNetworkStatus({
      isOnline: false,
      isReconnecting: false
    });
    
    toast({
      variant: 'destructive',
      title: 'Connection Lost',
      description: 'Please check your internet connection',
      duration: 5000,
    });
  }, [toast]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }
    
    // Try to ping a reliable endpoint
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      }).catch(() => null);
      
      return response?.ok ?? false;
    } catch {
      return false;
    }
  }, []);

  const attemptReconnection = useCallback(async () => {
    if (!networkStatus.isOnline && navigator.onLine) {
      setNetworkStatus(prev => ({ ...prev, isReconnecting: true }));
      
      toast({
        variant: 'info',
        title: 'Attempting to reconnect...',
        description: 'Please wait while we restore your connection',
        duration: 2000,
      });
      
      const isConnected = await checkConnection();
      
      if (isConnected) {
        handleOnline();
      } else {
        setNetworkStatus(prev => ({ ...prev, isReconnecting: false }));
        
        toast({
          variant: 'warning',
          title: 'Reconnection failed',
          description: 'Will retry in a few seconds',
          duration: 3000,
        });
      }
    }
  }, [networkStatus.isOnline, checkConnection, handleOnline, toast]);

  useEffect(() => {
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check connection status on mount
    const connectionInfo = getConnectionInfo();
    setNetworkStatus(prev => ({
      ...prev,
      ...connectionInfo
    }));
    
    // Set up periodic reconnection attempts when offline
    let reconnectionInterval: NodeJS.Timeout | null = null;
    
    if (!networkStatus.isOnline) {
      reconnectionInterval = setInterval(() => {
        attemptReconnection();
      }, 5000); // Try every 5 seconds
    }
    
    // Listen to connection changes if available
    const nav = navigator as any;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
    
    const handleConnectionChange = () => {
      const info = getConnectionInfo();
      setNetworkStatus(prev => ({
        ...prev,
        ...info
      }));
      
      // Warn about poor connection
      if (info.effectiveType === '2g' || info.effectiveType === 'slow-2g') {
        toast({
          variant: 'warning',
          title: 'Slow Connection',
          description: 'Your connection may affect game performance',
          duration: 4000,
        });
      }
    };
    
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (reconnectionInterval) {
        clearInterval(reconnectionInterval);
      }
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [networkStatus.isOnline, handleOnline, handleOffline, attemptReconnection, toast]);

  return {
    ...networkStatus,
    attemptReconnection,
    checkConnection
  };
}