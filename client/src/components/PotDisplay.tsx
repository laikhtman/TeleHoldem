import { Coins } from 'lucide-react';

interface PotDisplayProps {
  amount: number;
}

export function PotDisplay({ amount }: PotDisplayProps) {
  return (
    <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 z-15">
      <div className="bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg border border-poker-chipGold/40 shadow-lg">
        <div className="flex items-center gap-2">
          <Coins className="w-6 h-6 text-poker-chipGold" />
          <div>
            <div className="text-xs text-muted-foreground">Pot</div>
            <div className="text-2xl font-bold font-mono text-poker-chipGold" data-testid="pot-amount">
              ${amount}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
