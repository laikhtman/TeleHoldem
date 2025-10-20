import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  verifyTelegramWebAppData, 
  normalizeTelegramUser, 
  generateSessionToken,
  getSessionExpiry 
} from "./telegram";
import type { TelegramUser } from "@shared/schema";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TelegramUser;
    }
  }
}

// Middleware to check authentication
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const sessionToken = req.cookies['telegram_session'];
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const session = await storage.getSession(sessionToken);
  
  if (!session) {
    res.clearCookie('telegram_session');
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  const user = await storage.getTelegramUser(session.telegramUserId);
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  req.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  // POST /api/telegram/auth - Authenticate with Telegram initData
  app.post('/api/telegram/auth', async (req: Request, res: Response) => {
    try {
      const { initData } = req.body;

      if (!initData) {
        return res.status(400).json({ error: 'initData is required' });
      }

      if (!BOT_TOKEN) {
        console.error('TELEGRAM_BOT_TOKEN not configured');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Verify Telegram data
      const verifiedData = verifyTelegramWebAppData(initData, BOT_TOKEN);
      
      if (!verifiedData) {
        return res.status(401).json({ error: 'Invalid Telegram authentication' });
      }

      // Normalize and upsert user
      const userData = normalizeTelegramUser(verifiedData);
      const user = await storage.upsertTelegramUser(userData);

      // Create session
      const sessionToken = generateSessionToken();
      await storage.createSession({
        telegramUserId: user.id,
        sessionToken,
        expiresAt: getSessionExpiry(),
      });

      // Set HTTP-only cookie
      res.cookie('telegram_session', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          displayName: user.displayName,
          photoUrl: user.photoUrl,
          bankroll: user.bankroll,
          stats: user.stats,
        }
      });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });

  // GET /api/session - Get current user session
  app.get('/api/session', requireAuth, async (req: Request, res: Response) => {
    res.json({ 
      user: {
        id: req.user!.id,
        displayName: req.user!.displayName,
        photoUrl: req.user!.photoUrl,
        bankroll: req.user!.bankroll,
        stats: req.user!.stats,
      }
    });
  });

  // POST /api/logout - Logout and clear session
  app.post('/api/logout', async (req: Request, res: Response) => {
    const sessionToken = req.cookies['telegram_session'];
    
    if (sessionToken) {
      await storage.deleteSession(sessionToken);
    }
    
    res.clearCookie('telegram_session');
    res.json({ success: true });
  });

  // GET /api/users/me/stats - Get current user stats
  app.get('/api/users/me/stats', requireAuth, async (req: Request, res: Response) => {
    res.json({ stats: req.user!.stats });
  });

  // PATCH /api/users/me/stats - Update current user stats
  app.patch('/api/users/me/stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const { stats } = req.body;
      
      if (!stats) {
        return res.status(400).json({ error: 'stats is required' });
      }

      const updated = await storage.updateTelegramUserStats(req.user!.id, stats);
      
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ stats: updated.stats });
    } catch (error) {
      console.error('Stats update error:', error);
      res.status(500).json({ error: 'Failed to update stats' });
    }
  });

  // PATCH /api/users/me/bankroll - Update current user bankroll
  app.patch('/api/users/me/bankroll', requireAuth, async (req: Request, res: Response) => {
    try {
      const { bankroll } = req.body;
      
      if (typeof bankroll !== 'number') {
        return res.status(400).json({ error: 'bankroll must be a number' });
      }

      const updated = await storage.updateTelegramUserBankroll(req.user!.id, bankroll);
      
      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ bankroll: updated.bankroll });
    } catch (error) {
      console.error('Bankroll update error:', error);
      res.status(500).json({ error: 'Failed to update bankroll' });
    }
  });

  // GET /api/settings - Get all application settings
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      res.json({ settings });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ error: 'Failed to get settings' });
    }
  });

  // GET /api/settings/:key - Get specific setting by key
  app.get('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }

      res.json({ setting });
    } catch (error) {
      console.error('Get setting error:', error);
      res.status(500).json({ error: 'Failed to get setting' });
    }
  });

  // PUT /api/settings/:key - Upsert a setting
  app.put('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, description } = req.body;
      
      if (value === undefined) {
        return res.status(400).json({ error: 'value is required' });
      }

      const setting = await storage.upsertSetting({
        key,
        value,
        description: description || null,
      });

      res.json({ setting });
    } catch (error) {
      console.error('Upsert setting error:', error);
      res.status(500).json({ error: 'Failed to save setting' });
    }
  });

  // DELETE /api/settings/:key - Delete a setting
  app.delete('/api/settings/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      await storage.deleteSetting(key);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete setting error:', error);
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  });

  // GET /api/system/status - Get system status (integrations, environment)
  app.get('/api/system/status', async (req: Request, res: Response) => {
    try {
      const status = {
        database: {
          connected: true,
          type: 'PostgreSQL',
        },
        telegram: {
          configured: !!BOT_TOKEN,
          botTokenPresent: !!BOT_TOKEN,
        },
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
      };
      res.json(status);
    } catch (error) {
      console.error('System status error:', error);
      res.status(500).json({ error: 'Failed to get system status' });
    }
  });

  // Cleanup expired sessions periodically
  setInterval(() => {
    storage.deleteExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000); // Every hour

  const httpServer = createServer(app);

  return httpServer;
}
