# Texas Hold'em Poker Web Application

## Overview
A complete Texas Hold'em poker web application featuring a realistic poker table interface, AI bot opponents, and full game mechanics. Built with React, TypeScript, and Tailwind CSS. The project aims to provide a professional-grade poker experience, integrating seamlessly as a Telegram Mini App while also functioning as a standalone web application. It includes persistent user statistics and bankroll management, offering a comprehensive and engaging platform for Texas Hold'em enthusiasts.

## User Preferences
I prefer iterative development with clear communication on major changes. Please ask before making significant architectural alterations or introducing new external dependencies. I value detailed explanations for complex features or decisions.

## System Architecture

### UI/UX Decisions
The application features a professional, centered flexbox layout with the poker table as the focal point, utilizing a 3:2 aspect ratio for optimal display. Player positioning is calculated trigonometrically around the table to prevent overlap. A robust z-index system is implemented using CSS variables for proper element stacking. The sidebar is semi-transparent with a backdrop blur, collapsible for mobile views, and designed with proper pointer-events management. The design incorporates a mobile-first approach with responsive breakpoints.

Visual polish includes:
- **Enhanced Card Animations**: Staggered dealing, 3D flips, staggered flop reveals, turn/river slide-ins with glow effects.
- **Chip Movement & Betting**: Arc trajectory animations for chips, animated chip counters, and visual chip stacks.
- **Player Interaction Feedback**: Button hover/press effects, pulsing for current player, shake animation for invalid actions.
- **Advanced Action Controls**: Quick bet buttons (1/2 pot, pot, all-in), keyboard shortcuts, bet amount display with pot percentage and risk warnings.
- **Game State Communication**: Contextual toast notifications, winner celebration with confetti/coins, phase transition effects.
- **Table Atmosphere**: Realistic felt texture, polished wood grain border, ambient lighting, subtle shadows.
- **Hand Strength Indicator**: Real-time hand evaluation, draw detection, color-coded strength badges.
- **Action History Sidebar**: Chronological event tracking, player action highlighting.
- **Sound Design System**: Web Audio API integration with 12 procedurally generated sound types for card, chip, action, and victory events, ensuring balanced audio feedback.

### Technical Implementations
- **Frontend Structure**: Organized into `pages`, `components`, `lib` (game logic, utilities), and `hooks`.
  - Core components include `PlayingCard`, `PlayerSeat`, `CommunityCards`, `ActionControls`, `PotDisplay`, `HandStrengthIndicator`, `ActionHistory`, `Chip`, and `WinnerCelebration`.
  - Game logic resides in `gameEngine.ts` and `handEvaluator.ts`.
  - Custom React hooks manage animations (`useAnimatedCounter`, `useShake`) and sound (`useSound`).
- **Game Engine**: A `GameEngine` class manages deck, dealing, betting rounds, player actions (fold, check, bet, raise, all-in), pot, and game state transitions (waiting → pre-flop → flop → turn → river → showdown).
- **AI Bot Logic**: The `BotAI` class implements basic decision-making based on game phase and bet amounts, utilizing weighted probabilities for actions.
- **Data Models**: Defined in `/shared/schema.ts`, including `Card`, `Player`, `GameState`, `ActionHistoryEntry`, `HandEvaluation`, and `DrawInfo`.
- **Telegram Mini App Integration**:
  - **Backend Architecture**: PostgreSQL database for `telegram_users` (profile + stats) and `sessions`, HMAC-SHA256 signature verification, HTTP-only cookie session management.
  - **API Routes**: `/api/telegram/auth`, `/api/session`, `/api/logout`, `/api/users/me/stats`, `/api/users/me/bankroll`.
  - **Storage Layer**: Uses `DatabaseStorage` for Telegram user CRUD and session management.
  - **Frontend Integration**: `Telegram Web App SDK`, `useTelegramWebApp` hook, `useTelegramAuth` hook with React Query, `TelegramAuthGate` component.
  - **Dual-Mode Support**: Operates as a Telegram Mini App with auto-authentication and as a standalone web app with a demo mode.
  - **Persistent Stats**: User bankroll and poker statistics are auto-saved after each hand.
  - **Security**: HMAC-SHA256 `initData` verification, secure session cookies, protected routes.

### System Design Choices
- **State Management**: Primarily uses React's `useState` for client-side game state.
- **Asynchronous Bot Actions**: Delays are introduced for realistic timing of bot moves.
- **Design System**: Defines a comprehensive set of colors, animations (card dealing, chip movement, player feedback, game events), layout guidelines (poker table dimensions, player positioning), and sound design principles.

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
- PostgreSQL (for Telegram Mini App backend)
- Telegram Web App SDK
- React Query