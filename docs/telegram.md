# Telegram Mini App Integration

This document explains how to set up and use the Texas Hold'em Poker app as a Telegram Mini App.

## Overview

The poker application now supports being launched as a Telegram Mini App (also called Web App), allowing users to:
- Open the game directly inside Telegram messenger
- Authenticate automatically using their Telegram account
- Have their game stats and bankroll persist across sessions
- Play with their Telegram display name and profile photo

## Architecture

### Dual-Mode Support
The app supports both:
1. **Telegram Mode**: When launched from Telegram bot, users auto-authenticate with their Telegram account
2. **Standalone Mode**: When accessed via browser, users can play without authentication (demo mode with default $1000 bankroll)

### Tech Stack
- **Frontend**: Telegram Web App SDK, React, TypeScript
- **Backend**: Express.js with PostgreSQL database
- **Authentication**: HMAC-SHA256 verification of Telegram initData
- **Session Management**: HTTP-only cookies with 7-day expiry

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` command
3. Follow the prompts to create your bot:
   - Choose a name (e.g., "Texas Poker Bot")
   - Choose a username (must end in "bot", e.g., "TexasPokerBot")
4. BotFather will give you a **Bot Token** - save this securely!

### 2. Configure the Mini App

1. In BotFather, send `/mybots` and select your bot
2. Click "Bot Settings" → "Menu Button" → "Configure menu button"
3. Choose "Edit menu button URL"
4. Enter your app URL:
   - **Development**: `https://<your-replit-workspace>.repl.co`
   - **Production**: Your published Repl URL or custom domain
5. Set button text (e.g., "Play Poker 🎰")

### 3. Set Environment Variables

Add the following environment variable to your Replit project:

```bash
TELEGRAM_BOT_TOKEN=<your-bot-token-from-botfather>
```

**How to add in Replit:**
1. Click the "Secrets" tool in the left sidebar (🔒 icon)
2. Add a new secret:
   - Key: `TELEGRAM_BOT_TOKEN`
   - Value: Your bot token from BotFather
3. The app will automatically load it

### 4. Test the Integration

1. Open your bot in Telegram
2. Click the menu button (bottom-left) or type `/start`
3. Click your configured button (e.g., "Play Poker 🎰")
4. The poker game should open inside Telegram!

## How It Works

### Authentication Flow

1. **User opens the app in Telegram**
   - Telegram Web App SDK loads automatically
   - SDK provides `initData` with user info and authentication hash

2. **Frontend sends initData to backend**
   - POST to `/api/telegram/auth` with `initData`
   - Backend verifies HMAC-SHA256 signature using bot token

3. **Backend creates/updates user**
   - Validates signature and timestamp (max 1 hour old)
   - Upserts user in `telegram_users` table
   - Creates session in `sessions` table
   - Returns HTTP-only session cookie

4. **User plays poker**
   - Game loads with user's display name and bankroll
   - Stats and bankroll auto-save after each hand
   - Session persists for 7 days

### API Endpoints

#### `POST /api/telegram/auth`
Authenticate with Telegram credentials.

**Request:**
```json
{
  "initData": "query_id=AAF...&user=%7B%22id%22..."
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "displayName": "John Doe",
    "photoUrl": "https://...",
    "bankroll": 1000,
    "stats": {
      "handsPlayed": 0,
      "handsWon": 0,
      "biggestPot": 0,
      "totalWinnings": 0,
      "achievements": []
    }
  }
}
```

#### `GET /api/session`
Get current authenticated user session.

**Response:**
```json
{
  "user": {
    "id": 1,
    "displayName": "John Doe",
    "photoUrl": "https://...",
    "bankroll": 1500,
    "stats": { ... }
  }
}
```

#### `POST /api/logout`
Logout and clear session.

**Response:**
```json
{
  "success": true
}
```

#### `GET /api/users/me/stats`
Get current user's poker stats.

**Response:**
```json
{
  "stats": {
    "handsPlayed": 42,
    "handsWon": 18,
    "biggestPot": 850,
    "totalWinnings": 2500,
    "achievements": ["FIRST_WIN", "BIG_POT"]
  }
}
```

#### `PATCH /api/users/me/stats`
Update current user's poker stats.

**Request:**
```json
{
  "stats": {
    "handsPlayed": 43,
    "handsWon": 19,
    ...
  }
}
```

#### `PATCH /api/users/me/bankroll`
Update current user's bankroll.

**Request:**
```json
{
  "bankroll": 1250
}
```

## Database Schema

### `telegram_users` Table
Stores Telegram user profiles and poker stats.

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `telegram_id` | varchar | Unique Telegram user ID |
| `username` | varchar | Telegram username (@handle) |
| `first_name` | varchar | User's first name |
| `last_name` | varchar | User's last name (optional) |
| `photo_url` | text | Profile photo URL (optional) |
| `language_code` | varchar | User's language code |
| `display_name` | varchar | Display name in game |
| `bankroll` | integer | Current chip balance (default: 1000) |
| `stats` | json | Poker statistics object |
| `auth_date` | timestamp | Last authentication timestamp |
| `created_at` | timestamp | Account creation date |
| `updated_at` | timestamp | Last update timestamp |

### `sessions` Table
Manages user sessions with cookie tokens.

| Column | Type | Description |
|--------|------|-------------|
| `id` | serial | Primary key |
| `telegram_user_id` | integer | Foreign key to telegram_users |
| `session_token` | varchar | Unique session token (stored in cookie) |
| `expires_at` | timestamp | Session expiration (7 days) |
| `created_at` | timestamp | Session creation timestamp |

## Security Features

### HMAC-SHA256 Verification
All Telegram authentication data is verified using HMAC-SHA256:
1. Secret key derived from bot token
2. Data check string created from sorted parameters
3. Hash compared to Telegram-provided hash
4. Timestamp validated (max 1 hour old)

### Session Security
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- SameSite: lax (CSRF protection)
- 7-day expiration with automatic cleanup

### Input Validation
- All endpoints validate request data
- Zod schemas ensure type safety
- SQL injection prevention via Drizzle ORM

## Frontend Components

### `useTelegramWebApp`
Hook to access Telegram Web App SDK.

```typescript
const { webApp, isInTelegram, isReady, initData, user } = useTelegramWebApp();
```

### `useTelegramAuth`
Hook for authentication logic.

```typescript
const { isAuthenticated, user, isLoading, error, isStandalone } = useTelegramAuth();
```

### `<TelegramAuthGate>`
Component that wraps the game and handles auth.

```tsx
<TelegramAuthGate>
  <PokerGame />
</TelegramAuthGate>
```

## Deployment

### Replit Deployment
1. Make sure `TELEGRAM_BOT_TOKEN` is set in Secrets
2. Click "Publish" in Replit
3. Copy your published URL
4. Update the Mini App URL in BotFather

### Custom Domain
If using a custom domain:
1. Configure domain in Replit
2. Update Mini App URL in BotFather
3. Ensure HTTPS is enabled

## Troubleshooting

### "Invalid Telegram authentication" Error
- Check that `TELEGRAM_BOT_TOKEN` is correctly set
- Verify bot token matches the bot that opened the app
- Check server logs for signature verification details

### "Not authenticated" on page load
- Clear cookies and try again
- Check if session expired (7 days max)
- Verify database connection

### Game not loading in Telegram
- Check Mini App URL is correct in BotFather
- Ensure app is published and accessible
- Check browser console for errors

### Stats not saving
- Verify `/api/users/me/stats` endpoint is working
- Check network tab for failed requests
- Ensure user is authenticated

## Development Tips

### Testing Locally
1. Use ngrok or similar to expose local server
2. Update Mini App URL to ngrok URL
3. Add `TELEGRAM_BOT_TOKEN` to `.env`

### Standalone Mode Testing
Simply open the app in a browser (not through Telegram) to test standalone mode.

### Database Inspection
```bash
npm run db:push  # Push schema changes
```

Use Replit's Database tool to view and query data.

## Future Enhancements

Possible improvements:
- [ ] Multiplayer mode (play against other Telegram users)
- [ ] Leaderboards
- [ ] Daily challenges and rewards
- [ ] Telegram notifications for game events
- [ ] In-app purchases for chips
- [ ] Social features (invite friends, share wins)
- [ ] Tournament mode

## Support

For issues or questions:
1. Check server logs in Replit
2. Check browser console for frontend errors
3. Verify all environment variables are set
4. Test in standalone mode to isolate Telegram-specific issues

## Resources

- [Telegram Bot API Docs](https://core.telegram.org/bots/api)
- [Telegram Web Apps Guide](https://core.telegram.org/bots/webapps)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
