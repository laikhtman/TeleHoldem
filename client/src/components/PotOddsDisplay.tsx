import { calculatePotOdds } from '@/lib/potOddsCalculator';
import { Badge } from './ui/badge';

interface PotOddsDisplayProps {
  amountToCall: number;
  potSize: number;
}

export function PotOddsDisplay({ amountToCall, potSize }: PotOddsDisplayProps) {
  const potOdds = calculatePotOdds(amountToCall, potSize);

  if (potOdds <= 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg bg-black/70 p-3 text-white">
      <div className="text-sm font-semibold">Pot Odds</div>
      <Badge variant="secondary" className="text-lg">
        {potOdds}%
      </Badge>
      <p className="text-xs text-center text-gray-400">
        You need to call ${amountToCall} to win a pot of ${potSize + amountToCall}.
      </p>
    </div>
  );
}
