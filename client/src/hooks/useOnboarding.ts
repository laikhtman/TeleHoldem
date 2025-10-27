import { useState, useEffect, useCallback } from 'react';

const ONBOARDING_VERSION = '1.0.0';
const STORAGE_KEY = 'teleholdem_onboarding_complete';
const VERSION_KEY = 'teleholdem_tutorial_version';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to perform when this step is shown
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to TeleHoldem! 🎰',
    description: "Let's quickly show you around the poker table. You can skip this tutorial at any time.",
    position: 'center'
  },
  {
    id: 'your-cards',
    title: 'Your Cards',
    description: 'Your two hole cards appear here. Only you can see these cards.',
    target: '[data-player-id="0"] .playing-card',
    position: 'top'
  },
  {
    id: 'community-cards',
    title: 'Community Cards',
    description: 'These are the shared cards that all players use to make their best 5-card hand.',
    target: '.community-cards-container',
    position: 'bottom'
  },
  {
    id: 'hand-strength',
    title: 'Hand Strength Indicator',
    description: 'This panel shows your current hand strength and winning probability. Use it to make better decisions!',
    target: '.hand-strength-panel',
    position: 'right'
  },
  {
    id: 'action-controls',
    title: 'Action Controls',
    description: 'Use these buttons to fold, check, call, or raise. You can also use keyboard shortcuts.',
    target: '.action-controls',
    position: 'top'
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Quick Keyboard Shortcuts',
    description: 'Press F to fold, C to check/call, R to raise, and A for all-in. These work anytime during your turn!',
    position: 'center'
  },
  {
    id: 'pot-display',
    title: 'The Pot',
    description: 'All bets go into the pot. The winner takes it all!',
    target: '.pot-display',
    position: 'bottom'
  },
  {
    id: 'stats-panel',
    title: 'Statistics & History',
    description: 'Track your performance, view action history, and see your achievements here.',
    target: '.right-sidebar-panel',
    position: 'left'
  },
  {
    id: 'help-button',
    title: 'Need Help?',
    description: 'Click the help button or press "?" anytime to access the full help documentation.',
    target: '[data-testid="button-help"]',
    position: 'left'
  },
  {
    id: 'mobile-fab',
    title: 'Mobile Menu',
    description: 'On mobile devices, use this floating button to access stats, history, and settings.',
    target: '[data-testid="fab-main"]',
    position: 'top'
  }
];

export function useOnboarding() {
  const [isOnboardingActive, setIsOnboardingActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    // Initialize from localStorage directly to avoid race conditions
    const completed = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(VERSION_KEY);
    // Only return true if BOTH completed is 'true' AND version matches
    return completed === 'true' && version === ONBOARDING_VERSION;
  });

  const startOnboarding = useCallback(() => {
    setIsOnboardingActive(true);
    setCurrentStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      completeOnboarding();
    }
  }, [currentStepIndex]);

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [currentStepIndex]);

  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsOnboardingActive(false);
    setHasCompletedOnboarding(true);
    setCurrentStepIndex(0);
    
    // Save completion to localStorage
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(VERSION_KEY, ONBOARDING_VERSION);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
    setHasCompletedOnboarding(false);
    setCurrentStepIndex(0);
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < ONBOARDING_STEPS.length) {
      setCurrentStepIndex(stepIndex);
    }
  }, []);

  // Filter steps based on device type
  const getRelevantSteps = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    
    return ONBOARDING_STEPS.filter(step => {
      // Skip mobile-specific steps on desktop
      if (!isMobile && step.id === 'mobile-fab') {
        return false;
      }
      // Skip desktop-specific steps on mobile if needed
      return true;
    });
  }, []);

  const currentStep = getRelevantSteps()[currentStepIndex];
  const totalSteps = getRelevantSteps().length;
  const progress = totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  return {
    isOnboardingActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    hasCompletedOnboarding,
    startOnboarding,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding,
    resetOnboarding,
    goToStep
  };
}