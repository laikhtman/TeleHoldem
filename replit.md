# Texas Hold'em Poker Web Application

## Overview
A complete Texas Hold'em poker web application featuring a realistic poker table interface, AI bot opponents, and full game mechanics. Built with React, TypeScript, and Tailwind CSS.

## Recent Changes
- **October 19, 2025**: Gameplay Polish
  - Refined betting logic to differentiate between call, bet, and raise.
  - Improved game loop to handle end-of-round phase progression correctly.
  - Made player action controls dynamic based on the current bet.
  - Added a visual "WINNER" badge to the winning player's seat after a hand.
- **October 18, 2025**: Initial implementation
  - Created complete poker game engine with deck management, card dealing, and game state tracking
  - Implemented AI bot logic with decision-making for fold/check/bet/raise actions
  - Built all React components: PokerTable, PlayingCard, PlayerSeat, CommunityCards, ActionControls, PotDisplay
  - Configured poker-themed design tokens (green felt table, card colors, chip gold)
  - Added animations for card dealing, pot updates, and player turn indicators

## Project Architecture

### Frontend Structure
- **`/client/src/pages/poker-game.tsx`**: Main game page with complete game flow management
- **`/client/src/components/`**: Reusable poker components
  - `PlayingCard.tsx`: Card rendering with suits and colors
  - `PlayerSeat.tsx`: Player position with trigonometric layout around oval table
  - `CommunityCards.tsx`: Five community card display area
  - `ActionControls.tsx`: Fold/Check/Bet controls with slider
  - `PotDisplay.tsx`: Pot amount with chip icon
- **`/client/src/lib/`**: Game logic and utilities
  - `gameEngine.ts`: Core poker game engine (deck, dealing, betting, phase advancement)
  - `botAI.ts`: AI decision-making logic for bot players

### Game Engine
The `GameEngine` class provides:
- Deck creation and shuffling (52 cards with ♠ ♥ ♦ ♣ suits)
- Card dealing to players and community
- Game state management (waiting → pre-flop → flop → turn → river → showdown)
- Player actions (fold, check, bet, raise, all-in)
- Pot management and betting rounds
- Round completion detection

### AI Bot Logic
The `BotAI` class implements:
- Basic decision-making based on game phase and bet amounts
- Random strategy with weighted probabilities
- Support for all poker actions (fold, check, call, bet, raise)

### Data Models (`/shared/schema.ts`)
- **Card**: rank, suit, id
- **Player**: name, chips, hand, bet, folded, allIn, isHuman, position
- **GameState**: players, deck, communityCards, pot, currentPlayerIndex, dealerIndex, phase, currentBet
- **GamePhase**: waiting | pre-flop | flop | turn | river | showdown

## Design System

### Colors
- **Poker Felt**: `140 70% 25%` - Rich forest green table surface
- **Table Border**: `25 35% 28%` - Warm brown wood tone
- **Card Background**: `0 0% 95%` - Off-white for playing cards
- **Chip Gold**: `45 90% 55%` - Casino gold for chips and accents
- **Card Red**: `0 85% 45%` - Classic red for hearts and diamonds
- **Card Black**: `0 0% 10%` - Deep black for spades and clubs

### Animations
- **deal-card**: 0.3s slide-in animation for card dealing
- **pulse-glow**: 2s infinite pulse for active player turn indicator
- **pot-bounce**: 0.2s scale bounce when pot increases

### Layout
- **Poker Table**: 800px × 500px oval with radial gradient
- **Player Positioning**: Trigonometric calculation around oval perimeter
- **Community Cards**: Centered at 45% from top
- **Controls**: Bottom-fixed with backdrop blur

## Game Features

### Core Gameplay
- 6-player Texas Hold'em (1 human + 5 AI bots)
- Complete betting rounds: pre-flop, flop, turn, river
- Player actions: fold, check, call, bet, raise
- Pot tracking and chip management
- Dealer button rotation
- Current player turn indicator with glow animation

### Visual Features
- Realistic green felt poker table with brown border
- Playing cards with proper suit symbols (♠ ♥ ♦ ♣)
- Color-coded suits (red for hearts/diamonds, black for spades/clubs)
- Face-down cards for bot players, face-up for human
- Semi-transparent player seats with chip counts
- Gold-themed chip display with coin icons
- Real-time action notifications via toasts

### Player Controls
- Fold button (red/destructive)
- Check button (when no bet to call)
- Call button (to match current bet)
- Bet/Raise button with adjustable slider
- Bet slider range: minimum bet to all chips
- Disabled controls during bot turns

## Technical Implementation

### State Management
- React `useState` for game state
- Client-side only (no backend persistence)
- Asynchronous bot action processing with delays for realistic timing

### Game Flow
1. Initialize game with 6 players (1000 chips each)
2. Click "Start New Hand" to deal cards
3. Betting round begins with human player or first bot
4. Players act in sequence (fold/check/bet)
5. Round completes when all bets matched
6. Advance to next phase (flop → turn → river)
7. Repeat betting rounds for each phase
8. Showdown determines winner (simplified in PoC)

### Bot Behavior
- Weighted random decisions based on game phase
- More conservative in pre-flop (30% fold, 50% call, 20% raise)
- More aggressive in later phases (20% fold, 55% call, 25% raise)
- Calls when no bet to match (check) 60% of time, bets 40%

## Future Enhancements
- Hand ranking system (royal flush, straight flush, four of a kind, etc.)
- Winner determination and chip distribution
- Multi-hand gameplay with persistent chip counts
- Advanced AI with position-aware strategy
- Hand strength evaluation
- Side pot management for all-in situations
- Showdown animations
- Game statistics (hands won, biggest pot)
- Responsive mobile layout

## Dependencies
- React + TypeScript
- Tailwind CSS for styling
- Radix UI for slider component
- Lucide React for icons
- Shadcn UI components (Button, Slider, Toast)
