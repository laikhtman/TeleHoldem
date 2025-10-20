# Texas Hold'em Poker Web Application

## Overview
A comprehensive Texas Hold'em poker web application designed to provide a realistic and engaging poker experience. It features a professional poker table interface, AI bot opponents, and full game mechanics. The application integrates seamlessly as a Telegram Mini App while also functioning as a standalone web application. Key capabilities include persistent user statistics, bankroll management, and a focus on intuitive UI/UX, aiming to be a professional-grade platform for poker enthusiasts.

## User Preferences
I prefer iterative development with clear communication on major changes. Please ask before making significant architectural alterations or introducing new external dependencies. I value detailed explanations for complex features or decisions.

## System Architecture

### UI/UX Decisions
The application features a professional, centered flexbox layout with the poker table as the focal point, utilizing a a 3:2 aspect ratio. Player positioning is calculated trigonometrically around the table. A robust z-index system and semi-transparent sidebars with backdrop blur are implemented. The design emphasizes a mobile-first approach with responsive breakpoints.
Visual elements include:
- Enhanced card animations (staggered dealing, 3D flips, glow effects).
- Realistic chip movement with arc trajectories and animated counters.
- Comprehensive player interaction feedback (button effects, pulsing current player, invalid action shakes).
- Advanced action controls with quick bet options, keyboard shortcuts, and contextual bet amount displays.
- Clear game state communication via toast notifications, winner celebrations, and phase transition effects.
- Immersive table atmosphere with realistic textures and ambient lighting.
- Real-time hand strength indicator with draw detection and color-coded badges.
- Chronological action history sidebar.
- A sophisticated sound design system using Web Audio API for various game events.

### Technical Implementations
- **Frontend Structure**: Organized into `pages`, `components`, `lib` (game logic, utilities), and `hooks`. Core components include `PlayingCard`, `PlayerSeat`, `CommunityCards`, `ActionControls`, `PotDisplay`, `HandStrengthIndicator`, `ActionHistory`, `Chip`, and `WinnerCelebration`. Game logic is managed by `gameEngine.ts` and `handEvaluator.ts`.
- **Game Engine**: A `GameEngine` class manages all poker mechanics, including deck, dealing, betting rounds, player actions (fold, check, bet, raise, all-in), pot management, and game state transitions.
- **AI Bot Logic**: The `BotAI` class implements basic decision-making for opponents based on game phase and bet amounts using weighted probabilities.
- **Data Models**: Defined in `/shared/schema.ts` for entities like `Card`, `Player`, `GameState`, `ActionHistoryEntry`, `HandEvaluation`, and `DrawInfo`.
- **Telegram Mini App Integration**:
    - **Backend**: PostgreSQL database for `telegram_users` (profile + stats) and `sessions`, HMAC-SHA256 signature verification, and HTTP-only cookie session management.
    - **API Routes**: `/api/telegram/auth`, `/api/session`, `/api/logout`, `/api/users/me/stats`, `/api/users/me/bankroll`.
    - **Storage**: Uses `DatabaseStorage` for Telegram user CRUD and session management.
    - **Frontend**: Integrates `Telegram Web App SDK` via `useTelegramWebApp` and `useTelegramAuth` hooks, and a `TelegramAuthGate` component.
    - **Functionality**: Supports both Telegram Mini App (auto-auth) and standalone web app (demo mode). Persistent user bankroll and poker stats are auto-saved for Telegram users.
    - **Security**: HMAC-SHA256 `initData` verification and secure session cookies.

### System Design Choices
- **State Management**: Primarily uses React's `useState` for client-side game state.
- **Asynchronous Bot Actions**: Delays are incorporated for realistic bot timing.
- **Design System**: Comprehensive guidelines for colors, animations, layout (poker table dimensions, player positioning), and sound design.
- **Accessibility**: Comprehensive ARIA labels for screen reader support, keyboard navigation, and colorblind mode with geometric suit indicators.
- **Mobile Responsiveness**: `xs:` (480px) breakpoint for mobile-first design, safe-area support for iOS devices, and adaptive layouts for tablets (`md:` breakpoint) including orientation detection.
- **Haptic Feedback**: `useHaptic` hook for Telegram WebApp HapticFeedback and Vibration API integration for enhanced tactile user experience.
- **Admin Configuration**: Dedicated `/settings` page for backend configuration management, including system status monitoring (database, Telegram bot ✅ configured, environment), game defaults (default bankroll, session duration), with data persisted in an `app_settings` table. Telegram bot token securely stored via Replit Secrets.

## External Dependencies
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Radix UI (Slider, ScrollArea, Toast)
- Lucide React
- Shadcn UI (Button, Slider, Toast, Badge, Card)
- React Hook Form
- Zod
- PostgreSQL
- Telegram Web App SDK
- React Query