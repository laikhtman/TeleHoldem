import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback, useRef } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';
import { useHaptic } from '@/hooks/useHaptic';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { DraggableChip } from '@/components/DraggableChip';
import { PokerSpinner } from '@/components/PokerLoader';
import { Switch } from '@/components/ui/switch';

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
  isProcessing?: boolean;
  logScale?: boolean;
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
  animationSpeed = 1,
  playerFolded = false,
  isProcessing = false,
  logScale = false
}: ActionControlsProps & { playerFolded?: boolean }) {
  const [betAmount, setBetAmount] = useState(minBet);
  const [sliderValue, setSliderValue] = useState(0);
  const [showGestureHints, setShowGestureHints] = useState(() => {
    // Check localStorage for gesture hints preference
    const stored = localStorage.getItem('poker-gesture-hints-dismissed');
    return stored !== 'true';
  });
  const [recentSizes, setRecentSizes] = useState<number[]>([]);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => setQuickMenuOpen(true), 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };
  const { isShaking: isSliderShaking, triggerShake: triggerSliderShake } = useShake(400);
  const { toast } = useToast();
  const { playSound } = useSound();
  const { triggerHaptic } = useHaptic();
  
  const canRaise = maxBet >= minRaiseAmount && currentBet > 0;
  const canBet = maxBet >= minBet && currentBet === 0;
  const minRequired = currentBet > 0 ? minRaiseAmount : minBet;

  useEffect(() => {
    const target = currentBet > 0 ? minRaiseAmount : minBet;
    setBetAmount(target);
    if (logScale) {
      const pct = computeSliderFromAmount(target, target, maxBet);
      setSliderValue(pct);
    }
  }, [minBet, minRaiseAmount, currentBet, maxBet, logScale]);

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
    if (logScale) {
      const pct = value[0];
      setSliderValue(pct);
      const mapped = computeAmountFromSlider(pct, minRequired, maxBet);
      setBetAmount(mapped);
    } else {
      setBetAmount(value[0]);
    }
  };

  const handleBetOrRaise = useCallback(() => {
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
    setRecentSizes(prev => {
      const next = [betAmount, ...prev.filter(v => v !== betAmount)];
      return next.slice(0, 5);
    });
  }, [betAmount, currentBet, maxBet, minBet, minRaiseAmount, onBet, onRaise, playSound, toast, triggerHaptic, triggerSliderShake]);

  const handleQuickBet = useCallback((amount: number) => {
    const clampedAmount = Math.max(
      currentBet > 0 ? minRaiseAmount : minBet,
      Math.min(amount, maxBet)
    );
    setBetAmount(clampedAmount);
    setRecentSizes(prev => {
      const next = [clampedAmount, ...prev.filter(v => v !== clampedAmount)];
      return next.slice(0, 5);
    });
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
  // Simple guidance for bet sizing
  const offeredPotOdds = potSize + betAmount > 0 ? betAmount / (potSize + betAmount) : 0;
  const betSizingHint = (() => {
    if (betAmount < minRequired) return 'Below minimum — adjust up';
    if (betAmount > maxBet) return 'Exceeds stack — reduce amount';
    if (potSize > 0) {
      if (betAmount <= potSize * 0.25) return 'Small bet — offers opponents great odds';
      if (betAmount >= potSize * 0.9 && !isSignificantBet) return 'Near pot — strong pressure';
    }
    if (isSignificantBet) return 'High risk — >50% of stack';
    return '';
  })();

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

  // If player has folded, show a clear message instead of disabled controls
  if (playerFolded) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-lg border border-card-border">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-muted-foreground">You have folded</h3>
          <p className="text-sm text-muted-foreground/70">Waiting for the hand to complete...</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="animate-pulse w-2 h-2 bg-muted-foreground/50 rounded-full"></div>
          <div className="animate-pulse w-2 h-2 bg-muted-foreground/50 rounded-full" style={{ animationDelay: '0.2s' }}></div>
          <div className="animate-pulse w-2 h-2 bg-muted-foreground/50 rounded-full" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    );
  }

  const dismissGestureHints = useCallback(() => {
    setShowGestureHints(false);
    localStorage.setItem('poker-gesture-hints-dismissed', 'true');
  }, []);
  // Auto Check/Fold toggle and behavior
  const [autoCheckFold, setAutoCheckFold] = useState(false);
  useEffect(() => {
    if (autoCheckFold && !disabled) {
      if (canCheck) {
        handleCheck();
      } else if (amountToCall > 0) {
        handleFold();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCheckFold, disabled, canCheck, amountToCall]);

  return (
    <div className="flex flex-col gap-3 xs:gap-4 relative" ref={swipeRef} role="group" aria-label="Action controls">
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
              isSwipingLeft ? 'bg-destructive/80' : 'bg-primary/80'
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

      {/* Consolidated gesture hint for mobile users - dismissible */}
      {showGestureHints && (
        <motion.div 
          className="bg-card/90 backdrop-blur-sm border border-border rounded-lg p-2 px-3 mb-2 flex items-center justify-between gap-2 md:hidden"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Swipe left to fold • Swipe right to {canCheck ? 'check' : 'call'} • Double-tap to check/call
            </span>
          </div>
          <Button
            onClick={dismissGestureHints}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            aria-label="Dismiss gesture hints"
          >
            <X className="w-3 h-3" />
          </Button>
        </motion.div>
      )}

      <div className="flex gap-2 xs:gap-3 md:gap-2 lg:gap-4 justify-center flex-wrap">
        {/* Fold Button - Destructive gradient (red/pink) */}
        <button
          onClick={handleFold}
          disabled={disabled}
          data-testid="button-fold"
          className="btn-gradient-destructive min-w-[110px] xs:min-w-[120px] sm:min-w-[120px] md:min-w-[110px] lg:min-w-[140px] touch-manipulation"
          style={{ touchAction: 'manipulation' }}
          aria-label="Fold your hand. Keyboard shortcut: F key"
          aria-disabled={disabled}
        >
          <span>{isProcessing ? (<><PokerSpinner className="mr-2" size={16} /> Processing...</>) : (<>FOLD <span className="text-xs ml-1 opacity-70">(F)</span></>)}</span>
        </button>
        
        {/* Check/Call Button - Cyan gradient */}
        {canCheck ? (
          <motion.div key="check" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <button
              onClick={handleCheck}
              disabled={disabled}
              data-testid="button-check"
              className="btn-gradient-secondary min-w-[110px] xs:min-w-[120px] sm:min-w-[120px] md:min-w-[110px] lg:min-w-[140px] touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              aria-label="Check - pass your turn without betting. Keyboard shortcut: C key"
              aria-disabled={disabled}
            >
              <span>{isProcessing ? (<><PokerSpinner className="mr-2" size={16} /> Processing...</>) : (<>CHECK <span className="text-xs ml-1 opacity-70">(C)</span></>)}</span>
            </button>
          </motion.div>
        ) : (
          <motion.div key="call" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
            <button
              onClick={handleCall}
              disabled={disabled || amountToCall <= 0}
              data-testid="button-call"
              className="btn-gradient-secondary min-w-[110px] xs:min-w-[120px] sm:min-w-[120px] md:min-w-[110px] lg:min-w-[140px] touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              aria-label={`Call ${amountToCall} dollars to match the current bet. Keyboard shortcut: C key`}
              aria-disabled={disabled || amountToCall <= 0}
            >
              <span>{isProcessing ? (<><PokerSpinner className="mr-2" size={16} /> Processing...</>) : (<>CALL ${amountToCall} <span className="text-xs ml-1 opacity-70">(C)</span></>)}</span>
            </button>
          </motion.div>
        )}

        {!canCheck && (
          <button
            onClick={handleCall}
            disabled={disabled || amountToCall <= 0}
            data-testid="button-snap-call"
            className="btn-snap-call btn-gradient-secondary min-w-[110px] touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label={`Snap call ${amountToCall} dollars`}
          >
            <span>SNAP CALL</span>
          </button>
        )}
        
        {/* Raise Button - Primary purple/pink gradient, only shown when raising is allowed */}
        {(canRaise || canBet) && (
          <button
            onClick={handleBetOrRaise}
            disabled={disabled || (!canRaise && !canBet)}
            data-testid="button-bet-raise"
            className="btn-gradient-primary min-w-[110px] xs:min-w-[120px] sm:min-w-[120px] md:min-w-[140px] touch-manipulation"
            style={{ touchAction: 'manipulation' }}
            aria-label={currentBet === 0 ? `Bet ${betAmount} dollars. Keyboard shortcut: R key` : `Raise to ${betAmount} dollars. Keyboard shortcut: R key`}
            aria-disabled={disabled || (!canRaise && !canBet)}
            onMouseDown={startLongPress}
            onMouseUp={cancelLongPress}
            onMouseLeave={cancelLongPress}
            onTouchStart={startLongPress}
            onTouchEnd={cancelLongPress}
          >
            <span>{isProcessing ? (<><PokerSpinner className="mr-2" size={16} /> Processing...</>) : (<>{currentBet === 0 ? `BET $${betAmount}` : `RAISE TO $${betAmount}`} <span className="text-xs ml-1 opacity-70">(R)</span></>)}</span>
          </button>
        )}
        
        {/* All-in Button - Special gold gradient with pulse animation */}
        <button
          onClick={handleAllIn}
          disabled={disabled || maxBet <= (currentBet > 0 ? minRaiseAmount : minBet)}
          data-testid="button-all-in"
          className="btn-gradient-allin min-w-[110px] xs:min-w-[120px] sm:min-w-[120px] md:min-w-[140px] touch-manipulation"
          style={{ touchAction: 'manipulation' }}
          aria-label={`Go all-in with ${maxBet} dollars. Keyboard shortcut: A key`}
          aria-disabled={disabled || maxBet <= (currentBet > 0 ? minRaiseAmount : minBet)}
        >
          <span>{isProcessing ? (<><PokerSpinner className="mr-2" size={16} /> Processing...</>) : (<>ALL-IN ${maxBet} <span className="text-xs ml-1 opacity-70">(A)</span></>)}</span>
        </button>
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
                  className="bet-value-display text-2xl font-mono font-bold" 
                  data-testid="text-bet-amount"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1] }}
                  transition={{ duration: 0.2, repeat: 1, repeatType: "reverse" }}
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

          {/* Large preset bet buttons with glass morphism */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground text-center">Quick bet options:</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {potSize > 0 && Math.floor(potSize * 0.66) <= maxBet && (
                <button
                  onClick={() => handleQuickBet(Math.floor(potSize * 0.66))}
                  disabled={disabled || Math.floor(potSize * 0.66) < (currentBet > 0 ? minRaiseAmount : minBet)}
                  data-testid="button-quick-protection"
                  className={`quick-bet-chip min-w-[100px] ${
                    betAmount === Math.floor(potSize * 0.66) ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                  }`}
                  aria-label={`Protection bet two thirds pot: ${Math.floor(potSize * 0.66)} dollars`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold uppercase">2/3 POT</span>
                    <span className="text-[10px] opacity-80">Protect</span>
                  </div>
                </button>
              )}
              {potSize > 0 && Math.floor(potSize / 3) <= maxBet && (
                <button
                  onClick={() => handleQuickBet(Math.floor(potSize / 3))}
                  disabled={disabled || Math.floor(potSize / 3) < (currentBet > 0 ? minRaiseAmount : minBet)}
                  data-testid="button-quick-third-pot"
                  className={`quick-bet-chip min-w-[100px] ${
                    betAmount === Math.floor(potSize / 3) ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                  }`}
                  aria-label={`Quick bet one third pot: ${Math.floor(potSize / 3)} dollars`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-base font-bold uppercase">1/3 POT</span>
                    <span className="text-[10px] opacity-80">Value</span>
                  </div>
                </button>
              )}
              <button
                onClick={() => handleQuickBet(halfPot)}
                disabled={disabled || halfPot < (currentBet > 0 ? minRaiseAmount : minBet) || halfPot > maxBet}
                data-testid="button-quick-half-pot"
                className={`quick-bet-chip min-w-[100px] ${
                  betAmount === halfPot ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
                aria-label={`Quick bet half pot: ${halfPot} dollars`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold uppercase">½ POT</span>
                  <span className="text-xs opacity-80">${halfPot}</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickBet(potSize)}
                disabled={disabled || potSize < (currentBet > 0 ? minRaiseAmount : minBet) || potSize > maxBet}
                data-testid="button-quick-pot"
                className={`quick-bet-chip min-w-[100px] ${
                  betAmount === potSize ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
                aria-label={`Quick bet pot size: ${potSize} dollars`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold uppercase">POT</span>
                  <span className="text-xs opacity-80">${potSize}</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickBet(potSize * 2)}
                disabled={disabled || potSize * 2 < (currentBet > 0 ? minRaiseAmount : minBet) || potSize * 2 > maxBet}
                data-testid="button-quick-2x-pot"
                className={`quick-bet-chip min-w-[100px] ${
                  betAmount === potSize * 2 ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                }`}
                aria-label={`Quick bet double pot: ${potSize * 2} dollars`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold uppercase">2× POT</span>
                  <span className="text-xs opacity-80">${potSize * 2}</span>
                </div>
              </button>
              <button
                onClick={() => handleQuickBet(maxBet)}
                disabled={disabled || maxBet <= (currentBet > 0 ? minRaiseAmount : minBet)}
                data-testid="button-quick-all-in-preset"
                className={`quick-bet-chip-allin min-w-[100px] ${
                  betAmount === maxBet ? 'ring-2 ring-yellow-500 ring-offset-2' : ''
                }`}
                aria-label={`Set bet to all-in amount: ${maxBet} dollars`}
              >
                <div className="flex flex-col items-center">
                  <span className="text-base font-bold uppercase">ALL-IN</span>
                  <span className="text-xs opacity-90">${maxBet}</span>
                </div>
              </button>
            </div>
          </div>
          
          {/* Enhanced slider with visual improvements */}
          <div className="space-y-2">
            <Slider
              value={[logScale ? sliderValue : betAmount]}
              onValueChange={handleBetChange}
              min={logScale ? 0 : (currentBet > 0 ? minRaiseAmount : minBet)}
              max={logScale ? 100 : maxBet}
              step={logScale ? 1 : 10}
              disabled={disabled}
              showTickMarks={true}
              tickInterval={potSize > 0 ? potSize : 100}
              data-testid="slider-bet"
              className="w-full"
              aria-label={`Bet amount slider. Range from ${minRequired} to ${maxBet} dollars. Current value: ${betAmount} dollars`}
              aria-describedby="bet-amount-description"
            />
            <span id="bet-amount-description" className="sr-only">
              Use the slider to adjust your bet amount. Minimum bet is {minRequired} dollars. Maximum bet is {maxBet} dollars.
            </span>
            
            {/* Enhanced slider range labels with color indicators */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col items-start">
                <span className="text-xs font-bold text-muted-foreground">MIN</span>
                <span className="text-sm font-mono">${minRequired}</span>
              </div>
              
              {potSize > 0 && (
                <>
                  {halfPot <= maxBet && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-green-500">½ POT</span>
                      <span className="text-sm font-mono">${halfPot}</span>
                    </div>
                  )}
                  
                  {potSize <= maxBet && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-blue-500">POT</span>
                      <span className="text-sm font-mono">${potSize}</span>
                    </div>
                  )}
                  
                  {potSize * 2 <= maxBet && (
                    <div className="flex flex-col items-center">
                      <span className="text-xs font-bold text-orange-500">2× POT</span>
                      <span className="text-sm font-mono">${potSize * 2}</span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-poker-chipGold">MAX</span>
                <span className="text-sm font-mono">${maxBet}</span>
              </div>
            </div>

            {/* Betting line visualization: bet vs pot and stack */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Bet/Pot</span>
                <span>{potSize > 0 ? `${Math.min(100, Math.round((betAmount / Math.max(1, potSize)) * 100))}%` : '—'}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden" aria-hidden>
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, potSize > 0 ? (betAmount / Math.max(1, potSize)) * 100 : 0)}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-1">
                <span>Bet/Stack</span>
                <span>{playerChips > 0 ? `${Math.min(100, Math.round((betAmount / Math.max(1, playerChips)) * 100))}%` : '—'}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden" aria-hidden>
                <div className="h-full bg-destructive/70" style={{ width: `${Math.min(100, playerChips > 0 ? (betAmount / Math.max(1, playerChips)) * 100 : 0)}%` }} />
              </div>
            </div>

            {/* Previous action replay */}
            {recentSizes.length > 0 && (
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">Previous sizes</span>
                <div className="flex gap-2 flex-wrap">
                  {recentSizes.slice(0, 3).map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      onClick={() => handleQuickBet(v)}
                      aria-label={`Replay size ${v} dollars`}
                      className="min-h-[48px] px-3 text-sm font-medium"
                    >
                      ${v}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizing guidance and auto check/fold */}
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                {betSizingHint && (
                  <>
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span>{betSizingHint}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Auto Check/Fold</span>
                <Switch
                  checked={autoCheckFold}
                  onCheckedChange={setAutoCheckFold}
                  aria-label="Enable auto check/fold"
                  data-testid="switch-auto-check-fold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Long-press quick menu */}
      <AnimatePresence>
        {quickMenuOpen && (
          <motion.div
            className="absolute bottom-[110%] left-1/2 -translate-x-1/2 bg-card border rounded-md shadow-md p-2 flex gap-2 z-50"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onMouseLeave={() => setQuickMenuOpen(false)}
          >
            {[
              { label: '1/3', amount: Math.floor((potSize || 0) / 3) },
              { label: '1/2', amount: Math.floor((potSize || 0) / 2) },
              { label: '3/4', amount: Math.floor((potSize || 0) * 0.75) },
              { label: 'POT', amount: potSize || minRequired },
              { label: 'AI', amount: maxBet }
            ].map(({ label, amount }) => (
              <Button key={label} variant="outline" disabled={disabled || amount < minRequired || amount > maxBet}
                onClick={() => { handleQuickBet(amount); setQuickMenuOpen(false); }} aria-label={`Quick set ${label}`}
                className="min-h-[48px] px-3 text-sm font-medium">
                {label}
              </Button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helpers for logarithmic slider mapping
function computeAmountFromSlider(pct: number, min: number, max: number): number {
  const p = Math.min(100, Math.max(0, pct)) / 100;
  if (max <= min) return Math.floor(min);
  const ratio = max / Math.max(1, min);
  const mapped = Math.max(min, Math.min(max, Math.round((Math.pow(ratio, p) * min))));
  return Math.round(mapped / 5) * 5;
}

function computeSliderFromAmount(amount: number, min: number, max: number): number {
  if (max <= min) return 0;
  const clamped = Math.min(max, Math.max(min, amount));
  const ratio = max / Math.max(1, min);
  const p = Math.log(clamped / min) / Math.log(ratio);
  return Math.round(p * 100);
}


