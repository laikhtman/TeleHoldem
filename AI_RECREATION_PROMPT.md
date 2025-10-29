
# AI Recreation Prompt: Texas Hold'em Poker Web Application

## Project Overview
Create a complete, production-ready Texas Hold'em poker web application with the following architecture and features:

## Tech Stack Requirements
- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion for smooth card dealing, chip movements, and transitions
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Telegram Mini App integration with HMAC-SHA256 verification
- **Audio**: HTML5 Audio API for game sounds
- **Mobile**: Full responsive design with iOS safe area support

## Project Structure
```
├── client/src/
│   ├── components/     # All React components
│   ├── pages/         # Main game page and routes
│   ├── lib/           # Game logic, utilities, AI
│   ├── hooks/         # Custom React hooks
│   └── contexts/      # React contexts
├── server/            # Express backend
├── shared/            # Shared TypeScript schemas
├── docs/              # Documentation
└── scripts/           # Build and test scripts
```

## Core Game Features to Implement

### 1. Game Engine (`client/src/lib/gameEngine.ts`)
Create a complete Texas Hold'em engine with:
- 52-card deck with shuffle algorithm
- 6-player maximum (human + 5 AI bots)
- Complete betting rounds (pre-flop, flop, turn, river)
- Pot management with side pots for all-in scenarios
- Hand evaluation system (royal flush down to high card)
- Winner determination and pot distribution
- Blinds management (small blind, big blind)

### 2. AI Bot Logic (`client/src/lib/botAI.ts`)
Implement realistic bot behavior:
- Position-aware play (tight early position, looser late position)
- Hand strength evaluation
- Pot odds calculations
- Bluffing frequency based on game phase
- Different personality types (tight/loose, aggressive/passive)
- Realistic thinking delays (800ms average)

### 3. Hand Evaluator (`client/src/lib/handEvaluator.ts`)
Complete poker hand ranking system:
- Royal flush, straight flush, four of a kind, full house
- Flush, straight, three of a kind, two pair, one pair, high card
- Kicker comparison for tied hands
- Side pot calculations for multiple all-ins

## User Interface Requirements

### 4. Main Game Layout (`client/src/pages/poker-game.tsx`)
- Oval poker table with wood border and green felt
- 6 player seats positioned trigonometrically around table
- Community cards area in center
- Pot display above community cards
- Action controls at bottom with safe area padding
- Responsive design for mobile-first experience

### 5. Core Components

#### Playing Cards (`client/src/components/PlayingCard.tsx`)
- SVG-based cards with suits (♠♥♦♣) and ranks (2-A)
- Smooth dealing animations from deck position
- Card flip animations with 3D rotation effect
- Face-down cards for opponents, face-up for player
- Responsive sizing for different screen sizes

#### Player Seats (`client/src/components/PlayerSeat.tsx`)
- Player name, chip count, and current bet display
- Two hole cards per player
- Dealer button indicator
- Current player turn highlighting with pulsing glow
- Fold/all-in/eliminated state indicators
- Action labels (fold, check, call, bet, raise, all-in)

#### Action Controls (`client/src/components/ActionControls.tsx`)
- Fold, Check/Call, Bet/Raise buttons
- Betting slider with quick-bet options (1/2 pot, 3/4 pot, pot, all-in)
- Keyboard shortcuts (F=fold, C=check/call, R=raise, A=all-in)
- Disabled states when not player's turn
- Mobile-optimized touch targets (minimum 48px)

#### Community Cards (`client/src/components/CommunityCards.tsx`)
- 5 card placeholders with staggered reveal animations
- Flop (3 cards), turn (1 card), river (1 card)
- Card dealing with realistic arc trajectories
- Smooth transitions between betting rounds

### 6. Mobile Features

#### Mobile Bottom Sheet (`client/src/components/MobileBottomSheet.tsx`)
Collapsible sheet with tabs:
- **Essential**: Current hand strength, pot odds
- **Detailed**: Session stats, achievements
- **History**: Action history, previous hands
- Swipe gestures for open/close
- Floating action button for quick access

#### Swipe Gestures (`client/src/hooks/useSwipe.ts`)
- Swipe left to fold
- Swipe right to check/call
- Visual feedback with swipe hints
- Haptic feedback on iOS devices

#### Safe Area Support
- iOS notch and home indicator awareness
- CSS variables: `--safe-area-top`, `--safe-area-bottom`, etc.
- Proper padding for fixed positioned elements

## Advanced Features

### 7. Telegram Integration (`server/telegram.ts`)
- HMAC-SHA256 signature verification
- User authentication with Telegram profile
- Persistent bankroll and stats storage
- Session management with HTTP-only cookies
- Demo mode for non-Telegram users

### 8. Animation System
- Framer Motion for all animations
- Card dealing from deck position to players
- Chip movements with parabolic trajectories  
- Winner celebration effects
- Turn indicators with pulsing glow
- Smooth transitions between game phases

### 9. Audio System (`client/src/hooks/useSound.ts`)
- Card dealing sounds
- Chip placement and movement audio
- Button click feedback
- Win/lose sound effects
- Volume control in settings

### 10. Accessibility Features
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements for game state
- High contrast mode
- Colorblind-friendly card indicators
- Text scaling support

## Technical Implementation Details

### State Management
Use React hooks and context for:
- Game state (cards, players, pot, phase)
- Settings (sound, theme, animation speed)
- UI state (panels, modals, loading states)

### Performance Optimizations
- React.memo for expensive components
- useCallback for event handlers
- Efficient re-renders with proper dependencies
- GPU-accelerated animations using CSS transforms
- Lazy loading for non-critical components

### Database Schema (`server/db.ts`)
```sql
-- Telegram users table
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

-- Sessions table for authentication
CREATE TABLE sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  telegram_user_id BIGINT REFERENCES telegram_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### API Endpoints (`server/routes.ts`)
- `POST /api/telegram/auth` - Telegram authentication
- `GET /api/session` - Get current session
- `POST /api/logout` - Logout user
- `GET /api/users/me/stats` - Get user statistics
- `PUT /api/users/me/bankroll` - Update user bankroll

## UI/UX Specifications

### Design System
- **Colors**: Dark mode with poker table green (#228B22)
- **Typography**: Inter font family, responsive sizes
- **Spacing**: 8px grid system with Tailwind classes
- **Borders**: Rounded corners (4px-12px depending on element)
- **Shadows**: Subtle shadows for depth and elevation

### Responsive Breakpoints
- **Mobile**: < 768px (portrait priority)
- **Tablet**: 768px - 1023px  
- **Desktop**: ≥ 1024px

### Table Scaling
- Mobile portrait: 1.7:1 aspect ratio
- Mobile landscape: 1.8:1 aspect ratio  
- Desktop: 3:2 aspect ratio
- Maximum width: 90-95% of viewport

### Player Positioning Algorithm
Use trigonometric distribution around oval:
```javascript
const getPosition = (index: number, total: number) => {
  const angle = (index * 2 * Math.PI) / total;
  const radiusX = tableWidth * 0.4;
  const radiusY = tableHeight * 0.35;
  const x = Math.cos(angle) * radiusX + tableWidth / 2;
  const y = Math.sin(angle) * radiusY + tableHeight / 2;
  return { x, y };
};
```

## Quality Assurance Requirements

### Testing Strategy
- Component testing with React Testing Library
- E2E testing with Playwright
- Cross-device compatibility testing
- Accessibility compliance (WCAG 2.1 AA)
- Performance benchmarks (60fps animations)

### Browser Support
- Chrome/Safari mobile (iOS 12+)
- Chrome/Firefox desktop
- Telegram WebView compatibility
- Progressive enhancement for older browsers

## Development Guidelines

### Code Quality
- TypeScript strict mode enabled
- ESLint + Prettier configuration
- Consistent naming conventions
- Comprehensive error handling
- Performance monitoring

### Security
- Input validation on all forms
- CSRF protection with proper headers
- Rate limiting on API endpoints
- Secure session management
- SQL injection prevention

## Deployment Requirements
- Environment variables for database and Telegram bot token
- Production build optimization
- Static asset compression
- Health check endpoints
- Graceful error handling and recovery

## Success Criteria
The final application should:
- ✅ Run smoothly on mobile devices at 60fps
- ✅ Handle 6-player games with realistic AI opponents
- ✅ Provide intuitive touch controls and gestures
- ✅ Integrate seamlessly with Telegram Mini Apps
- ✅ Support both authenticated and demo modes
- ✅ Meet accessibility standards
- ✅ Scale responsively across all device sizes
- ✅ Provide engaging animations and audio feedback

## Final Notes
This is a complete, production-ready poker application. Pay special attention to:
1. Mobile-first responsive design
2. Smooth animations and transitions
3. Realistic game mechanics and AI behavior
4. Proper error handling and edge cases
5. Accessibility and performance optimization

The codebase should be well-organized, thoroughly commented, and follow modern React/TypeScript best practices. All components should be reusable and maintainable for future enhancements.
