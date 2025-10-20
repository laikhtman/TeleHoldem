import { GameState } from "@shared/schema";
import { Coins, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MobileStatsCompactProps {
  stats: GameState['sessionStats'];
  currentChips: number;
}

export function MobileStatsCompact({ stats, currentChips }: MobileStatsCompactProps) {
  const winRate = stats.handsPlayed > 0 
    ? Math.round((stats.handsWonByPlayer / stats.handsPlayed) * 100) 
    : 0;

  const statCards = [
    {
      icon: Coins,
      label: "Current Chips",
      value: `$${currentChips.toLocaleString()}`,
      color: "text-poker-chipGold",
      testId: "stat-current-chips"
    },
    {
      icon: Users,
      label: "Hands Played",
      value: stats.handsPlayed.toString(),
      color: "text-blue-400",
      testId: "stat-hands-played"
    },
    {
      icon: TrendingUp,
      label: "Win Rate",
      value: `${winRate}%`,
      color: winRate >= 50 ? "text-green-400" : "text-orange-400",
      testId: "stat-win-rate"
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-center text-foreground">
        Essential Stats
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {statCards.map(({ icon: Icon, label, value, color, testId }) => (
          <Card 
            key={label}
            className="p-4 bg-card/80 backdrop-blur-sm border-card-border"
            data-testid={testId}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-background/50 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-base font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
              <span className={`text-2xl font-bold ${color}`}>
                {value}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {stats.handsPlayed === 0 && (
        <p className="text-sm text-center text-muted-foreground mt-4">
          Start playing to track your performance!
        </p>
      )}
    </div>
  );
}
