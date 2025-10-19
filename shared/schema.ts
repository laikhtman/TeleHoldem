import { z } from 'zod';

export const SUITS = ['H', 'D', 'C', 'S'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];

export type HandRank = 
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-card';

export function getRankValue(rank: Rank): number {
  const rankMap: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return rankMap[rank];
}

export function getCardColor(suit: Suit): 'red' | 'black' {
  return suit === 'H' || suit === 'D' ? 'red' : 'black';
}

export const ACHIEVEMENT_LIST = {
  FIRST_WIN: { id: 'FIRST_WIN', name: 'First Win', description: 'Win your first hand.' },
  TEN_WINS: { id: 'TEN_WINS', name: 'Novice Gambler', description: 'Win 10 hands.' },
  BIG_POT: { id: 'BIG_POT', name: 'High Roller', description: 'Win a pot over $500.' },
  FLUSH_WIN: { id: 'FLUSH_WIN', name: 'Seeing Red (or Black)', description: 'Win a hand with a Flush.' },
  FULL_HOUSE_WIN: { id: 'FULL_HOUSE_WIN', name: 'Full Boat', description: 'Win a hand with a Full House.' },
} as const;

export type AchievementId = keyof typeof ACHIEVEMENT_LIST;

export interface Achievement {
  id: AchievementId;
  name: string;
  description: string;
  unlockedAt?: number;
}

export interface Card {
  rank: Rank;
  suit: Suit;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  hand: Card[];
  bet: number;
  folded: boolean;
  allIn: boolean;
  isHuman: boolean;
  position: number;
  stats: {
    handsWon: number;
    biggestPot: number;
  };
}

export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface Pot {
  amount: number;
  eligiblePlayerIds: string[];
}

export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise';

export interface ActionHistoryEntry {
  id: string;
  type: 'player-action' | 'phase-change' | 'cards-dealt' | 'pot-award' | 'blinds-posted';
  playerName?: string;
  action?: PlayerAction;
  amount?: number;
  phase: GamePhase;
  timestamp: number;
  message: string;
}

export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pots: Pot[];
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  currentBet: number;
  lastAction: string | null;
  actionHistory: ActionHistoryEntry[];
  roundActionCount: number;
  sessionStats: {
    handsPlayed: number;
    handsWonByPlayer: number;
    handDistribution: Record<string, number>;
  };
  achievements: Record<AchievementId, Achievement>;
}
