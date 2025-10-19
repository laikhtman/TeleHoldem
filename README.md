
# Texas Hold'em Poker Web Application

A complete Texas Hold'em poker web application featuring a realistic poker table interface, AI bot opponents, and full game mechanics. Built with React, TypeScript, and Tailwind CSS.

## 🎮 Features

### Core Gameplay
- 6-player Texas Hold'em (1 human + 5 AI bots)
- Complete betting rounds: pre-flop, flop, turn, river
- Player actions: fold, check, call, bet, raise, all-in
- Side pot management for all-in situations
- Pot tracking and chip management with split pot logic for ties
- Dealer button rotation and blind posting

### Visual Features
- **Realistic Table Atmosphere**: Green felt texture, polished wood grain border, and ambient lighting.
- **Advanced Animations**: 3D card flips, staggered dealing, and flying chips with arc trajectories.
- **Player Feedback**: Pulsing glow for the current player, action badges, and winner celebrations with confetti.
- **Information Display**: Real-time hand strength indicator with draw detection, and a detailed action history sidebar.

### Player Controls
- **Advanced Betting**: Adjustable bet slider, quick-bet buttons (1/2 Pot, Pot, All-In), and real-time validation.
- **Keyboard Shortcuts**: `F` for Fold, `C` for Check/Call, `R` for Raise, `A` for All-In.

## 🛠 Technology Stack

### Frontend
- **React 18** & **TypeScript**
- **Tailwind CSS** with **Shadcn UI** components
- **Framer Motion** for animations
- **Vite** for the build tool

### Backend
- **Node.js** & **Express.js**
- **Drizzle ORM** with **PostgreSQL**

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 16 (Optional, for database persistence)
- npm or yarn package manager

### Installation & Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (e.g., `DATABASE_URL` if using a database)
4. Start development server: `npm run dev`
5. Access the application at `http://localhost:5173` (or as specified by Vite)

## 🏗 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components (PlayerSeat, PlayingCard, etc.)
│   │   ├── pages/          # Main application pages (poker-game.tsx)
│   │   ├── lib/            # Core client-side logic (gameEngine, handEvaluator, botAI)
│   │   └── hooks/          # Custom React hooks (useAnimatedCounter)
├── server/                 # Backend Express application
└── shared/                 # Shared types and schemas (schema.ts)
```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server for client and server.
- `npm run build` - Build for production.
- `npm start` - Start production server.
- `npm run db:push` - Push schema changes to the database using Drizzle.

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string.
- `PORT` - Server port (default: 5000).

## 🤖 AI Opponents

The AI players feature decision-making algorithms that consider game phase, hand strength, and pot odds to perform actions like bluffing, calling, and raising.

---

Built with ❤️ for poker enthusiasts. Enjoy your game!
