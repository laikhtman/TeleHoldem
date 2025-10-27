# Texas Hold'em Poker Web Application

## Overview
A comprehensive Texas Hold'em poker web application designed to provide a realistic and engaging poker experience. It features a professional poker table interface, AI bot opponents, and full game mechanics. The application integrates seamlessly as a Telegram Mini App while also functioning as a standalone web application. Key capabilities include persistent user statistics, bankroll management, and a focus on intuitive UI/UX, aiming to be a professional-grade platform for poker enthusiasts.

## Important: Routes & Testing Access

### For QA Testers
- **Demo Mode**: `/demo` - No authentication required, full game features available
- **Landing Page**: `/` - Shows options for Demo Mode or Telegram authentication
- **Telegram Mode**: `/game` - Requires Telegram authentication (for production use)

### Route Structure
- `/` - Landing page with clear options for testers and Telegram users
- `/demo` - Direct access to game without authentication (for QA testing)
- `/game` - Telegram authenticated game experience with persistent stats
- `/settings` - Admin configuration page

**Note for Testers**: Always use `https://teleholdem.replit.app/demo` to bypass authentication and test all features.

## User Preferences
I prefer iterative development with clear communication on major changes. Please ask before making significant architectural alterations or introducing new external dependencies. I value detailed explanations for complex features or decisions.

## Recent Updates - Section 6 Global Enhancements (Completed)

### Design Tokens System
- **Comprehensive CSS Variables**: All colors, spacing, typography, radius, shadows, animations, and z-index values centralized in `index.css`
- **Semantic Color Tokens**: Primary, secondary, success/warning/error states, surface colors, text colors, border colors
- **Spacing Scale**: Consistent spacing from xs (0.25rem) to 5xl (6rem)
- **Typography Scale**: Font sizes from xs to 5xl with weights, line heights, letter spacing
- **Animation Tokens**: Transition durations (fastest to slowest) and easing functions including spring animations

### Responsive Typography
- **Base Font Sizes**: 14px mobile, 15px tablet, 16px desktop
- **rem Units**: All typography uses rem for accessibility and user preference support
- **Modular Scale**: Consistent proportional scaling across all text elements

### Theme Support
- **Dark/Light Modes**: Full theme system with smooth transitions
- **ThemeProvider Context**: Centralized theme management with persistence
- **System Preference Detection**: Respects OS theme preference on first load
- **localStorage Persistence**: User's theme choice saved and restored
- **Theme Toggle**: Sun/Moon icon toggle available on all pages

### Performance Optimizations
- **React.lazy Loading**: Heavy components (charts, achievements, sidebars) loaded on demand
- **requestAnimationFrame**: Custom hooks for 60fps animations (counters, timers, chip movements)
- **React.memo**: Memoized components to prevent unnecessary re-renders
- **Performance Monitoring**: FPS counter and render time tracking utilities
- **Adaptive Performance**: Low device detection for performance adjustments

### User Onboarding & Tutorials
- **Interactive Onboarding Flow**: 6-step tutorial for first-time users with spotlight animations
- **Contextual Game Tips**: Smart tips triggered at key game moments
- **Comprehensive Help Page**: Full documentation at `/help` with rules, controls, shortcuts, strategy, FAQ
- **Keyboard Shortcut**: Press "?" to quickly access help from anywhere
- **Mobile-Specific Guidance**: Special tips for touch users and gestures

### Error Handling
- **Global ErrorBoundary**: Catches and displays user-friendly error messages
- **Network Status Detection**: Online/offline monitoring with automatic reconnection
- **Specific Error States**: Custom handling for lobby, game, auth, and API errors
- **Retry Mechanisms**: All errors include actionable retry options
- **Loading States**: Skeleton loaders and progress indicators for better UX
- **Error Logging**: Comprehensive error tracking with frequency monitoring

## System Architecture

### UI/UX Decisions
The application features a professional, centered flexbox layout with the poker table as the focal point, utilizing a 3:2 aspect ratio. Player positioning is calculated trigonometrically around the table. A robust z-index system and semi-transparent sidebars with backdrop blur are implemented. The design emphasizes a mobile-first approach with responsive breakpoints.

**Mobile Optimizations (October 2025):**
- **Apple HIG Compliance**: All action buttons use explicit `min-h-[48px]` (48px minimum) to guarantee ≥44pt touch targets regardless of root font scaling
- **Safe Area Support**: Comprehensive iOS safe area inset handling via CSS variables (`--safe-area-top/right/bottom/left`) applied to all fixed/absolute elements (header, action controls, FAB, swipe hints, table container)
- **Responsive Table Scaling**: Poker table scales from 90% width on mobile (portrait) to 100% on desktop with proportional border radius and landscape constraints (`max-h-[min(75vh,800px)]`)
- **Enhanced Action Controls**: Semi-transparent container (`bg-card/80 backdrop-blur-lg`) with improved opacity and blur for better visual contrast on mobile
- **Hand Strength Panel**: Desktop-only sidebar panel (`hidden md:block`) - completely hidden on mobile phones (< 768px) to prevent table overlap, visible on tablets with collapsible toggle
- **Responsive Card Scaling**: Player hole cards use adaptive scaling (`scale-100` on mobile, `scale-95` on xs screens, `scale-90` on md+ devices) for improved visibility on small screens
- **MobileBottomSheet**: Fully functional 75vh height sheet with swipe-down-to-close gesture, FAB, and three-tab navigation (Essential, Detailed, History)
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