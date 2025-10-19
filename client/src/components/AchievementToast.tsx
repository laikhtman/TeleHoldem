import { Trophy } from 'lucide-react';
import { Achievement } from '@shared/schema';

interface AchievementToastProps {
  achievement: Achievement;
}

export function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <div className="flex items-center gap-4">
      <Trophy className="w-12 h-12 text-poker-chipGold" />
      <div className="flex flex-col">
        <span className="font-bold text-lg">Achievement Unlocked!</span>
        <span className="text-poker-chipGold">{achievement.name}</span>
        <span className="text-sm text-gray-400">{achievement.description}</span>
      </div>
    </div>
  );
}
