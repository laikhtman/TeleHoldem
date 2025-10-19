import { Player } from "@shared/schema";
import { motion } from "framer-motion";
import { Trophy, Star } from "lucide-react";

interface PlayerStatsProps {
  player: Player;
}

export function PlayerStats({ player }: PlayerStatsProps) {
  return (
    <motion.div
      className="absolute bottom-full mb-2 w-48 rounded-lg bg-black/80 p-3 text-white shadow-lg backdrop-blur-sm"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-poker-chipGold" />
            Hands Won
          </span>
          <span className="font-bold">{player.stats.handsWon}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-poker-chipGold" />
            Biggest Pot
          </span>
          <span className="font-bold">${player.stats.biggestPot}</span>
        </div>
      </div>
    </motion.div>
  );
}
