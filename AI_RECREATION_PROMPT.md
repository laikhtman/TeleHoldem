
# AI Recreation Prompt: Texas Hold'em Poker Web Application

## Project Overview
Create a complete, production-ready Texas Hold'em poker web application with the following architecture and features. This is a comprehensive recreation prompt based on a fully functional poker game.

## Tech Stack Requirements
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion for smooth card dealing, chip movements, and transitions
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Telegram Mini App integration with HMAC-SHA256 verification
- **Audio**: HTML5 Audio API for game sounds with volume control
- **Mobile**: Full responsive design with iOS safe area support and haptic feedback

## Project Structure
```
├── client/src/
│   ├── components/     # React components (40+ specialized poker components)
│   │   ├── ui/         # shadcn/ui components (50+ UI primitives)
│   │   ├── ActionControls.tsx      # Betting interface with sliders
│   │   ├── PlayerSeat.tsx          # Individual player display
│   │   ├── PlayingCard.tsx         # SVG-based cards with animations
│   │   ├── CommunityCards.tsx      # Board cards with reveal animations
│   │   ├── PotDisplay.tsx          # Pot amount with chip animations
│   │   ├── ChipPhysics.tsx         # Physics-based chip movements
│   │   ├── HandStrengthIndicator.tsx # Real-time hand evaluation
│   │   ├── MobileBottomSheet.tsx   # Mobile-first UI panels
│   │   ├── SettingsPanel.tsx       # Game configuration
│   │   └── [30+ more specialized components]
│   ├── pages/         # Main game pages
│   │   ├── poker-game.tsx          # Core game implementation
│   │   ├── lobby.tsx               # Table selection
│   │   ├── tournament-game.tsx     # Tournament mode
│   │   └── LandingPage.tsx         # Home page
│   ├── lib/           # Game logic, utilities, AI
│   │   ├── gameEngine.ts           # Complete poker rules engine
│   │   ├── botAI.ts               # Advanced AI with personalities
│   │   ├── handEvaluator.ts       # Poker hand evaluation
│   │   ├── achievementEngine.ts   # Progress tracking
│   │   └── [10+ more utilities]
│   ├── hooks/         # Custom React hooks (20+ hooks)
│   └── contexts/      # React contexts
├── server/            # Express backend
│   ├── index.ts       # Server entry point
│   ├── routes.ts      # API routes
│   ├── db.ts          # Database schema
│   ├── telegram.ts    # Telegram integration
│   └── storage.ts     # Data persistence
├── shared/            # Shared TypeScript schemas
└── docs/              # Documentation
```

## Core Game Features to Implement

### 1. Complete Game Engine (`client/src/lib/gameEngine.ts`)
Create a comprehensive Texas Hold'em engine with:
- **Deck Management**: 52-card deck with proper shuffling algorithm
- **Player Management**: Support for 6 players maximum (human + 5 AI bots)
- **Betting Rounds**: Complete implementation of pre-flop, flop, turn, river
- **Pot Management**: Side pot calculations for all-in scenarios
- **Hand Evaluation**: Complete poker hand ranking system
- **Blinds System**: Small blind ($5), big blind ($10) rotation
- **Winner Determination**: Showdown resolution with proper tie-breaking
- **Game State Management**: Comprehensive state tracking and persistence

**Key Methods**:
```typescript
- createInitialGameState(numPlayers: number): GameState
- startNewHand(gameState: GameState): GameState
- playerFold/Check/Bet(gameState: GameState, playerIndex: number): GameState
- advancePhase(gameState: GameState): GameState
- resolveShowdown(gameState: GameState): ShowdownResult
- calculatePots(gameState: GameState): GameState
- awardPots(gameState: GameState): GameState
```

### 2. Advanced AI System (`client/src/lib/botAI.ts`)
Implement sophisticated bot behavior with:
- **Personality Types**: 5 distinct personalities (TAG, LAG, TP, LP, BAL)
- **Position Awareness**: Early/middle/late position play adjustments
- **Dynamic Difficulty**: Auto-adjustment based on human player performance
- **Advanced Bluffing**: Context-aware bluffing with multi-street narratives
- **Meta-Game Tracking**: Bots learn and adapt to player patterns
- **Table Image Management**: Exploit detection and counter-strategies
- **Realistic Decision Making**: Pot odds, fold equity, board texture analysis

**Personality Characteristics**:
- **TAG (Tight-Aggressive)**: Selective hands, aggressive when playing
- **LAG (Loose-Aggressive)**: More hands, high aggression, frequent bluffs
- **TP (Tight-Passive)**: Few hands, rarely bluffs, calls often
- **LP (Loose-Passive)**: Many hands, passive play, calling station
- **BAL (Balanced)**: Optimal mixed strategy

### 3. Hand Evaluation System (`client/src/lib/handEvaluator.ts`)
Complete poker hand ranking with:
- **Hand Rankings**: Royal flush down to high card
- **Tie Breaking**: Proper kicker evaluation
- **Board Texture Analysis**: Dry/wet board classification
- **Draw Detection**: Flush draws, straight draws with out counting
- **Win Probability**: Monte Carlo simulation for odds calculation
- **Hand Strength**: Normalized 0-1 strength evaluation for AI decisions

### 4. Mobile-First UI Implementation

#### Main Game Layout (`client/src/pages/poker-game.tsx`)
- **Responsive Design**: Three-zone layout (lg: sidebar-main-sidebar, mobile: stacked)
- **Crypto Gaming Table**: Oval table with neon effects and ambient particles
- **Player Positioning**: Trigonometric seat placement around oval table
- **Safe Area Support**: iOS notch and home indicator handling
- **Dynamic Scaling**: Aspect ratio adjustment based on viewport

#### Action Controls (`client/src/components/ActionControls.tsx`)
- **Betting Interface**: Logarithmic slider with quick-bet presets
- **Touch Optimized**: Minimum 48px tap targets
- **Keyboard Shortcuts**: F=fold, C=call/check, R=raise, A=all-in
- **Gesture Support**: Swipe left to fold, swipe right to call/check
- **Visual Feedback**: Haptic feedback and sound effects

#### Mobile Enhancements
- **Bottom Sheet**: Collapsible stats and history panel
- **Swipe Gestures**: Global gesture recognition with haptic feedback
- **Double-tap Actions**: Quick check/call on table double-tap
- **Orientation Support**: Seamless portrait/landscape transitions

### 5. Visual Excellence

#### Card System (`client/src/components/PlayingCard.tsx`)
- **SVG-based Cards**: Scalable vector graphics with suit symbols (♠♥♦♣)
- **Smooth Animations**: Card dealing with arc trajectories
- **3D Effects**: Flip animations with perspective transforms
- **Colorblind Support**: Pattern-based suit differentiation
- **Highlight System**: Winning cards glow effect

#### Chip Physics (`client/src/components/ChipPhysics.tsx`)
- **Realistic Movement**: Gravity-based chip physics with collision detection
- **Betting Animations**: Chips slide from player to pot with realistic arcs
- **All-in Effects**: Dramatic chip avalanche for all-in bets
- **Winner Celebrations**: Chips fly from pot to winner with particle effects
- **Stacking System**: Proper chip stacking with wobble settle animations

#### Visual Themes
- **Crypto Gaming Aesthetic**: Neon borders, glow orbs, grid overlays
- **Particle Systems**: Ambient floating particles and celebration effects
- **Dynamic Lighting**: Phase-based lighting changes and winner spotlights
- **Smooth Transitions**: Framer Motion animations for all state changes

### 6. Audio System (`client/src/hooks/useSound.ts`)
Comprehensive audio implementation:
- **Game Sounds**: Card dealing, chip placement, button clicks
- **Dynamic Volume**: User-controlled volume with settings persistence
- **Spatial Audio**: Different sounds for different actions
- **Victory Sounds**: Celebration audio based on win amount
- **Background Ambience**: Subtle casino atmosphere (optional)

### 7. Advanced Features

#### Achievement System (`client/src/lib/achievementEngine.ts`)
- **Progress Tracking**: Hands won, biggest pot, consecutive wins
- **Achievement Types**: Hand-based, milestone, and play-style achievements
- **Visual Rewards**: Toast notifications with achievement unlocks
- **Persistence**: Save achievements to local storage and backend

#### Tournament Mode (`client/src/pages/tournament-game.tsx`)
- **Sit & Go**: 6-player knockout tournaments
- **Blind Progression**: Increasing blinds with timer
- **Elimination Tracking**: Player elimination with payout structure
- **Multi-table Support**: Table balancing and final table mechanics

#### Statistics & Analytics
- **Performance Metrics**: Win rate, bankroll trends, hand distribution
- **Visual Charts**: Hand distribution graphs and performance trends
- **Session Tracking**: Detailed game history and pattern analysis
- **Comparative Stats**: Performance against AI difficulty levels

### 8. Telegram Integration (`server/telegram.ts`)

#### Authentication System
- **HMAC Verification**: Secure Telegram initData validation
- **Auto-login**: Seamless authentication from Telegram Mini App
- **Dual Mode**: Telegram mode vs standalone browser demo mode
- **Session Management**: HTTP-only cookies with 7-day expiry

#### Database Schema (`server/db.ts`)
```sql
CREATE TABLE telegram_users (
  id BIGINT PRIMARY KEY,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  username VARCHAR(255),
  bankroll INTEGER DEFAULT 1000,
  hands_played INTEGER DEFAULT 0,
  hands_won INTEGER DEFAULT 0,
  biggest_pot_won INTEGER DEFAULT 0,
  total_winnings BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  telegram_user_id BIGINT REFERENCES telegram_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

## Technical Implementation Requirements

### State Management
- **React Hooks**: useState, useEffect, useCallback for performance
- **Context API**: Theme and settings management
- **Local Storage**: Game state persistence and settings
- **Session Recovery**: Automatic game state restoration

### Performance Optimization
- **React.memo**: Memoized components for expensive renders
- **useMemo/useCallback**: Optimized calculations and event handlers
- **Lazy Loading**: Code splitting for non-critical components
- **Animation Performance**: 60fps animations with GPU acceleration

### Accessibility Implementation
- **ARIA Labels**: Comprehensive screen reader support
- **Keyboard Navigation**: Full keyboard operability
- **Focus Management**: Proper focus order and indicators
- **Color Contrast**: WCAG 2.1 AA compliance
- **Reduced Motion**: Respect user motion preferences

### Mobile Optimizations
- **Touch Gestures**: Comprehensive swipe and tap recognition
- **Haptic Feedback**: iOS haptic patterns for different actions
- **Safe Areas**: Dynamic safe area handling with CSS variables
- **Performance**: Optimized for mobile CPU and battery life
- **Offline Support**: Service worker for offline gameplay

## Advanced AI Behaviors

### Bluffing System
- **Context Analysis**: Board texture, position, stack depth consideration
- **Frequency Control**: Personality-based bluffing frequencies
- **Multi-street Narratives**: Consistent bluff stories across streets
- **Fold Equity Calculation**: Dynamic bluff sizing based on fold equity

### Meta-Game Features
- **Table Image Tracking**: Monitor each player's playing style
- **Exploit Detection**: Identify and exploit player weaknesses
- **Counter-strategies**: Adjust when being exploited
- **Dynamic Adaptation**: Real-time strategy adjustments

### Difficulty System
- **Auto-adjustment**: Dynamic difficulty based on player performance
- **Rubber-band System**: Prevent player frustration or boredom
- **Skill Levels**: Easy, Normal, Hard, Expert with different behaviors
- **Performance Tracking**: Win rate monitoring for adjustments

## UI/UX Specifications

### Design System
- **Color Palette**: Dark mode with poker green (#228B22) felt
- **Typography**: Inter font family with responsive scaling
- **Spacing**: 8px grid system using Tailwind utilities
- **Borders**: Consistent border radius (4px-12px)
- **Shadows**: Layered shadows for depth and elevation

### Responsive Breakpoints
```css
/* Mobile Portrait */
@media (max-width: 767px) {
  table-aspect: 1.9/1;
  /* Stacked layout */
}

/* Mobile Landscape */
@media (min-width: 768px) and (max-width: 1023px) {
  table-aspect: 1.85/1;
  /* Two-column layout */
}

/* Desktop */
@media (min-width: 1024px) {
  table-aspect: 3/2;
  /* Three-column layout */
}
```

### Player Positioning Algorithm
```typescript
const getPlayerPosition = (index: number, totalPlayers: number) => {
  const angle = (index * 2 * Math.PI) / totalPlayers;
  const radiusX = tableWidth * 0.4;
  const radiusY = tableHeight * 0.35;
  return {
    x: Math.cos(angle) * radiusX + tableWidth / 2,
    y: Math.sin(angle) * radiusY + tableHeight / 2
  };
};
```

## Development Guidelines

### Code Quality Standards
- **TypeScript**: Strict mode with comprehensive typing
- **ESLint + Prettier**: Consistent code formatting
- **Component Structure**: Modular, reusable components
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: 60fps animations, <3s load times

### Testing Requirements
- **Component Tests**: React Testing Library for UI components
- **Game Logic Tests**: Unit tests for poker engine
- **Integration Tests**: End-to-end gameplay scenarios
- **Accessibility Tests**: Screen reader and keyboard testing
- **Performance Tests**: Mobile performance benchmarking

### Security Implementation
- **Input Validation**: All user inputs sanitized
- **CSRF Protection**: Secure API endpoints
- **Rate Limiting**: Prevent API abuse
- **Secure Headers**: Proper security headers
- **SQL Injection Prevention**: Parameterized queries

## API Endpoints (`server/routes.ts`)
```typescript
// Authentication
POST /api/telegram/auth      // Telegram login
GET  /api/session           // Current session
POST /api/logout            // Logout

// User Management
GET  /api/users/me/stats    // User statistics
PUT  /api/users/me/bankroll // Update bankroll
PATCH /api/users/me/stats   // Update game stats

// Game Features
GET  /api/health            // Health check
POST /api/achievements      // Achievement tracking
```

## Deployment Specifications

### Environment Setup
- **Node.js**: Latest LTS version
- **Database**: PostgreSQL with connection pooling
- **Environment Variables**: Secure config management
- **Static Assets**: Optimized for CDN delivery

### Production Optimizations
- **Bundle Analysis**: Webpack bundle optimization
- **Compression**: Gzip/Brotli compression
- **Caching**: Proper cache headers
- **Monitoring**: Error tracking and performance monitoring

## Success Criteria

### Performance Metrics
- **Load Time**: <3 seconds initial load
- **Animation**: 60fps on mobile devices
- **Memory Usage**: <100MB peak memory
- **Bundle Size**: <2MB total JavaScript

### User Experience
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile**: Native-like mobile experience
- **Offline**: Basic functionality without internet
- **Cross-browser**: Support for modern browsers

### Game Quality
- **AI Behavior**: Realistic, challenging opponents
- **Game Flow**: Smooth, intuitive gameplay
- **Visual Polish**: Professional casino appearance
- **Audio**: Immersive sound design

## Implementation Timeline

### Week 1-2: Foundation
1. Project setup and basic structure
2. Game engine core logic
3. Basic UI components
4. Player positioning and table layout

### Week 3-4: Game Logic
1. Complete poker rules implementation
2. AI system with basic personalities
3. Hand evaluation and winner determination
4. Pot calculation and distribution

### Week 5-6: UI/UX Polish
1. Advanced animations and transitions
2. Mobile optimizations and gestures
3. Audio system implementation
4. Visual effects and polish

### Week 7-8: Advanced Features
1. Tournament mode
2. Achievement system
3. Statistics and analytics
4. Telegram integration

### Week 9-10: Testing & Deployment
1. Comprehensive testing
2. Performance optimization
3. Accessibility compliance
4. Production deployment

## Final Notes

This prompt creates a complete, production-ready Texas Hold'em poker application that rivals commercial poker games. The implementation should focus on:

1. **Mobile-first Design**: Every feature must work perfectly on mobile
2. **Realistic AI**: Sophisticated bot behavior with personalities
3. **Visual Excellence**: Professional casino-quality animations
4. **Performance**: 60fps animations and smooth gameplay
5. **Accessibility**: Full support for users with disabilities

The resulting application should be indistinguishable from a professionally developed poker game, with attention to every detail from chip physics to AI psychology.

**Estimated Development Time**: 400-500 hours
**Team Size**: 3-5 developers recommended
**Target Completion**: 8-10 weeks for full implementation

This comprehensive specification ensures the recreation maintains all the sophisticated features and polish of the original application.
