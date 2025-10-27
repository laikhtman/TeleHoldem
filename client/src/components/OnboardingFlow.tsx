import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete?: () => void;
  className?: string;
}

export function OnboardingFlow({ onComplete, className }: OnboardingFlowProps) {
  const {
    isOnboardingActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    progress,
    nextStep,
    previousStep,
    skipOnboarding,
    completeOnboarding
  } = useOnboarding();

  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Calculate highlight position when step changes
  useEffect(() => {
    if (!currentStep || !currentStep.target) {
      setHighlightPosition(null);
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const targetElement = document.querySelector(currentStep.target as string);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setHighlightPosition(rect);
      } else {
        setHighlightPosition(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOnboardingActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          skipOnboarding();
          break;
        case 'ArrowRight':
          nextStep();
          break;
        case 'ArrowLeft':
          previousStep();
          break;
        case 'Enter':
          nextStep();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOnboardingActive, nextStep, previousStep, skipOnboarding]);

  const handleComplete = () => {
    completeOnboarding();
    onComplete?.();
  };

  const handleSkip = () => {
    skipOnboarding();
    onComplete?.();
  };

  if (!isOnboardingActive || !currentStep) {
    return null;
  }

  const getTooltipPosition = () => {
    if (!highlightPosition || !currentStep.position) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const padding = 20;
    const tooltipWidth = 360;
    const tooltipHeight = 200;

    let top = '50%';
    let left = '50%';
    let transform = 'translate(-50%, -50%)';

    switch (currentStep.position) {
      case 'top':
        top = `${highlightPosition.top - tooltipHeight - padding}px`;
        left = `${highlightPosition.left + highlightPosition.width / 2}px`;
        transform = 'translateX(-50%)';
        break;
      case 'bottom':
        top = `${highlightPosition.bottom + padding}px`;
        left = `${highlightPosition.left + highlightPosition.width / 2}px`;
        transform = 'translateX(-50%)';
        break;
      case 'left':
        top = `${highlightPosition.top + highlightPosition.height / 2}px`;
        left = `${highlightPosition.left - tooltipWidth - padding}px`;
        transform = 'translateY(-50%)';
        break;
      case 'right':
        top = `${highlightPosition.top + highlightPosition.height / 2}px`;
        left = `${highlightPosition.right + padding}px`;
        transform = 'translateY(-50%)';
        break;
      case 'center':
      default:
        // Keep centered
        break;
    }

    return { top, left, transform };
  };

  const tooltipPosition = getTooltipPosition();

  return (
    <AnimatePresence>
      {isOnboardingActive && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-[9999] flex items-center justify-center",
            className
          )}
          data-testid="onboarding-overlay"
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Highlight cutout */}
          {highlightPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute pointer-events-none"
              style={{
                top: highlightPosition.top - 10,
                left: highlightPosition.left - 10,
                width: highlightPosition.width + 20,
                height: highlightPosition.height + 20,
              }}
            >
              <div className="relative w-full h-full">
                {/* Highlight border */}
                <div className="absolute inset-0 rounded-lg border-4 border-poker-chipGold animate-pulse" />
                {/* Transparent center */}
                <div 
                  className="absolute inset-0 rounded-lg"
                  style={{
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                    backgroundColor: 'transparent'
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bg-background border-2 border-border rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4"
            style={tooltipPosition}
            data-testid="onboarding-tooltip"
          >
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-poker-chipGold" />
                <span className="text-sm text-muted-foreground">
                  Step {currentStepIndex + 1} of {totalSteps}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="h-8 w-8"
                aria-label="Skip tutorial"
                data-testid="button-skip-onboarding"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground">
                {currentStep.description}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mt-6 mb-4">
              <Progress value={progress} className="h-2" />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={previousStep}
                disabled={currentStepIndex === 0}
                className="min-h-[36px]"
                data-testid="button-previous-step"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              {currentStepIndex === totalSteps - 1 ? (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="min-h-[36px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90"
                  data-testid="button-complete-onboarding"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={nextStep}
                  className="min-h-[36px]"
                  data-testid="button-next-step"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Keyboard hints */}
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                Use arrow keys to navigate • Press ESC to skip
              </p>
            </div>
          </motion.div>

          {/* Mobile-specific instructions */}
          {window.innerWidth < 768 && currentStep.id === 'mobile-fab' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-4 right-4 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-4"
              data-testid="mobile-hint"
            >
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-poker-chipGold flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Mobile Tips:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Swipe left to fold</li>
                    <li>Swipe right to check/call</li>
                    <li>Use the FAB menu for quick access</li>
                    <li>Rotate to landscape for better view</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}