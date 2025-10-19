import { GameState, AchievementId, ACHIEVEMENT_LIST } from '@shared/schema';

export const achievementEngine = {
  checkAchievements(gameState: GameState, winningHand: string, winAmount: number): {
    newState: GameState;
    unlockedAchievements: AchievementId[];
  } {
    const unlockedAchievements: AchievementId[] = [];
    const achievements = { ...gameState.achievements };

    const unlock = (id: AchievementId) => {
      if (!achievements[id]?.unlockedAt) {
        achievements[id] = { ...ACHIEVEMENT_LIST[id], unlockedAt: Date.now() };
        unlockedAchievements.push(id);
      }
    };

    // Check for FIRST_WIN
    if (gameState.sessionStats.handsWonByPlayer === 1) {
      unlock('FIRST_WIN');
    }

    // Check for TEN_WINS
    if (gameState.sessionStats.handsWonByPlayer >= 10) {
      unlock('TEN_WINS');
    }

    // Check for BIG_POT
    if (winAmount >= 500) {
      unlock('BIG_POT');
    }

    // Check for hand-specific wins
    if (winningHand === 'Flush') {
      unlock('FLUSH_WIN');
    }
    if (winningHand === 'Full House') {
      unlock('FULL_HOUSE_WIN');
    }

    return {
      newState: { ...gameState, achievements },
      unlockedAchievements,
    };
  },
};
