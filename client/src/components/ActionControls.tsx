import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { DraggableChip } from '@/components/DraggableChip';

interface ActionControlsProps {
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onBet: (amount: number) => void;
  onRaise: (amount: number) => void;
  canCheck: boolean;
  minBet: number;
  maxBet: number;
  amountToCall: number;
  currentBet: number;
  minRaiseAmount: number;
  potSize: number;
  playerChips: number;
  disabled?: boolean;
  animationSpeed?: number;
}

export function ActionControls({ 
  onFold, 
  onCheck, 
  onCall,
  onBet,
  onRaise,
  canCheck,
  minBet,
  maxBet,
  amountToCall,
  currentBet,
  minRaiseAmount,
  potSize,
  playerChips,
  disabled = false,
  animationSpeed = 1
}: ActionControlsProps) {
  const [betAmount, setBetAmount] = useState(minBet);
  const { isShaking: isSliderShaking, triggerShake: triggerSliderShake } = useShake(400);
  const { toast } = useToast();
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();

  useEffect(() => {
    setBetAmount(currentBet > 0 ? minRaiseAmount : minBet);
  }, [minBet, minRaiseAmount, currentBet]);

  // Wrapped action handlers with sound effects and haptic feedback
  const handleFold = useCallback(() => {
    triggerHaptic('light');
    playSound('fold', { volume: 0.2 });
    onFold();
  }, [triggerHaptic, playSound, onFold]);

  const handleCheck = useCallback(() => {
    triggerHaptic('light');
    playSound('check', { volume: 0.15 });
    onCheck();
  }, [triggerHaptic, playSound, onCheck]);

  const handleCall = useCallback(() => {
    triggerHaptic('medium');
    playSound('button-click', { volume: 0.15 });
    onCall();
  }, [triggerHaptic, playSound, onCall]);

  const handleBetChange = (value: number[]) => {
    setBetAmount(value[0]);
  };

  const handleBetOrRaise = useCallback(() => {
    const minRequired = currentBet > 0 ? minRaiseAmount : minBet;
    
    if (betAmount < minRequired) {
      triggerHaptic('error');
      triggerSliderShake();
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: `Minimum ${currentBet > 0 ? 'raise' : 'bet'} is $${minRequired}`,
        duration: 2000,
      });
      return;
    }

    if (betAmount > maxBet) {
      triggerHaptic('error');
      triggerSliderShake();
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: `You only have $${maxBet} in chips`,
        duration: 2000,
      });
      return;
    }

    triggerHaptic('heavy');
    playSound('raise', { volume: 0.25 });
    
    if (currentBet === 0) {
      onBet(betAmount);
    } else {
      onRaise(betAmount);
    }
  }, [betAmount, currentBet, maxBet, minBet, minRaiseAmount, onBet, onRaise, playSound, toast, triggerHaptic, triggerSliderShake]);

  const handleQuickBet = useCallback((amount: number) => {
    const clampedAmount = Math.max(
      currentBet > 0 ? minRaiseAmount : minBet,
      Math.min(amount, maxBet)
    );
    setBetAmount(clampedAmount);
    triggerHaptic('selection_changed');
    playSound('button-click', { volume: 0.1 });
  }, [currentBet, maxBet, minBet, minRaiseAmount, playSound, triggerHaptic]);

  const handleAllIn = useCallback(() => {
    triggerHaptic('heavy');
    playSound('raise', { volume: 0.3 });
    
    if (currentBet === 0) {
      onBet(maxBet);
    } else {
      onRaise(maxBet);
    }
  }, [currentBet, maxBet, onBet, onRaise, playSound, triggerHaptic]);

  // Keyboard shortcuts - must be after all handler definitions
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'f':
          e.preventDefault();
          handleFold();
          break;
        case 'c':
          e.preventDefault();
          if (canCheck) {
            handleCheck();
          } else {
            handleCall();
          }
          break;
        case 'r':
          e.preventDefault();
          handleBetOrRaise();
          break;
        case 'a':
          e.preventDefault();
          handleAllIn();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [disabled, canCheck, handleFold, handleCheck, handleCall, handleBetOrRaise, handleAllIn]);

  const halfPot = Math.floor(potSize / 2);
  const remainingChips = playerChips - betAmount;
  const betPercentageOfPot = potSize > 0 ? (betAmount / potSize) * 100 : 0;
  const betPercentageOfChips = playerChips > 0 ? (betAmount / playerChips) * 100 : 0;
  const isSignificantBet = betPercentageOfChips > 50;

  // Swipe gesture handlers for mobile
  const handleSwipeLeft = useCallback(() => {
    if (!disabled) {
      handleFold();
      toast({
        title: "Folded",
        description: "You folded your hand",
        duration: 1500
      });
    }
  }, [disabled, handleFold, toast]);

  const handleSwipeRight = useCallback(() => {
    if (!disabled) {
      if (canCheck) {
        handleCheck();
        toast({
          title: "Checked",
          description: "You checked",
          duration: 1500
        });
      } else if (amountToCall > 0) {
        handleCall();
        toast({
          title: "Called",
          description: `You called $${amountToCall}`,
          duration: 1500
        });
      }
    }
  }, [disabled, canCheck, amountToCall, handleCheck, handleCall, toast]);

  const { ref: swipeRef, isSwipingLeft, isSwipingRight } = useSwipeGesture(
    {
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight
    },
    {
      disabled: disabled,
      minSwipeDistance: 75,
      maxSwipeTime: 400
    }
  );

  return (
    <div className="flex flex-col gap-3 xs:gap-4 relative" ref={swipeRef}>
      {/* Swipe visual feedback indicators for mobile */}
      <AnimatePresence>
        {(isSwipingLeft || isSwipingRight) && (
          <motion.div
            className="absolute inset-x-0 -top-12 flex justify-center items-center z-50 md:hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              isSwipingLeft ? 'bg-destructive/80' : 'bg-accent/80'
            } backdrop-blur-sm text-white text-sm font-medium`}>
              {isSwipingLeft ? (
                <>
                  <ChevronLeft className="w-4 h-4" />
                  <span>Swipe to Fold</span>
                </>
              ) : (
                <>
                  <span>Swipe to {canCheck ? 'Check' : 'Call'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Swipe hint for mobile users */}
      <div className="text-xs text-muted-foreground text-center py-1 md:hidden">
        Swipe left to fold • Swipe right to {canCheck ? 'check' : 'call'}
      </div>

      <div className="flex gap-2 xs:gap-3 md:gap-2 lg:gap-4 justify-center flex-wrap">
        <Button
          onClick={handleFold}
          variant="destructive"
          size="lg"
          disabled={disabled}
          data-testid="button-fold"
          className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[110px] lg:min-w-[140px] min-h-[48px] sm:min-h-[52px] poker-button-glow"
          aria-label="Fold your hand. Keyboard shortcut: F key"
          aria-disabled={disabled}
        >
          Fold <span className="text-xs ml-1 opacity-70 hidden sm:inline">(F)</span>
        </Button>
        
        {canCheck ? (
          <Button
            onClick={handleCheck}
            variant="secondary"
            size="lg"
            disabled={disabled}
            data-testid="button-check"
            className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[110px] lg:min-w-[140px] min-h-[48px] sm:min-h-[52px] bg-accent hover:bg-accent/90 poker-button-glow"
            aria-label="Check - pass your turn without betting. Keyboard shortcut: C key"
            aria-disabled={disabled}
          >
            Check <span className="text-xs ml-1 opacity-70 hidden sm:inline">(C)</span>
          </Button>
        ) : (
          <Button
            onClick={handleCall}
            variant="secondary"
            size="lg"
            disabled={disabled || amountToCall <= 0}
            data-testid="button-call"
            className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[110px] lg:min-w-[140px] min-h-[48px] sm:min-h-[52px] bg-accent hover:bg-accent/90 poker-button-glow"
            aria-label={`Call ${amountToCall} dollars to match the current bet. Keyboard shortcut: C key`}
            aria-disabled={disabled || amountToCall <= 0}
          >
            Call ${amountToCall} <span className="text-xs ml-1 opacity-70 hidden sm:inline">(C)</span>
          </Button>
        )}
        
        <Button
          onClick={handleBetOrRaise}
          variant="default"
          size="lg"
          disabled={disabled || maxBet < minBet}
          data-testid="button-bet-raise"
          className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[140px] min-h-[48px] sm:min-h-[52px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold poker-button-glow"
          aria-label={currentBet === 0 ? `Bet ${betAmount} dollars. Keyboard shortcut: R key` : `Raise to ${betAmount} dollars. Keyboard shortcut: R key`}
          aria-disabled={disabled || maxBet < minBet}
        >
          {currentBet === 0 ? `Bet $${betAmount}` : `Raise to $${betAmount}`} <span className="text-xs ml-1 opacity-70 hidden sm:inline">(R)</span>
        </Button>
      </div>

      {maxBet >= minBet && (
        <div className={`space-y-3 ${isSliderShaking ? 'animate-shake' : ''}`}>
          <motion.div 
            className={`flex items-center justify-between gap-2 p-3 bg-background/50 rounded-md border ${isSliderShaking ? 'animate-flash-border' : 'border-border'}`}
            animate={{
              borderColor: isSliderShaking ? undefined : (isSignificantBet 
                ? ['hsl(var(--border))', 'hsl(var(--destructive))', 'hsl(var(--border))']
                : 'hsl(var(--border))')
            }}
            transition={{ duration: 1.5, repeat: isSignificantBet ? Infinity : 0 }}
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <motion.span 
                  key={betAmount}
                  className="text-lg font-mono font-bold text-poker-chipGold" 
                  data-testid="text-bet-amount"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.2 }}
                >
                  ${betAmount}
                </motion.span>
                {isSignificantBet && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <Badge variant="destructive" className="text-xs gap-1">
                      <AlertCircle className="w-3 h-3" />
                      High Risk
                    </Badge>
                  </motion.div>
                )}
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {potSize > 0 && (
                  <span data-testid="text-bet-pot-percentage">
                    {betPercentageOfPot.toFixed(0)}% of pot
                  </span>
                )}
                <motion.span 
                  className={remainingChips < playerChips * 0.2 ? "text-destructive font-semibold" : ""} 
                  data-testid="text-remaining-chips"
                  animate={{
                    color: remainingChips < playerChips * 0.2 
                      ? ['hsl(var(--muted-foreground))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))']
                      : 'hsl(var(--muted-foreground))'
                  }}
                  transition={{ duration: 1, repeat: remainingChips < playerChips * 0.2 ? Infinity : 0 }}
                >
                  ${remainingChips} remaining
                </motion.span>
              </div>
            </div>
          </motion.div>

          {/* Draggable chips for mobile quick betting */}
          <div className="flex flex-col gap-2 md:hidden mb-3">
            <div className="text-xs text-muted-foreground text-center">
              Drag chips to pot to bet
            </div>
            <div className="flex gap-3 justify-center">
              <DraggableChip 
                value={10}
                onDrop={(value) => handleQuickBet(value)}
                disabled={disabled || 10 < minBet || 10 > maxBet}
              />
              <DraggableChip 
                value={25}
                onDrop={(value) => handleQuickBet(value)}
                disabled={disabled || 25 < minBet || 25 > maxBet}
              />
              <DraggableChip 
                value={50}
                onDrop={(value) => handleQuickBet(value)}
                disabled={disabled || 50 < minBet || 50 > maxBet}
              />
              <DraggableChip 
                value={100}
                onDrop={(value) => handleQuickBet(value)}
                disabled={disabled || 100 < minBet || 100 > maxBet}
              />
            </div>
          </div>

          {/* Quick bet buttons optimized for thumb reach on mobile */}
          <div className="grid grid-cols-2 xs:flex gap-2 xs:gap-3 md:gap-2 lg:gap-4 xs:justify-center xs:flex-wrap">
            <Button
              onClick={() => handleQuickBet(halfPot)}
              variant="outline"
              disabled={disabled || halfPot < (currentBet > 0 ? minRaiseAmount : minBet) || halfPot > maxBet}
              data-testid="button-quick-half-pot"
              className="min-h-[52px] text-sm font-semibold bg-background/50 backdrop-blur-sm border-2 hover:bg-accent/20"
              aria-label={`Quick bet half pot: ${halfPot} dollars`}
            >
              <div className="flex flex-col items-center">
                <span>½ POT</span>
                <span className="text-xs opacity-70">${halfPot}</span>
              </div>
            </Button>
            <Button
              onClick={() => handleQuickBet(potSize)}
              variant="outline"
              disabled={disabled || potSize < (currentBet > 0 ? minRaiseAmount : minBet) || potSize > maxBet}
              data-testid="button-quick-pot"
              className="min-h-[52px] text-sm font-semibold bg-background/50 backdrop-blur-sm border-2 hover:bg-accent/20"
              aria-label={`Quick bet pot size: ${potSize} dollars`}
            >
              <div className="flex flex-col items-center">
                <span>POT</span>
                <span className="text-xs opacity-70">${potSize}</span>
              </div>
            </Button>
            <Button
              onClick={() => handleQuickBet(potSize * 2)}
              variant="outline"
              disabled={disabled || potSize * 2 < (currentBet > 0 ? minRaiseAmount : minBet) || potSize * 2 > maxBet}
              data-testid="button-quick-2x-pot"
              className="min-h-[52px] text-sm font-semibold bg-background/50 backdrop-blur-sm border-2 hover:bg-accent/20"
              aria-label={`Quick bet double pot: ${potSize * 2} dollars`}
            >
              <div className="flex flex-col items-center">
                <span>2× POT</span>
                <span className="text-xs opacity-70">${potSize * 2}</span>
              </div>
            </Button>
            <Button
              onClick={handleAllIn}
              variant="outline"
              disabled={disabled || maxBet <= (currentBet > 0 ? minRaiseAmount : minBet)}
              data-testid="button-quick-all-in"
              className="min-h-[52px] text-sm font-bold bg-poker-chipGold/10 backdrop-blur-sm border-2 border-poker-chipGold/50 text-poker-chipGold hover:bg-poker-chipGold/20"
              aria-label={`Go all-in with all your chips: ${maxBet} dollars. Keyboard shortcut: A key`}
            >
              <div className="flex flex-col items-center">
                <span>ALL-IN</span>
                <span className="text-xs opacity-90">${maxBet}</span>
              </div>
            </Button>
          </div>

          <Slider
            value={[betAmount]}
            onValueChange={handleBetChange}
            min={currentBet > 0 ? minRaiseAmount : minBet}
            max={maxBet}
            step={10}
            disabled={disabled}
            data-testid="slider-bet"
            className="w-full [&>span:first-child]:h-2 [&>span:first-child]:md:h-3"
            aria-label={`Bet amount slider. Range from ${currentBet > 0 ? minRaiseAmount : minBet} to ${maxBet} dollars. Current value: ${betAmount} dollars`}
            aria-describedby="bet-amount-description"
          />
          <span id="bet-amount-description" className="sr-only">
            Use the slider to adjust your bet amount. Minimum bet is {currentBet > 0 ? minRaiseAmount : minBet} dollars. Maximum bet is {maxBet} dollars.
          </span>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${currentBet > 0 ? minRaiseAmount : minBet}</span>
            <span>${maxBet}</span>
          </div>
        </div>
      )}
    </div>
  );
}
