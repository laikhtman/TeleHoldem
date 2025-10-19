// Integration reference: blueprint:javascript_database
import { 
  telegramUsers, 
  sessions,
  type TelegramUser, 
  type InsertTelegramUser,
  type Session,
  type InsertSession 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lt } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
