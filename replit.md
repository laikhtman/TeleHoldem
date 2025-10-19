# Texas Hold'em Poker Web Application

## Overview
A complete Texas Hold'em poker web application featuring a realistic poker table interface, AI bot opponents, and full game mechanics. Built with React, TypeScript, and Tailwind CSS. The project aims to provide a professional-grade poker experience, integrating seamlessly as a Telegram Mini App while also functioning as a standalone web application. It includes persistent user statistics and bankroll management, offering a comprehensive and engaging platform for Texas Hold'em enthusiasts.

## User Preferences
I prefer iterative development with clear communication on major changes. Please ask before making significant architectural alterations or introducing new external dependencies. I value detailed explanations for complex features or decisions.

## Recent Changes

### October 19, 2025: Tablet/iPad Optimization
- **Responsive Breakpoints**: Added `md:` (768-1023px) breakpoint for tablet-specific styling between mobile (`sm:`) and desktop (`lg:`)
- **Orientation Detection**: Created `useOrientation` hook (SSR-safe with window guards) to detect portrait vs landscape modes
- **Layout Adaptation**: Table scales smoothly with `md:min-h-[60vh]`, `md:rounded-[190px]`, `md:p-[11px]` for optimal tablet viewing
- **Sidebar Behavior**: Sidebars visible in landscape mode (`md:w-72` left, `md:w-76` right), collapsible in portrait mode with toggle buttons hidden in landscape (`md:hidden`)
- **Touch Optimization**: Action buttons enlarged to `md:min-h-[52px]` (exceeds 48px iOS standard), slider track increased to `md:h-3`, spacing improved to `md:gap-4`
- **Component Scaling**: PlayerSeat (`md:p-4`, `md:text-base`), CommunityCards (`md:gap-4`), ActionControls (`md:p-5`, `md:min-w-[140px]`) optimized for tablets
- **Dual Orientation Support**: Game fully playable in both portrait (768×1024) and landscape (1024×768) on iPad and Android tablets

### October 19, 2025: Telegram Mini App Integration
- **Backend Architecture**: PostgreSQL database for `telegram_users` (profile + stats) and `sessions`, HMAC-SHA256 signature verification, HTTP-only cookie session management (7-day expiry)
- **API Routes**: `/api/telegram/auth` (authenticate), `/api/session` (get user), `/api/logout`, `/api/users/me/stats` (get/update), `/api/users/me/bankroll` (update)
- **Storage Layer**: Migrated from MemStorage to DatabaseStorage with Telegram user CRUD and session management
- **Frontend Integration**: Telegram Web App SDK, `useTelegramWebApp` hook, `useTelegramAuth` hook with React Query, `TelegramAuthGate` component
- **Dual-Mode Support**: Works as Telegram Mini App (auto-auth with Telegram account) AND standalone web app (demo mode with default bankroll)
- **Demo Route**: Added `/demo` route for instant gameplay without authentication (uses default "You" player with 1000 chips)
- **Persistent Stats**: User bankroll and poker stats (hands played/won, biggest pot, winnings, achievements) auto-save after each hand (Telegram users only)
- **Security**: HMAC-SHA256 `initData` verification, secure session cookies, protected routes with `requireAuth` middleware
- **Documentation**: Complete setup guide in `docs/telegram.md` (bot creation, configuration, deployment, troubleshooting)
- **Critical Fix**: Added explicit queryFn to session query in `useTelegramAuth` to ensure proper authentication flow

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
  - Custom React hooks manage animations (`useAnimatedCounter`, `useShake`), sound (`useSound`), and responsive behavior (`useOrientation`, `useSwipe`).
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