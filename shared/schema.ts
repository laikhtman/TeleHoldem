import { z } from 'zod';
import { pgTable, serial, varchar, timestamp, integer, json, boolean, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { sql } from 'drizzle-orm';

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

// Difficulty System Types
export type DifficultyLevel = 'easy' | 'normal' | 'hard' | 'expert';
export type DifficultyMode = 'auto' | DifficultyLevel;

export interface DifficultySettings {
  mode: DifficultyMode;
  currentLevel: DifficultyLevel; // Current level when in auto mode
  multiplier: number; // Current difficulty multiplier
}

export interface PerformanceMetrics {
  recentHands: Array<{
    handId: string;
    won: boolean;
    potSize: number;
    timestamp: number;
  }>;
  bankrollHistory: Array<{
    amount: number;
    timestamp: number;
  }>;
  winRate: number; // Calculated win rate over recent hands
  bankrollTrend: 'up' | 'down' | 'stable';
  consecutiveWins: number; // Track consecutive wins for rubber-band difficulty
  consecutiveLosses: number; // Track consecutive losses for rubber-band difficulty
  averagePotWin: number; // Average pot size when winning
  lastDifficultyAdjustment: number; // Timestamp of last difficulty change
}

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

export interface PlayerTendencies {
  totalActions: number;
  foldCount: number;
  callCount: number;
  checkCount: number;
  betCount: number;
  raiseCount: number;
  foldToBetFrequency: number; // Percentage of times player folded when facing a bet
  callToBetFrequency: number; // Percentage of times player called when facing a bet
  raiseToBetFrequency: number; // Percentage of times player raised when facing a bet
  aggressionFactor: number; // (bets + raises) / calls
  vpip: number; // Voluntarily put in pot percentage
  pfr: number; // Pre-flop raise percentage
  wtsd: number; // Went to showdown percentage
  showdownWinRate: number; // Win rate when going to showdown
  recentActions: PlayerAction[]; // Last 20 actions for pattern detection
  streetAggression: {
    preFlop: number;
    flop: number;
    turn: number;
    river: number;
  };
}

// Table Image Types for Meta-Game
export type PlayerStyle = 'TAG' | 'LAG' | 'TP' | 'LP' | 'MANIAC' | 'NIT' | 'ROCK' | 'STATION' | 'UNKNOWN';
export type TightnessLevel = 'very-tight' | 'tight' | 'neutral' | 'loose' | 'very-loose';
export type AggressionLevel = 'very-passive' | 'passive' | 'neutral' | 'aggressive' | 'very-aggressive';

export interface TableImage {
  playerId: string;
  playerName: string;
  style: PlayerStyle;
  tightness: TightnessLevel;
  aggression: AggressionLevel;
  vpip: number; // Voluntarily Put In Pot %
  pfr: number; // Pre-Flop Raise %
  threeBetFrequency: number; // 3-bet frequency
  cBetFrequency: number; // Continuation bet frequency
  foldToThreeBet: number; // Fold to 3-bet frequency
  wtsd: number; // Went to showdown %
  handsSeen: number; // Total hands played together
  lastUpdated: number; // Timestamp of last update
  recentHandsWeight: number; // Weight for recent hands (0-1)
  // Pattern tracking
  blindStealAttempts: number;
  blindDefenseRate: number;
  isolationRaiseFrequency: number;
  checkRaiseFrequency: number;
  floatFrequency: number; // Call in position with weak hand
  // Exploit tracking
  exploitablePatterns: string[]; // List of identified patterns
  adjustmentsMade: string[]; // List of counter-adjustments
}

export interface BotMemory {
  // Bot-to-bot history tracking
  playerHistories: Map<string, {
    encounters: number;
    lastPlayed: number;
    observedActions: PlayerAction[];
    successfulBluffs: number;
    caughtBluffing: number;
    showdownsWon: number;
    showdownsLost: number;
    moneyWon: number;
    moneyLost: number;
  }>;
  // Pattern recognition
  identifiedPatterns: Map<string, {
    pattern: string;
    confidence: number;
    lastSeen: number;
    frequency: number;
  }>;
  // Table dynamics awareness
  tableAggression: number; // Overall table aggression level (0-1)
  averagePotSize: number;
  tableCaptain: string | null; // Most aggressive player ID
  scaredMoney: boolean; // Table playing scared
  // Self-awareness
  myTableImage: TableImage | null; // How others perceive this bot
  currentStrategy: string; // Current strategic approach
  strategyShiftTimer: number; // When to shift strategy
}

export interface TableDynamics {
  overallAggression: number; // 0-1 scale
  averagePotSize: number;
  averageVPIP: number;
  averagePFR: number;
  tableTightness: 'very-tight' | 'tight' | 'normal' | 'loose' | 'very-loose';
  tableFlow: 'passive' | 'normal' | 'aggressive' | 'maniac';
  tableCaptains: string[]; // IDs of most aggressive players
  weakPlayers: string[]; // IDs of exploitable players
  recentBigPots: Array<{
    amount: number;
    winner: string;
    timestamp: number;
  }>;
  momentum: 'building' | 'steady' | 'cooling'; // Table temperature
}

export interface MetaGameData {
  tableImages: Map<string, TableImage>; // Player ID -> Table Image
  botMemories: Map<string, BotMemory>; // Bot ID -> Memory
  tableDynamics: TableDynamics;
  handCounter: number; // Total hands at this table
  lastDynamicsUpdate: number; // Timestamp
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
  difficultySettings?: DifficultySettings;
  performanceMetrics?: PerformanceMetrics;
  playerTendencies?: PlayerTendencies; // Track human player tendencies
  metaGameData?: MetaGameData; // Meta-game and table image tracking
  gameOver?: boolean; // Indicates when human player is eliminated
}

// Database Tables

// Telegram Users Table
export const telegramUsers = pgTable('telegram_users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  photoUrl: text('photo_url'),
  languageCode: varchar('language_code', { length: 10 }),
  displayName: varchar('display_name', { length: 255 }).notNull(),
  bankroll: integer('bankroll').notNull().default(1000),
  stats: json('stats').$type<{
    handsPlayed: number;
    handsWon: number;
    biggestPot: number;
    totalWinnings: number;
    achievements: AchievementId[];
  }>().notNull().default(sql`'{
    "handsPlayed": 0,
    "handsWon": 0,
    "biggestPot": 0,
    "totalWinnings": 0,
    "achievements": []
  }'::json`),
  authDate: timestamp('auth_date').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sessions Table
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  telegramUserId: integer('telegram_user_id').notNull().references(() => telegramUsers.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Application Settings Table
export const appSettings = pgTable('app_settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 255 }).notNull().unique(),
  value: json('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Poker Tables Table
export const pokerTables = pgTable('poker_tables', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  smallBlind: integer('small_blind').notNull().default(10),
  bigBlind: integer('big_blind').notNull().default(20),
  minBuyIn: integer('min_buy_in').notNull().default(200),
  maxBuyIn: integer('max_buy_in').notNull().default(1000),
  maxPlayers: integer('max_players').notNull().default(6),
  currentPlayers: integer('current_players').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  gameState: json('game_state').$type<GameState>(),
  createdBy: integer('created_by').references(() => telegramUsers.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Table Players Join Table
export const tablePlayers = pgTable('table_players', {
  id: serial('id').primaryKey(),
  tableId: integer('table_id').notNull().references(() => pokerTables.id, { onDelete: 'cascade' }),
  playerId: integer('player_id'), // Nullable for demo/anonymous players, removed FK constraint
  seatNumber: integer('seat_number').notNull(),
  buyInAmount: integer('buy_in_amount').notNull(),
  currentChips: integer('current_chips').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
  leftAt: timestamp('left_at'),
});

// Tournament Types
export type TournamentType = 'sit_and_go' | 'multi_table' | 'scheduled';
export type TournamentStatus = 'pending' | 'registering' | 'running' | 'completed' | 'cancelled';
export type TournamentPlayerStatus = 'registered' | 'playing' | 'eliminated';
export type TournamentTableStatus = 'waiting' | 'active' | 'finished';

export interface BlindLevel {
  level: number;
  duration: number;
  smallBlind: number;
  bigBlind: number;
  ante?: number;
}

export interface PayoutPosition {
  position: number;
  percentage: number;
}

// Tournaments Table
export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).$type<TournamentType>().notNull(),
  status: varchar('status', { length: 50 }).$type<TournamentStatus>().notNull(),
  buyIn: integer('buy_in').notNull(),
  maxPlayers: integer('max_players').notNull(),
  currentPlayers: integer('current_players').notNull().default(0),
  startingChips: integer('starting_chips').notNull(),
  prizePool: integer('prize_pool').notNull().default(0),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  blindStructure: json('blind_structure').$type<BlindLevel[]>().notNull(),
  payoutStructure: json('payout_structure').$type<PayoutPosition[]>().notNull(),
});

// Tournament Players Table
export const tournamentPlayers = pgTable('tournament_players', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  userId: integer('user_id'),
  playerName: varchar('player_name', { length: 255 }).notNull(),
  position: integer('position'),
  chipCount: integer('chip_count').notNull(),
  status: varchar('status', { length: 50 }).$type<TournamentPlayerStatus>().notNull(),
  eliminatedAt: timestamp('eliminated_at'),
  winnings: integer('winnings').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Tournament Tables Table
export const tournamentTables = pgTable('tournament_tables', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),
  tableNumber: integer('table_number').notNull(),
  gameState: json('game_state').$type<GameState>(),
  playerSeats: json('player_seats').$type<Record<number, string>>().notNull(),
  status: varchar('status', { length: 50 }).$type<TournamentTableStatus>().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod Schemas and Types
export const insertTelegramUserSchema = createInsertSchema(telegramUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectTelegramUserSchema = createSelectSchema(telegramUsers);

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const selectSessionSchema = createSelectSchema(sessions);

export type TelegramUser = typeof telegramUsers.$inferSelect;
export type InsertTelegramUser = z.infer<typeof insertTelegramUserSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

export const insertAppSettingSchema = createInsertSchema(appSettings).omit({
  id: true,
  updatedAt: true,
});

export const selectAppSettingSchema = createSelectSchema(appSettings);

export type AppSetting = typeof appSettings.$inferSelect;
export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;

// Poker Tables Schemas and Types
export const insertPokerTableSchema = createInsertSchema(pokerTables).omit({
  id: true,
  currentPlayers: true,
  createdAt: true,
  updatedAt: true,
});

export const selectPokerTableSchema = createSelectSchema(pokerTables);

export type PokerTable = typeof pokerTables.$inferSelect;
export type InsertPokerTable = z.infer<typeof insertPokerTableSchema>;

// Table Players Schemas and Types
export const insertTablePlayerSchema = createInsertSchema(tablePlayers).omit({
  id: true,
  joinedAt: true,
});

export const selectTablePlayerSchema = createSelectSchema(tablePlayers);

export type TablePlayer = typeof tablePlayers.$inferSelect;
export type InsertTablePlayer = z.infer<typeof insertTablePlayerSchema>;

// Tournament Schemas and Types
export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  currentPlayers: true,
  prizePool: true,
  createdAt: true,
});

export const selectTournamentSchema = createSelectSchema(tournaments);

export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

// Tournament Players Schemas and Types
export const insertTournamentPlayerSchema = createInsertSchema(tournamentPlayers).omit({
  id: true,
  winnings: true,
  createdAt: true,
});

export const selectTournamentPlayerSchema = createSelectSchema(tournamentPlayers);

export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type InsertTournamentPlayer = z.infer<typeof insertTournamentPlayerSchema>;

// Tournament Tables Schemas and Types
export const insertTournamentTableSchema = createInsertSchema(tournamentTables).omit({
  id: true,
  createdAt: true,
});

export const selectTournamentTableSchema = createSelectSchema(tournamentTables);

export type TournamentTable = typeof tournamentTables.$inferSelect;
export type InsertTournamentTable = z.infer<typeof insertTournamentTableSchema>;

// Table Theme System
export type TableTheme = 'green' | 'blue' | 'red' | 'gold' | 'brown' | 'black';

export interface TableThemeConfig {
  name: string;
  feltGradient: {
    from: string;
    to: string;
  };
  trimColor: string;
  glowColor: string;
  accentColor: string;
  shadowColor: string;
}

export const TABLE_THEMES: Record<TableTheme, TableThemeConfig> = {
  green: {
    name: 'Classic Green',
    feltGradient: {
      from: '#1a4d2e', // Deep forest green
      to: '#0d2818'    // Darker forest green
    },
    trimColor: '#10b981',  // Emerald
    glowColor: '#34d399',  // Light emerald
    accentColor: '#22c55e', // Bright green
    shadowColor: 'rgba(16, 185, 129, 0.4)'
  },
  blue: {
    name: 'Ocean Blue',
    feltGradient: {
      from: '#1e3a8a', // Navy blue
      to: '#1e1b4b'    // Midnight blue
    },
    trimColor: '#06b6d4',  // Cyan
    glowColor: '#22d3ee',  // Light cyan
    accentColor: '#0ea5e9', // Electric blue
    shadowColor: 'rgba(6, 182, 212, 0.4)'
  },
  red: {
    name: 'Ruby Red',
    feltGradient: {
      from: '#7f1d1d', // Burgundy
      to: '#450a0a'    // Dark crimson
    },
    trimColor: '#ec4899',  // Hot pink
    glowColor: '#f472b6',  // Light pink
    accentColor: '#ef4444', // Bright red
    shadowColor: 'rgba(236, 72, 153, 0.4)'
  },
  gold: {
    name: 'Royal Gold',
    feltGradient: {
      from: '#78350f', // Bronze
      to: '#451a03'    // Dark amber
    },
    trimColor: '#fbbf24',  // Golden yellow
    glowColor: '#fcd34d',  // Light gold
    accentColor: '#f59e0b', // Bright gold
    shadowColor: 'rgba(251, 191, 36, 0.4)'
  },
  brown: {
    name: 'Mahogany',
    feltGradient: {
      from: '#451a03', // Chocolate
      to: '#1c0a00'    // Espresso
    },
    trimColor: '#fb923c',  // Warm orange
    glowColor: '#fdba74',  // Light orange
    accentColor: '#c2410c', // Burnt sienna
    shadowColor: 'rgba(251, 146, 60, 0.4)'
  },
  black: {
    name: 'Midnight Black',
    feltGradient: {
      from: '#18181b', // Charcoal
      to: '#000000'    // Pure black
    },
    trimColor: '#8b5cf6',  // Purple (current default)
    glowColor: '#a78bfa',  // Light purple
    accentColor: '#ec4899', // Magenta
    shadowColor: 'rgba(139, 92, 246, 0.4)'
  }
};
