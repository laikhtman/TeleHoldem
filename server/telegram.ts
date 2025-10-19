import crypto from 'crypto';
import type { InsertTelegramUser } from '@shared/schema';

export interface TelegramInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    photo_url?: string;
  };
  auth_date: number;
  hash: string;
  [key: string]: any;
}

/**
 * Verify Telegram Web App init data
 * Uses HMAC-SHA256 to validate data from Telegram
 * @param initData - Raw initData string from Telegram WebApp
 * @param botToken - Telegram Bot Token from environment
 * @returns Parsed and verified init data or null if invalid
 */
export function verifyTelegramWebAppData(
  initData: string,
  botToken: string
): TelegramInitData | null {
  try {
    const parsed = new URLSearchParams(initData);
    const hash = parsed.get('hash');
    
    if (!hash) {
      console.error('Missing hash in initData');
      return null;
    }

    // Remove hash from params for verification
    parsed.delete('hash');
    
    // Create data check string
    const dataCheckArr: string[] = [];
    for (const [key, value] of parsed.entries()) {
      dataCheckArr.push(`${key}=${value}`);
    }
    dataCheckArr.sort();
    const dataCheckString = dataCheckArr.join('\n');

    // Create secret key using bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Verify hash matches
    if (expectedHash !== hash) {
      console.error('Invalid hash - authentication failed');
      return null;
    }

    // Parse user data
    const userStr = parsed.get('user');
    const authDateStr = parsed.get('auth_date');
    
    if (!userStr || !authDateStr) {
      console.error('Missing required fields');
      return null;
    }

    const user = JSON.parse(userStr);
    const authDate = parseInt(authDateStr, 10);

    // Check auth_date is not too old (e.g., within last hour)
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 3600) {
      console.error('Auth date too old');
      return null;
    }

    return {
      query_id: parsed.get('query_id') || undefined,
      user,
      auth_date: authDate,
      hash,
    };
  } catch (error) {
    console.error('Error verifying Telegram data:', error);
    return null;
  }
}

/**
 * Normalize Telegram user data to InsertTelegramUser format
 * @param initData - Verified init data from Telegram
 * @returns User object ready for database insertion
 */
export function normalizeTelegramUser(initData: TelegramInitData): InsertTelegramUser {
  const { user, auth_date } = initData;
  
  if (!user) {
    throw new Error('User data missing from initData');
  }

  const displayName = user.username || user.first_name || `User${user.id}`;

  return {
    telegramId: user.id.toString(),
    username: user.username || null,
    firstName: user.first_name,
    lastName: user.last_name || null,
    photoUrl: user.photo_url || null,
    languageCode: user.language_code || null,
    displayName,
    authDate: new Date(auth_date * 1000),
  };
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate session expiry date (7 days from now)
 */
export function getSessionExpiry(): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
}
