import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

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

  useEffect(() => {
    setBetAmount(currentBet > 0 ? minRaiseAmount : minBet);
  }, [minBet, minRaiseAmount, currentBet]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (disabled) return;
      
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const key = e.key.toLowerCase();
      
      switch (key) {
        case 'f':
          e.preventDefault();
          onFold();
          break;
        case 'c':
          e.preventDefault();
          if (canCheck) {
            onCheck();
          } else {
            onCall();
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
  }, [disabled, canCheck, betAmount, onFold, onCheck, onCall, currentBet, onBet, onRaise, maxBet]);

  const handleBetChange = (value: number[]) => {
    setBetAmount(value[0]);
  };

  const handleBetOrRaise = () => {
    if (currentBet === 0) {
      onBet(betAmount);
    } else {
      onRaise(betAmount);
    }
  };

  const handleQuickBet = (amount: number) => {
    const clampedAmount = Math.max(
      currentBet > 0 ? minRaiseAmount : minBet,
      Math.min(amount, maxBet)
    );
    setBetAmount(clampedAmount);
  };

  const handleAllIn = () => {
    if (currentBet === 0) {
      onBet(maxBet);
    } else {
      onRaise(maxBet);
    }
  };

  const halfPot = Math.floor(potSize / 2);
  const remainingChips = playerChips - betAmount;
  const betPercentageOfPot = potSize > 0 ? (betAmount / potSize) * 100 : 0;
  const betPercentageOfChips = playerChips > 0 ? (betAmount / playerChips) * 100 : 0;
  const isSignificantBet = betPercentageOfChips > 50;

  return (
    <div className="flex flex-col gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-lg border border-card-border">
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          onClick={onFold}
          variant="destructive"
          size="lg"
          disabled={disabled}
          data-testid="button-fold"
          className="min-w-[120px] poker-button-glow"
        >
          Fold <span className="text-xs ml-1 opacity-70">(F)</span>
        </Button>
        
        {canCheck ? (
          <Button
            onClick={onCheck}
            variant="secondary"
            size="lg"
            disabled={disabled}
            data-testid="button-check"
            className="min-w-[120px] bg-accent hover:bg-accent/90 poker-button-glow"
          >
            Check <span className="text-xs ml-1 opacity-70">(C)</span>
          </Button>
        ) : (
          <Button
            onClick={onCall}
            variant="secondary"
            size="lg"
            disabled={disabled || amountToCall <= 0}
            data-testid="button-call"
            className="min-w-[120px] bg-accent hover:bg-accent/90 poker-button-glow"
          >
            Call ${amountToCall} <span className="text-xs ml-1 opacity-70">(C)</span>
          </Button>
        )}
        
        <Button
          onClick={handleBetOrRaise}
          variant="default"
          size="lg"
          disabled={disabled || maxBet < minBet}
          data-testid="button-bet-raise"
          className="min-w-[120px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold poker-button-glow"
        >
          {currentBet === 0 ? `Bet $${betAmount}` : `Raise to $${betAmount}`} <span className="text-xs ml-1 opacity-70">(R)</span>
        </Button>
      </div>

      {maxBet >= minBet && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 p-3 bg-background/50 rounded-md border border-border">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-poker-chipGold" data-testid="text-bet-amount">
                  ${betAmount}
                </span>
                {isSignificantBet && (
                  <Badge variant="destructive" className="text-xs gap-1">
                    <AlertCircle className="w-3 h-3" />
                    High Risk
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                {potSize > 0 && (
                  <span data-testid="text-bet-pot-percentage">
                    {betPercentageOfPot.toFixed(0)}% of pot
                  </span>
                )}
                <span className={remainingChips < playerChips * 0.2 ? "text-destructive font-semibold" : ""} data-testid="text-remaining-chips">
                  ${remainingChips} remaining
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <Button
              onClick={() => handleQuickBet(halfPot)}
              variant="outline"
              size="sm"
              disabled={disabled || halfPot < (currentBet > 0 ? minRaiseAmount : minBet) || halfPot > maxBet}
              data-testid="button-half-pot"
              className="min-w-[80px]"
            >
              1/2 Pot
            </Button>
            <Button
              onClick={() => handleQuickBet(potSize)}
              variant="outline"
              size="sm"
              disabled={disabled || potSize < (currentBet > 0 ? minRaiseAmount : minBet) || potSize > maxBet}
              data-testid="button-pot"
              className="min-w-[80px]"
            >
              Pot
            </Button>
            <Button
              onClick={handleAllIn}
              variant="outline"
              size="sm"
              disabled={disabled || maxBet <= (currentBet > 0 ? minRaiseAmount : minBet)}
              data-testid="button-all-in"
              className="min-w-[80px] border-poker-chipGold/50 text-poker-chipGold hover:bg-poker-chipGold/10"
            >
              All-In <span className="text-xs ml-1 opacity-70">(A)</span>
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
            className="w-full"
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
