import { motion, AnimatePresence } from 'framer-motion';
import { X, Lightbulb, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useGameTips, GameTip as GameTipType } from '@/hooks/useGameTips';

interface GameTipProps {
  className?: string;
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function GameTip({ className, position = 'top-right' }: GameTipProps) {
  const { currentTip, isVisible, hideTip } = useGameTips();

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'top-4 left-1/2 -translate-x-1/2';
      case 'bottom':
        return 'bottom-20 left-1/2 -translate-x-1/2';
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-20 left-4';
      case 'bottom-right':
        return 'bottom-20 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getIcon = (tip: GameTipType) => {
    switch (tip.priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-500" />;
      case 'medium':
      default:
        return <Lightbulb className="w-4 h-4 text-poker-chipGold" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && currentTip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: position.includes('top') ? -20 : 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            'fixed z-50 max-w-xs w-full bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3',
            getPositionClasses(),
            className
          )}
          data-testid="game-tip"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(currentTip)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">{currentTip.title}</h4>
              <p className="text-xs text-muted-foreground">
                {currentTip.message}
              </p>
            </div>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={hideTip}
              className="h-6 w-6 flex-shrink-0"
              aria-label="Dismiss tip"
              data-testid="button-dismiss-tip"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Progress indicator */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-poker-chipGold"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface GameTipManagerProps {
  onTrigger?: (trigger: string) => void;
  className?: string;
}

export function GameTipManager({ onTrigger, className }: GameTipManagerProps) {
  const { tipsEnabled, enableTips, resetTips } = useGameTips();

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => enableTips(!tipsEnabled)}
        className="min-h-[36px]"
        data-testid="button-toggle-tips"
      >
        {tipsEnabled ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Tips Enabled
          </>
        ) : (
          <>
            <X className="w-4 h-4 mr-2 text-red-500" />
            Tips Disabled
          </>
        )}
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={resetTips}
        className="min-h-[36px]"
        data-testid="button-reset-tips"
      >
        Reset All Tips
      </Button>
    </div>
  );
}