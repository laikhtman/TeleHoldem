import { useState, useEffect, useCallback } from 'react';

const TIPS_STORAGE_KEY = 'teleholdem_tips_shown';
const TIPS_ENABLED_KEY = 'teleholdem_tips_enabled';

export interface GameTip {
  id: string;
  title: string;
  message: string;
  trigger: 'first_turn' | 'cards_dealt' | 'big_pot' | 'winning_hand' | 'losing_streak' | 'mobile_first_time' | 'first_bet' | 'all_in' | 'keyboard_available';
  icon?: string;
  delay?: number; // Delay in ms before showing
  priority?: 'low' | 'medium' | 'high';
}

export const GAME_TIPS: GameTip[] = [
  {
    id: 'keyboard_shortcuts',
    title: 'Quick Actions',
    message: 'Press F to fold, C to check/call, R to raise, A for all-in',
    trigger: 'first_turn',
    priority: 'high',
    delay: 1000
  },
  {
    id: 'hand_strength',
    title: 'Check Your Odds',
    message: 'The hand strength panel shows your winning probability in real-time',
    trigger: 'cards_dealt',
    priority: 'medium',
    delay: 2000
  },
  {
    id: 'pot_odds',
    title: 'Smart Betting',
    message: 'Consider pot odds before calling - compare the pot size to the bet amount',
    trigger: 'first_bet',
    priority: 'medium',
    delay: 1500
  },
  {
    id: 'mobile_swipe',
    title: 'Swipe Gestures',
    message: 'Swipe left to fold, swipe right to check/call on mobile',
    trigger: 'mobile_first_time',
    priority: 'high',
    delay: 1000
  },
  {
    id: 'big_pot_pressure',
    title: 'Stay Calm',
    message: 'Big pots can be intimidating - trust your read and stick to your strategy',
    trigger: 'big_pot',
    priority: 'low',
    delay: 2000
  },
  {
    id: 'winning_streak',
    title: 'Nice Win!',
    message: "You're on a roll! Remember to manage your bankroll wisely",
    trigger: 'winning_hand',
    priority: 'low',
    delay: 3000
  },
  {
    id: 'losing_streak_tip',
    title: 'Tough Luck',
    message: "Variance is part of poker - stay patient and wait for good spots",
    trigger: 'losing_streak',
    priority: 'low',
    delay: 2000
  },
  {
    id: 'all_in_tip',
    title: 'Going All-In',
    message: 'All-in moves should be calculated - consider your stack size and position',
    trigger: 'all_in',
    priority: 'medium',
    delay: 1000
  },
  {
    id: 'keyboard_available',
    title: 'Keyboard Ready',
    message: 'Use keyboard shortcuts for faster play: F, C, R, A',
    trigger: 'keyboard_available',
    priority: 'medium',
    delay: 2000
  }
];

export interface GameTipState {
  shownTips: string[];
  currentTip: GameTip | null;
  isVisible: boolean;
  tipsEnabled: boolean;
}

export function useGameTips() {
  const [shownTips, setShownTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState<GameTip | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [tipQueue, setTipQueue] = useState<GameTip[]>([]);

  // Load shown tips and enabled state from localStorage
  useEffect(() => {
    const storedTips = localStorage.getItem(TIPS_STORAGE_KEY);
    const storedEnabled = localStorage.getItem(TIPS_ENABLED_KEY);
    
    if (storedTips) {
      try {
        setShownTips(JSON.parse(storedTips));
      } catch (e) {
        console.error('Failed to parse shown tips:', e);
      }
    }
    
    if (storedEnabled !== null) {
      setTipsEnabled(storedEnabled === 'true');
    }
  }, []);

  // Save shown tips to localStorage
  useEffect(() => {
    if (shownTips.length > 0) {
      localStorage.setItem(TIPS_STORAGE_KEY, JSON.stringify(shownTips));
    }
  }, [shownTips]);

  // Save enabled state to localStorage
  useEffect(() => {
    localStorage.setItem(TIPS_ENABLED_KEY, String(tipsEnabled));
  }, [tipsEnabled]);

  const triggerTip = useCallback((trigger: GameTip['trigger'], context?: any) => {
    if (!tipsEnabled) return;

    // Find applicable tips for this trigger
    const applicableTips = GAME_TIPS.filter(tip => 
      tip.trigger === trigger && !shownTips.includes(tip.id)
    );

    if (applicableTips.length === 0) return;

    // Sort by priority
    const sortedTips = applicableTips.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority || 'medium'] - priorityOrder[a.priority || 'medium']);
    });

    const tip = sortedTips[0];

    // Add to queue
    setTipQueue(prev => [...prev, tip]);
  }, [tipsEnabled, shownTips]);

  // Process tip queue
  useEffect(() => {
    if (tipQueue.length === 0 || isVisible) return;

    const nextTip = tipQueue[0];
    const delay = nextTip.delay || 1000;

    const timer = setTimeout(() => {
      setCurrentTip(nextTip);
      setIsVisible(true);
      setShownTips(prev => [...prev, nextTip.id]);
      setTipQueue(prev => prev.slice(1));

      // Auto-hide after 5 seconds
      setTimeout(() => {
        hideTip();
      }, 5000);
    }, delay);

    return () => clearTimeout(timer);
  }, [tipQueue, isVisible]);

  const hideTip = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      setCurrentTip(null);
    }, 300); // Wait for fade animation
  }, []);

  const resetTips = useCallback(() => {
    setShownTips([]);
    localStorage.removeItem(TIPS_STORAGE_KEY);
    setCurrentTip(null);
    setIsVisible(false);
    setTipQueue([]);
  }, []);

  const enableTips = useCallback((enabled: boolean) => {
    setTipsEnabled(enabled);
  }, []);

  const markTipAsShown = useCallback((tipId: string) => {
    setShownTips(prev => {
      if (!prev.includes(tipId)) {
        return [...prev, tipId];
      }
      return prev;
    });
  }, []);

  const hasShownTip = useCallback((tipId: string) => {
    return shownTips.includes(tipId);
  }, [shownTips]);

  return {
    currentTip,
    isVisible,
    tipsEnabled,
    triggerTip,
    hideTip,
    resetTips,
    enableTips,
    markTipAsShown,
    hasShownTip,
    shownTips
  };
}