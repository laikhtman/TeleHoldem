import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  verifyTelegramWebAppData, 
  normalizeTelegramUser, 
  generateSessionToken,
  getSessionExpiry 
} from "./telegram";
import type { TelegramUser, InsertPokerTable } from "@shared/schema";
import { insertPokerTableSchema } from "@shared/schema";

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

  // GET /api/health - Health check endpoint
  app.get('/api/health', async (req: Request, res: Response) => {
    res.json({ 
      status: 'ok',
      timestamp: Date.now()
    });
  });

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

  // ====== Poker Table Routes ======

  // GET /api/tables - Get all active poker tables
  app.get('/api/tables', async (req: Request, res: Response) => {
    try {
      const tables = await storage.getActivePokerTables();
      res.json({ tables });
    } catch (error) {
      console.error('Get tables error:', error);
      res.status(500).json({ error: 'Failed to get tables' });
    }
  });

  // GET /api/tables/:id - Get specific poker table
  app.get('/api/tables/:id', async (req: Request, res: Response) => {
    try {
      const tableId = parseInt(req.params.id);
      
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Invalid table ID' });
      }
      
      const table = await storage.getPokerTable(tableId);
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      const players = await storage.getTablePlayers(tableId);
      res.json({ table, players });
    } catch (error) {
      console.error('Get table error:', error);
      res.status(500).json({ error: 'Failed to get table' });
    }
  });

  // POST /api/tables - Create new poker table
  app.post('/api/tables', async (req: Request, res: Response) => {
    try {
      // For demo mode, allow table creation without auth
      const isDemo = !req.cookies['telegram_session'];
      
      const tableData = insertPokerTableSchema.parse({
        name: req.body.name,
        smallBlind: req.body.smallBlind,
        bigBlind: req.body.bigBlind,
        minBuyIn: req.body.minBuyIn,
        maxBuyIn: req.body.maxBuyIn,
        maxPlayers: req.body.maxPlayers || 6,
        isActive: true,
        createdBy: !isDemo && req.user ? req.user.id : null,
      });
      
      const table = await storage.createPokerTable(tableData);
      res.json({ table });
    } catch (error) {
      console.error('Create table error:', error);
      res.status(500).json({ error: 'Failed to create table' });
    }
  });

  // POST /api/tables/:id/join - Join a poker table
  app.post('/api/tables/:id/join', async (req: Request, res: Response) => {
    try {
      const tableId = parseInt(req.params.id);
      const { buyInAmount, seatNumber, playerName } = req.body;
      
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Invalid table ID' });
      }
      
      if (typeof buyInAmount !== 'number' || buyInAmount <= 0) {
        return res.status(400).json({ error: 'Invalid buy-in amount' });
      }
      
      if (typeof seatNumber !== 'number' || seatNumber < 0 || seatNumber > 5) {
        return res.status(400).json({ error: 'Invalid seat number' });
      }
      
      const table = await storage.getPokerTable(tableId);
      
      if (!table) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      if (!table.isActive) {
        return res.status(400).json({ error: 'Table is not active' });
      }
      
      if (table.currentPlayers >= table.maxPlayers) {
        return res.status(400).json({ error: 'Table is full' });
      }
      
      if (buyInAmount < table.minBuyIn || buyInAmount > table.maxBuyIn) {
        return res.status(400).json({ error: `Buy-in must be between $${table.minBuyIn} and $${table.maxBuyIn}` });
      }
      
      // For demo mode, create a pseudo player ID based on name
      const isDemo = !req.cookies['telegram_session'];
      let playerId: number | null = null;
      
      if (!isDemo && req.user) {
        playerId = req.user.id;
        
        // Check if player is already at this table
        const existingPlayer = await storage.getPlayerAtTable(tableId, playerId);
        if (existingPlayer) {
          return res.status(400).json({ error: 'You are already at this table' });
        }
      }
      
      // For demo mode, we'll track players by session/name rather than user ID
      // This is simplified for the demo - in production you'd want better session tracking
      const tablePlayer = await storage.addPlayerToTable({
        tableId,
        playerId: playerId || null, // Use null for demo players (nullable field)
        seatNumber,
        buyInAmount,
        currentChips: buyInAmount,
        isActive: true,
      });
      
      res.json({ 
        success: true,
        tablePlayer,
        playerName: playerName || (req.user?.displayName ?? 'Demo Player')
      });
    } catch (error) {
      console.error('Join table error:', error);
      res.status(500).json({ error: 'Failed to join table' });
    }
  });

  // POST /api/tables/:id/leave - Leave a poker table
  app.post('/api/tables/:id/leave', async (req: Request, res: Response) => {
    try {
      const tableId = parseInt(req.params.id);
      
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Invalid table ID' });
      }
      
      // For demo mode, we need a way to identify the player
      const isDemo = !req.cookies['telegram_session'];
      
      if (!isDemo && req.user) {
        await storage.removePlayerFromTable(tableId, req.user.id);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Leave table error:', error);
      res.status(500).json({ error: 'Failed to leave table' });
    }
  });

  // GET /api/tables/:id/players - Get players at a table
  app.get('/api/tables/:id/players', async (req: Request, res: Response) => {
    try {
      const tableId = parseInt(req.params.id);
      
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Invalid table ID' });
      }
      
      const players = await storage.getTablePlayers(tableId);
      res.json({ players });
    } catch (error) {
      console.error('Get table players error:', error);
      res.status(500).json({ error: 'Failed to get table players' });
    }
  });
  
  // PATCH /api/tables/:id/gamestate - Update game state for a table
  app.patch('/api/tables/:id/gamestate', async (req: Request, res: Response) => {
    try {
      const tableId = parseInt(req.params.id);
      const { gameState } = req.body;
      
      if (isNaN(tableId)) {
        return res.status(400).json({ error: 'Invalid table ID' });
      }
      
      if (!gameState) {
        return res.status(400).json({ error: 'Game state is required' });
      }
      
      const updatedTable = await storage.updatePokerTableGameState(tableId, gameState);
      
      if (!updatedTable) {
        return res.status(404).json({ error: 'Table not found' });
      }
      
      res.json({ success: true, table: updatedTable });
    } catch (error) {
      console.error('Update table game state error:', error);
      res.status(500).json({ error: 'Failed to update game state' });
    }
  });

  // Cleanup expired sessions periodically
  setInterval(() => {
    storage.deleteExpiredSessions().catch(console.error);
  }, 60 * 60 * 1000); // Every hour

  const httpServer = createServer(app);

  return httpServer;
}
