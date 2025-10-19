import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useShake } from '@/hooks/useShake';
import { useToast } from '@/hooks/use-toast';
import { useSound } from '@/hooks/useSound';

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
  disabled = false
}: ActionControlsProps) {
  const [betAmount, setBetAmount] = useState(minBet);
  const { isShaking: isSliderShaking, triggerShake: triggerSliderShake } = useShake(400);
  const { toast } = useToast();
  const { playSound } = useSound();

  useEffect(() => {
    setBetAmount(currentBet > 0 ? minRaiseAmount : minBet);
  }, [minBet, minRaiseAmount, currentBet]);

  // Wrapped action handlers with sound effects
  const handleFold = useCallback(() => {
    playSound('fold', { volume: 0.2 });
    onFold();
  }, [playSound, onFold]);

  const handleCheck = useCallback(() => {
    playSound('check', { volume: 0.15 });
    onCheck();
  }, [playSound, onCheck]);

  const handleCall = useCallback(() => {
    playSound('button-click', { volume: 0.15 });
    onCall();
  }, [playSound, onCall]);

  const handleBetChange = (value: number[]) => {
    setBetAmount(value[0]);
  };

  const handleBetOrRaise = useCallback(() => {
    const minRequired = currentBet > 0 ? minRaiseAmount : minBet;
    
    if (betAmount < minRequired) {
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
      triggerSliderShake();
      toast({
        variant: "destructive",
        title: "Invalid Bet",
        description: `You only have $${maxBet} in chips`,
        duration: 2000,
      });
      return;
    }

    playSound('raise', { volume: 0.25 });
    
    if (currentBet === 0) {
      onBet(betAmount);
    } else {
      onRaise(betAmount);
    }
  }, [betAmount, currentBet, maxBet, minBet, minRaiseAmount, onBet, onRaise, playSound, toast, triggerSliderShake]);

  const handleQuickBet = useCallback((amount: number) => {
    const clampedAmount = Math.max(
      currentBet > 0 ? minRaiseAmount : minBet,
      Math.min(amount, maxBet)
    );
    setBetAmount(clampedAmount);
    playSound('button-click', { volume: 0.1 });
  }, [currentBet, maxBet, minBet, minRaiseAmount, playSound]);

  const handleAllIn = useCallback(() => {
    playSound('raise', { volume: 0.3 });
    
    if (currentBet === 0) {
      onBet(maxBet);
    } else {
      onRaise(maxBet);
    }
  }, [currentBet, maxBet, onBet, onRaise, playSound]);

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

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 md:p-5 pb-[calc(1rem+var(--safe-area-bottom))] bg-card/50 backdrop-blur-sm rounded-lg border border-card-border">
      <div className="flex gap-2 xs:gap-3 md:gap-4 justify-center flex-wrap">
        <Button
          onClick={handleFold}
          variant="destructive"
          size="lg"
          disabled={disabled}
          data-testid="button-fold"
          className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[140px] min-h-11 md:min-h-[52px] poker-button-glow"
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
            className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[140px] min-h-11 md:min-h-[52px] bg-accent hover:bg-accent/90 poker-button-glow"
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
            className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[140px] min-h-11 md:min-h-[52px] bg-accent hover:bg-accent/90 poker-button-glow"
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
          className="min-w-[100px] xs:min-w-[110px] sm:min-w-[120px] md:min-w-[140px] min-h-11 md:min-h-[52px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold poker-button-glow"
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

          <div className="flex gap-2 xs:gap-3 md:gap-4 justify-center flex-wrap">
            <Button
              onClick={() => handleQuickBet(halfPot)}
              variant="outline"
              disabled={disabled || halfPot < (currentBet > 0 ? minRaiseAmount : minBet) || halfPot > maxBet}
              data-testid="button-quick-half-pot"
              className="min-w-[90px] min-h-11 md:min-h-[48px] text-sm"
            >
              1/2 Pot
            </Button>
            <Button
              onClick={() => handleQuickBet(potSize)}
              variant="outline"
              disabled={disabled || potSize < (currentBet > 0 ? minRaiseAmount : minBet) || potSize > maxBet}
              data-testid="button-quick-pot"
              className="min-w-[90px] min-h-11 md:min-h-[48px] text-sm"
            >
              Pot
            </Button>
            <Button
              onClick={handleAllIn}
              variant="outline"
              disabled={disabled || maxBet <= (currentBet > 0 ? minRaiseAmount : minBet)}
              data-testid="button-quick-all-in"
              className="min-w-[90px] min-h-11 md:min-h-[48px] text-sm border-poker-chipGold/50 text-poker-chipGold hover:bg-poker-chipGold/10"
            >
              All-In <span className="text-xs ml-1 opacity-70 hidden sm:inline">(A)</span>
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
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${currentBet > 0 ? minRaiseAmount : minBet}</span>
            <span>${maxBet}</span>
          </div>
        </div>
      )}
    </div>
  );
}
