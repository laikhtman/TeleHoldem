// Integration reference: blueprint:javascript_database
import { 
  telegramUsers, 
  sessions,
  appSettings,
  pokerTables,
  tablePlayers,
  type TelegramUser, 
  type InsertTelegramUser,
  type Session,
  type InsertSession,
  type AppSetting,
  type InsertAppSetting,
  type PokerTable,
  type InsertPokerTable,
  type TablePlayer,
  type InsertTablePlayer,
  type GameState
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt, gt, isNull, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Telegram Users
  getTelegramUser(id: number): Promise<TelegramUser | undefined>;
  getTelegramUserByTelegramId(telegramId: string): Promise<TelegramUser | undefined>;
  upsertTelegramUser(user: InsertTelegramUser): Promise<TelegramUser>;
  updateTelegramUserStats(id: number, stats: TelegramUser['stats']): Promise<TelegramUser | undefined>;
  updateTelegramUserBankroll(id: number, bankroll: number): Promise<TelegramUser | undefined>;
  
  // Sessions
  createSession(session: InsertSession): Promise<Session>;
  getSession(sessionToken: string): Promise<Session | undefined>;
  deleteSession(sessionToken: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;
  
  // App Settings
  getSetting(key: string): Promise<AppSetting | undefined>;
  getAllSettings(): Promise<AppSetting[]>;
  upsertSetting(setting: InsertAppSetting): Promise<AppSetting>;
  deleteSetting(key: string): Promise<void>;
  
  // Poker Tables
  createPokerTable(table: InsertPokerTable): Promise<PokerTable>;
  getPokerTable(id: number): Promise<PokerTable | undefined>;
  getActivePokerTables(): Promise<PokerTable[]>;
  updatePokerTable(id: number, updates: Partial<PokerTable>): Promise<PokerTable | undefined>;
  updatePokerTableGameState(id: number, gameState: GameState): Promise<PokerTable | undefined>;
  deletePokerTable(id: number): Promise<void>;
  
  // Table Players
  addPlayerToTable(player: InsertTablePlayer): Promise<TablePlayer>;
  removePlayerFromTable(tableId: number, playerId: number): Promise<void>;
  getTablePlayers(tableId: number): Promise<TablePlayer[]>;
  getPlayerAtTable(tableId: number, playerId: number): Promise<TablePlayer | undefined>;
  updateTablePlayer(id: number, updates: Partial<TablePlayer>): Promise<TablePlayer | undefined>;
  getPlayerActiveTables(playerId: number): Promise<PokerTable[]>;
}

export class DatabaseStorage implements IStorage {
  // Telegram Users
  async getTelegramUser(id: number): Promise<TelegramUser | undefined> {
    const [user] = await db.select().from(telegramUsers).where(eq(telegramUsers.id, id));
    return user || undefined;
  }

  async getTelegramUserByTelegramId(telegramId: string): Promise<TelegramUser | undefined> {
    const [user] = await db.select().from(telegramUsers).where(eq(telegramUsers.telegramId, telegramId));
    return user || undefined;
  }

  async upsertTelegramUser(user: InsertTelegramUser): Promise<TelegramUser> {
    const existing = await this.getTelegramUserByTelegramId(user.telegramId);
    
    if (existing) {
      // Update existing user
      const [updated] = await db
        .update(telegramUsers)
        .set({
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          photoUrl: user.photoUrl,
          languageCode: user.languageCode,
          displayName: user.displayName,
          authDate: user.authDate,
          updatedAt: new Date(),
        })
        .where(eq(telegramUsers.telegramId, user.telegramId))
        .returning();
      return updated;
    } else {
      // Create new user
      const [created] = await db
        .insert(telegramUsers)
        .values([user as any])
        .returning();
      return created;
    }
  }

  async updateTelegramUserStats(id: number, stats: TelegramUser['stats']): Promise<TelegramUser | undefined> {
    const [updated] = await db
      .update(telegramUsers)
      .set({ 
        stats,
        updatedAt: new Date(),
      })
      .where(eq(telegramUsers.id, id))
      .returning();
    return updated || undefined;
  }

  async updateTelegramUserBankroll(id: number, bankroll: number): Promise<TelegramUser | undefined> {
    const [updated] = await db
      .update(telegramUsers)
      .set({ 
        bankroll,
        updatedAt: new Date(),
      })
      .where(eq(telegramUsers.id, id))
      .returning();
    return updated || undefined;
  }

  // Sessions
  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await db
      .insert(sessions)
      .values(session)
      .returning();
    return created;
  }

  async getSession(sessionToken: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          gt(sessions.expiresAt, new Date())
        )
      );
    return session || undefined;
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await db
      .delete(sessions)
      .where(eq(sessions.sessionToken, sessionToken));
  }

  async deleteExpiredSessions(): Promise<void> {
    await db
      .delete(sessions)
      .where(lt(sessions.expiresAt, new Date()));
  }

  // App Settings
  async getSetting(key: string): Promise<AppSetting | undefined> {
    const [setting] = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.key, key));
    return setting || undefined;
  }

  async getAllSettings(): Promise<AppSetting[]> {
    return await db.select().from(appSettings);
  }

  async upsertSetting(setting: InsertAppSetting): Promise<AppSetting> {
    const existing = await this.getSetting(setting.key);
    
    if (existing) {
      // Update existing setting
      const [updated] = await db
        .update(appSettings)
        .set({
          value: setting.value,
          description: setting.description,
          updatedAt: new Date(),
        })
        .where(eq(appSettings.key, setting.key))
        .returning();
      return updated;
    } else {
      // Create new setting
      const [created] = await db
        .insert(appSettings)
        .values(setting)
        .returning();
      return created;
    }
  }

  async deleteSetting(key: string): Promise<void> {
    await db
      .delete(appSettings)
      .where(eq(appSettings.key, key));
  }

  // Poker Tables
  async createPokerTable(table: InsertPokerTable): Promise<PokerTable> {
    const [created] = await db
      .insert(pokerTables)
      .values([table])
      .returning();
    return created;
  }

  async getPokerTable(id: number): Promise<PokerTable | undefined> {
    const [table] = await db
      .select()
      .from(pokerTables)
      .where(eq(pokerTables.id, id));
    return table || undefined;
  }

  async getActivePokerTables(): Promise<PokerTable[]> {
    return await db
      .select()
      .from(pokerTables)
      .where(eq(pokerTables.isActive, true))
      .orderBy(desc(pokerTables.createdAt));
  }

  async updatePokerTable(id: number, updates: Partial<PokerTable>): Promise<PokerTable | undefined> {
    const [updated] = await db
      .update(pokerTables)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(pokerTables.id, id))
      .returning();
    return updated || undefined;
  }

  async updatePokerTableGameState(id: number, gameState: GameState): Promise<PokerTable | undefined> {
    const [updated] = await db
      .update(pokerTables)
      .set({
        gameState,
        updatedAt: new Date(),
      })
      .where(eq(pokerTables.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePokerTable(id: number): Promise<void> {
    await db
      .delete(pokerTables)
      .where(eq(pokerTables.id, id));
  }

  // Table Players
  async addPlayerToTable(player: InsertTablePlayer): Promise<TablePlayer> {
    const [created] = await db
      .insert(tablePlayers)
      .values([player])
      .returning();
    
    // Update player count in the poker table
    await db
      .update(pokerTables)
      .set({
        currentPlayers: sql`${pokerTables.currentPlayers} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(pokerTables.id, player.tableId));
    
    return created;
  }

  async removePlayerFromTable(tableId: number, playerId: number): Promise<void> {
    // Mark player as inactive and set left time
    await db
      .update(tablePlayers)
      .set({
        isActive: false,
        leftAt: new Date(),
      })
      .where(
        and(
          eq(tablePlayers.tableId, tableId),
          eq(tablePlayers.playerId, playerId),
          eq(tablePlayers.isActive, true)
        )
      );
    
    // Update player count in the poker table
    await db
      .update(pokerTables)
      .set({
        currentPlayers: sql`GREATEST(${pokerTables.currentPlayers} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(pokerTables.id, tableId));
  }

  async getTablePlayers(tableId: number): Promise<TablePlayer[]> {
    return await db
      .select()
      .from(tablePlayers)
      .where(
        and(
          eq(tablePlayers.tableId, tableId),
          eq(tablePlayers.isActive, true)
        )
      );
  }

  async getPlayerAtTable(tableId: number, playerId: number): Promise<TablePlayer | undefined> {
    const [player] = await db
      .select()
      .from(tablePlayers)
      .where(
        and(
          eq(tablePlayers.tableId, tableId),
          eq(tablePlayers.playerId, playerId),
          eq(tablePlayers.isActive, true)
        )
      );
    return player || undefined;
  }

  async updateTablePlayer(id: number, updates: Partial<TablePlayer>): Promise<TablePlayer | undefined> {
    const [updated] = await db
      .update(tablePlayers)
      .set(updates)
      .where(eq(tablePlayers.id, id))
      .returning();
    return updated || undefined;
  }

  async getPlayerActiveTables(playerId: number): Promise<PokerTable[]> {
    const result = await db
      .select({ table: pokerTables })
      .from(tablePlayers)
      .innerJoin(pokerTables, eq(tablePlayers.tableId, pokerTables.id))
      .where(
        and(
          eq(tablePlayers.playerId, playerId),
          eq(tablePlayers.isActive, true),
          eq(pokerTables.isActive, true)
        )
      );
    
    return result.map(r => r.table);
  }
}

export const storage = new DatabaseStorage();
