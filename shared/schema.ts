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
