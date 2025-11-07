import { GameState } from "@shared/schema";
import { BarChart, Trophy, Percent } from "lucide-react";

interface SessionStatsProps {
  stats: GameState['sessionStats'];
}

export function SessionStats({ stats }: SessionStatsProps) {
  const winRate = stats.handsPlayed > 0 ? Math.round((stats.handsWonByPlayer / stats.handsPlayed) * 100) : 0;

  return (
    <div className="glass-info-panel glass-float mt-4 text-white">
      <h3 className="text-md font-bold mb-2 text-center gradient-text">Session Stats</h3>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <BarChart className="h-4 w-4 text-poker-chipGold" />
            Hands Played
          </span>
          <span className="font-bold">{stats.handsPlayed}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-poker-chipGold" />
            Hands Won
          </span>
          <span className="font-bold">{stats.handsWonByPlayer}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Percent className="h-4 w-4 text-poker-chipGold" />
            Win Rate
          </span>
          <span className="font-bold">{winRate}%</span>
        </div>
      </div>
    </div>
  );
}
