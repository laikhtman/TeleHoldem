import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

interface ActionControlsProps {
  onFold: () => void;
  onCheck: () => void;
  onBet: (amount: number) => void;
  canCheck: boolean;
  minBet: number;
  maxBet: number;
  disabled?: boolean;
}

export function ActionControls({ 
  onFold, 
  onCheck, 
  onBet, 
  canCheck,
  minBet,
  maxBet,
  disabled = false
}: ActionControlsProps) {
  const [betAmount, setBetAmount] = useState(minBet);

  const handleBetChange = (value: number[]) => {
    setBetAmount(value[0]);
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-card/50 backdrop-blur-sm rounded-lg border border-card-border">
      <div className="flex gap-3 justify-center flex-wrap">
        <Button
          onClick={onFold}
          variant="destructive"
          size="lg"
          disabled={disabled}
          data-testid="button-fold"
          className="min-w-[120px]"
        >
          Fold
        </Button>
        
        {canCheck ? (
          <Button
            onClick={onCheck}
            variant="secondary"
            size="lg"
            disabled={disabled}
            data-testid="button-check"
            className="min-w-[120px] bg-accent hover:bg-accent/90"
          >
            Check
          </Button>
        ) : (
          <Button
            onClick={() => onBet(minBet)}
            variant="secondary"
            size="lg"
            disabled={disabled || maxBet < minBet}
            data-testid="button-call"
            className="min-w-[120px] bg-accent hover:bg-accent/90"
          >
            Call ${minBet}
          </Button>
        )}
        
        <Button
          onClick={() => onBet(betAmount)}
          variant="default"
          size="lg"
          disabled={disabled || maxBet < minBet}
          data-testid="button-bet"
          className="min-w-[120px] bg-poker-chipGold text-black hover:bg-poker-chipGold/90 font-bold"
        >
          Bet ${betAmount}
        </Button>
      </div>

      {maxBet >= minBet && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Bet Amount:</span>
            <span className="font-mono font-bold text-poker-chipGold" data-testid="text-bet-amount">
              ${betAmount}
            </span>
          </div>
          <Slider
            value={[betAmount]}
            onValueChange={handleBetChange}
            min={minBet}
            max={maxBet}
            step={10}
            disabled={disabled}
            data-testid="slider-bet"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>${minBet}</span>
            <span>${maxBet}</span>
          </div>
        </div>
      )}
    </div>
  );
}
