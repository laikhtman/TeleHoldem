# Texas Hold'em Poker Web Application

## Overview
A web-based Texas Hold'em poker application offering a realistic and engaging experience with a professional poker table interface, AI bot opponents, and full game mechanics. It functions as both a Telegram Mini App and a standalone web application, featuring persistent user statistics, bankroll management, and a focus on intuitive UI/UX to provide a professional-grade platform for poker enthusiasts. The project aims to integrate advanced tournament systems and a modern, crypto/Web3-inspired design aesthetic.

## User Preferences
I prefer iterative development with clear communication on major changes. Please ask before making significant architectural alterations or introducing new external dependencies. I value detailed explanations for complex features or decisions.

## System Architecture

### UI/UX Decisions
The application features a professional, centered flexbox layout with the poker table as the focal point, utilizing a 3:2 aspect ratio, calculated player positioning, and a robust z-index system. The design emphasizes a mobile-first approach with responsive breakpoints, Apple HIG compliance, and iOS safe area support. Visual elements include enhanced card animations, realistic chip movement, comprehensive player interaction feedback, advanced action controls, clear game state communication, an immersive table atmosphere, real-time hand strength indication, and a sophisticated Web Audio API-based sound design system. The aesthetic is a modern dark theme with neon purple/pink accents, glass morphism panels, and gradient effects, inspired by crypto gaming templates.

### Technical Implementations
The frontend is structured into `pages`, `components`, `lib` (game logic, utilities), and `hooks`. Core game logic is managed by `gameEngine.ts` and `handEvaluator.ts`, with AI bot logic handled by `BotAI` for decision-making. Data models are defined in `/shared/schema.ts`. For Telegram Mini App integration, a PostgreSQL database manages `telegram_users` and `sessions`, with HMAC-SHA256 signature verification and HTTP-only cookie session management for security. The frontend integrates the `Telegram Web App SDK` for authentication and persistent user data. A comprehensive tournament system includes blind progression, eliminations, and payout structures.

### System Design Choices
The system uses React's `useState` for client-side game state, with asynchronous delays for realistic bot actions. A comprehensive design system defines guidelines for colors, animations, layout, and sound. Accessibility is addressed with ARIA labels, keyboard navigation, and a colorblind mode. Mobile responsiveness includes `xs:` (480px) breakpoint, iOS safe-area support, and adaptive layouts for tablets. Haptic feedback is integrated via `useHaptic` for Telegram WebApp and the Vibration API. An admin configuration page (`/settings`) allows management of backend settings and monitors system status, with data persisted in an `app_settings` table and Telegram bot tokens stored securely via Replit Secrets.

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
```