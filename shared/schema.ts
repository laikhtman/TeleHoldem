import { z } from "zod";

// Card suits and ranks
export const SUITS = ['♠', '♥', '♦', '♣'] as const;
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof SUITS[number];
export type Rank = typeof RANKS[number];

// Card interface
export interface Card {
  rank: Rank;
  suit: Suit;
  id: string;
}

// Player action types
export type PlayerAction = 'fold' | 'check' | 'call' | 'bet' | 'raise' | 'all-in';

// Player interface
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
}

// Game phases
export type GamePhase = 'waiting' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

// Hand rankings
export type HandRank = 
  | 'high-card'
  | 'pair'
  | 'two-pair'
  | 'three-of-a-kind'
  | 'straight'
  | 'flush'
  | 'full-house'
  | 'four-of-a-kind'
  | 'straight-flush'
  | 'royal-flush';

// Game state interface
export interface GameState {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pots: { amount: number; eligiblePlayerIds: string[] }[];
  currentPlayerIndex: number;
  dealerIndex: number;
  phase: GamePhase;
  currentBet: number;
  lastAction: string | null;
}

// Bot action result
export interface BotAction {
  action: PlayerAction;
  amount?: number;
}

// Helper function to get card color
export function getCardColor(suit: Suit): 'red' | 'black' {
  return suit === '♥' || suit === '♦' ? 'red' : 'black';
}

// Helper function to get rank value for comparison
export function getRankValue(rank: Rank): number {
  const values: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
  };
  return values[rank];
}
