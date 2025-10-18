
# Texas Hold'em Poker Web Application

A full-featured Texas Hold'em poker web application built with modern web technologies. Play against intelligent AI opponents in a realistic poker environment with professional table design and smooth gameplay.

## 🎮 Features

### Core Gameplay
- **Complete Texas Hold'em Implementation**: Pre-flop, flop, turn, river, and showdown phases
- **AI Opponents**: Smart bot players with varying play styles and difficulty levels
- **Hand Evaluation**: Advanced poker hand ranking system with proper tie-breaking
- **Betting System**: Full betting mechanics including call, raise, fold, check, and all-in
- **Pot Management**: Accurate pot calculation and distribution

### User Interface
- **Professional Poker Table**: Realistic green felt table with proper positioning
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Live game state updates and smooth animations
- **Player Information**: Chip counts, betting amounts, and player status indicators
- **Community Cards**: Clear display of shared cards with deal animations
- **Action Controls**: Intuitive betting interface with slider controls

### Technical Features
- **Real-time Communication**: WebSocket integration for live updates
- **Database Integration**: PostgreSQL for persistent game state and statistics
- **Type Safety**: Full TypeScript implementation
- **Modern UI Components**: Tailwind CSS with custom poker-themed styling
- **Hot Module Replacement**: Instant development updates with Vite

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Tailwind CSS** - Utility-first CSS framework with custom poker styling
- **Vite** - Fast build tool and development server
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Server-side type safety
- **PostgreSQL** - Robust relational database
- **Drizzle ORM** - Type-safe database queries

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing and optimization
- **Tailwind Animate** - Animation utilities

## 🚀 Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL 16
- npm or yarn package manager

### Installation & Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (DATABASE_URL required)
4. Start development server: `npm run dev`
5. Access the application at `http://localhost:5000`

### Database Setup
The application uses Drizzle ORM with PostgreSQL. Database migrations are handled automatically based on the schema defined in `shared/schema.ts`.

## 🎯 Current Status

### ✅ Completed Features
- [x] Complete poker game engine with all betting rounds
- [x] Advanced hand evaluation system with tie-breaking
- [x] AI bot players with strategic decision making
- [x] Professional poker table UI with animations
- [x] Responsive design for all screen sizes
- [x] Real-time game state management
- [x] Pot calculation and distribution
- [x] Player action controls (call, raise, fold, check, all-in)
- [x] Community cards display with deal animations
- [x] Player positioning and seat management
- [x] Game phase indicators and last action display
- [x] Toast notifications for game events
- [x] Winner indication and celebration
- [x] Dynamic and intelligent betting controls
- [x] Robust game loop and phase progression
- [x] Database integration with PostgreSQL
- [x] TypeScript implementation across the stack

### 🚧 In Progress
- [ ] WebSocket real-time communication (partially implemented)
- [ ] Player statistics and game history
- [ ] Tournament mode
- [ ] Multi-table support

### 📋 Planned Features
- [ ] User authentication and profiles
- [ ] Spectator mode
- [ ] Chat system
- [ ] Sound effects and music
- [ ] Customizable avatars
- [ ] Leaderboards and achievements
- [ ] Mobile app companion

## 🏗 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── lib/            # Game logic and utilities
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express application
├── shared/                 # Shared types and schemas
└── migrations/             # Database migration files
```

## 🎮 How to Play

1. **Join a Game**: The application automatically seats you at a poker table with AI opponents
2. **Place Bets**: Use the action controls to call, raise, fold, or check
3. **Watch the Cards**: Community cards are dealt during flop, turn, and river phases
4. **Showdown**: Best hand wins the pot automatically
5. **New Hand**: Game continues with rotating dealer position

## 🤖 AI Opponents

The AI players feature sophisticated decision-making algorithms that consider:
- Hand strength evaluation
- Pot odds calculation
- Position awareness
- Betting patterns analysis
- Bluffing strategies
- Risk assessment

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations

### Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 5000)

## 📱 Deployment

The application is configured for deployment on Replit with automatic scaling. The build process compiles TypeScript and bundles assets for optimal performance.

## 🎨 Design Philosophy

The application follows a professional poker room aesthetic with:
- **Green Felt Table**: Classic casino table appearance
- **Gold Accents**: Poker chip gold color scheme
- **Clean Typography**: Easy-to-read fonts and clear information hierarchy
- **Smooth Animations**: Card dealing and betting animations for immersion
- **Responsive Layout**: Optimal experience on all device sizes

---

Built with ❤️ for poker enthusiasts. Enjoy your game!
