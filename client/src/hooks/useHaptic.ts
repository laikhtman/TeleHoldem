import { useCallback } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

export type HapticType = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'selection_changed' | 'success' | 'warning' | 'error';

export function useHaptic() {
  const { webApp } = useTelegramWebApp();

  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    if (!webApp?.HapticFeedback) {
      // Fallback to Vibration API for web browsers
      if ('vibrate' in navigator) {
        const vibrationPattern: Record<HapticType, number> = {
          light: 10,
          medium: 20,
          heavy: 30,
          rigid: 15,
          soft: 10,
          selection_changed: 5,
          success: 25,
          warning: 20,
          error: 30
        };
        navigator.vibrate(vibrationPattern[type]);
      }
      return;
    }

    // Use Telegram WebApp HapticFeedback API
    try {
      if (type === 'selection_changed') {
        webApp.HapticFeedback.selectionChanged();
      } else if (['success', 'warning', 'error'].includes(type)) {
        webApp.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error');
      } else {
        webApp.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, [webApp]);

  return { triggerHaptic };
}
