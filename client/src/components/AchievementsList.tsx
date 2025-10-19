import { Achievement, ACHIEVEMENT_LIST } from '@shared/schema';
import { Award, CheckCircle } from 'lucide-react';

interface AchievementsListProps {
  achievements: Record<string, Achievement>;
}

export function AchievementsList({ achievements }: AchievementsListProps) {
  return (
    <div className="rounded-lg bg-black/70 p-3 text-white mt-4">
      <h3 className="text-md font-bold mb-2 text-center">Achievements</h3>
      <div className="flex flex-col gap-2">
        {Object.values(ACHIEVEMENT_LIST).map(ach => {
          const isUnlocked = achievements[ach.id]?.unlockedAt;
          return (
            <div key={ach.id} className={`flex items-start gap-2 p-2 rounded-md ${isUnlocked ? 'bg-poker-chipGold/20' : 'bg-black/30'}`}>
              <div className="mt-1">
                {isUnlocked ? (
                  <CheckCircle className="w-5 h-5 text-poker-chipGold" />
                ) : (
                  <Award className="w-5 h-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-bold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>{ach.name}</p>
                <p className="text-xs text-gray-400">{ach.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
