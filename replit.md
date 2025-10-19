# Texas Hold'em Poker Web Application

## Overview
A complete Texas Hold'em poker web application featuring a realistic poker table interface, AI bot opponents, and full game mechanics. Built with React, TypeScript, and Tailwind CSS.

## Recent Changes
- **October 19, 2025**: Professional Layout Refactoring + Visual Polish
  - **Layout Architecture**: Transformed from cramped 3-column grid to centered flexbox design with poker table as focal point
  - **Table Dimensions**: Upgraded to lg:min-h-[70vh] with 3:2 aspect ratio for professional proportions and better screen utilization
  - **Player Positioning**: Percentage-based calculations with 12% buffer zone to prevent overlap and ensure even spacing around table oval
  - **Z-Index System**: Established CSS variable-based layering (--z-table-base through --z-modals) for proper element stacking across all components
  - **Sidebar Redesign**: Lighter bg-card/70 with backdrop blur, collapsible mobile view with proper pointer-events management to prevent click interception
  - **Responsive Layout**: Mobile-first design with proper breakpoints, collapsible panels, and fixed toggle buttons for sidebar access
  - **Critical Fixes**: calculatePots deep copy bug (was mutating player bets), mobile pointer-events issue (collapsed sidebars blocking clicks), winner mapping (Player objects vs indices)
  
- **October 19, 2025**: Comprehensive UI/UX Enhancement & Polish + Sound Design
  - **Enhanced Card Animations**: Staggered dealing from deck (0.15s delays), 3D flip rotations (0.4s), staggered flop reveals (0.2s delays), turn/river slide-ins with glow effects
  - **Chip Movement & Betting**: Arc trajectory animations from seats to pot (0.6s), pot to winner (0.9s), animated chip counters with smooth transitions, chip stack visuals
  - **Player Interaction Feedback**: Button hover glow effects, press scale animations (0.95x), enhanced pulsing for current player, shake animation for invalid actions
  - **Advanced Action Controls**: Quick bet buttons (1/2 pot, pot, all-in), keyboard shortcuts (F=fold, C=check/call, R=raise, A=all-in), bet amount display with pot percentage and risk warnings
  - **Game State Communication**: Contextual toast notifications with icons, winner celebration with confetti/coins/trophy, phase transition effects with golden glow
  - **Table Atmosphere**: Realistic felt texture with noise pattern, polished wood grain border, ambient lighting effects, subtle shadows and depth
  - **Hand Strength Indicator**: Real-time hand evaluation showing current hand rank (1-10), draw detection (flush/straight draws with outs), color-coded strength badges, animated improvement feedback
  - **Action History Sidebar**: Complete event tracking, phase-grouped chronological display, player action highlighting, scrollable with sticky headers
  - **Sound Design System**: Web Audio API integration with singleton AudioContext, 12 sound types (card dealing/flip/shuffle, chip movements, player actions, victory fanfare), procedurally generated tones, volume-balanced audio feedback
  - **Bug Fixes**: Card animation state management, keyboard shortcut stale closures, useAnimatedCounter runaway re-renders, useShake cleanup on unmount, AudioContext singleton pattern to avoid browser limits, React hook TDZ errors
- **October 18, 2025**: Initial implementation
  - Created complete poker game engine with deck management, card dealing, and game state tracking
  - Implemented AI bot logic with decision-making for fold/check/bet/raise actions
  - Built all React components: PokerTable, PlayingCard, PlayerSeat, CommunityCards, ActionControls, PotDisplay
  - Configured poker-themed design tokens (green felt table, card colors, chip gold)
  - Added basic animations for card dealing, pot updates, and player turn indicators

## Project Architecture

### Frontend Structure
- **`/client/src/pages/poker-game.tsx`**: Main game page with complete game flow management, action history tracking
- **`/client/src/components/`**: Reusable poker components
  - `PlayingCard.tsx`: Card rendering with suits, colors, flip and deal animations
  - `PlayerSeat.tsx`: Player position with trigonometric layout, chip animations, win indicators
  - `CommunityCards.tsx`: Five community card display with staggered reveals and glow effects
  - `ActionControls.tsx`: Advanced betting interface with quick buttons, keyboard shortcuts, validation
  - `PotDisplay.tsx`: Pot amount with chip stack visualization and animations
  - `HandStrengthIndicator.tsx`: Real-time hand evaluation with draw detection and strength display
  - `ActionHistory.tsx`: Scrollable sidebar showing chronological game events
  - `Chip.tsx`: Flying chip animations, chip stacks, and visual effects
  - `WinnerCelebration.tsx`: Confetti and trophy celebration animations
- **`/client/src/lib/`**: Game logic and utilities
  - `gameEngine.ts`: Core poker game engine (deck, dealing, betting, phase advancement)
  - `handEvaluator.ts`: Hand ranking and strength evaluation with draw detection
  - `botAI.ts`: AI decision-making logic for bot players
- **`/client/src/hooks/`**: Custom React hooks
  - `useAnimatedCounter.ts`: Smooth number transitions for chip counts
  - `useShake.ts`: Reusable shake animation for invalid actions
  - `useSound.ts`: Web Audio API integration with singleton AudioContext pattern

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
- **GameState**: players, deck, communityCards, pot, currentPlayerIndex, dealerIndex, phase, currentBet, actionHistory
- **GamePhase**: waiting | pre-flop | flop | turn | river | showdown
- **ActionHistoryEntry**: id, type, playerName, action, amount, phase, timestamp, message
- **ActionHistoryType**: player-action | phase-change | cards-dealt | pot-award | blinds-posted
- **HandEvaluation**: hand (current made hand), rank (1-10), description, flushDraw, straightDraw
- **DrawInfo**: hasFlushDraw, flushSuit, hasStraightDraw, straightType, outs

## Design System

### Colors
- **Poker Felt**: `140 70% 25%` - Rich forest green table surface
- **Table Border**: `25 35% 28%` - Warm brown wood tone
- **Card Background**: `0 0% 95%` - Off-white for playing cards
- **Chip Gold**: `45 90% 55%` - Casino gold for chips and accents
- **Card Red**: `0 85% 45%` - Classic red for hearts and diamonds
- **Card Black**: `0 0% 10%` - Deep black for spades and clubs

### Animations
- **Card Animations**:
  - `deal-card`: Staggered card dealing from deck position (0.15s delays)
  - `card-flip`: 3D rotation flip animation (0.4s) for card reveals
  - `flop-reveal`: Staggered flop card reveals with 0.2s delays
  - `turn-river-slide`: Slide-in animations for turn and river cards
  - Card glow effects on reveal
- **Chip Animations**:
  - `chip-fly`: Arc trajectory from player seats to pot (0.6s cubic bezier)
  - `chip-award`: Pot to winner animation (0.9s)
  - `chip-count`: Smooth number counting transitions (0.5s ease-out)
  - `chip-shimmer`: Reflective shine on chips
  - `chip-stack`: Visual chip stack representation
- **Player Feedback**:
  - `pulse-glow`: Enhanced pulsing for current player turn (2s infinite)
  - `button-hover-glow`: Subtle glow on button hover
  - `button-press`: Scale animation on button press (0.95x)
  - `shake`: Horizontal shake for invalid actions (0.4s)
  - `flash-border`: Red border flash for errors
- **Game Events**:
  - `winner-celebration`: Confetti, coins, and trophy animations
  - `phase-transition`: Golden glow effects between game phases
  - `pot-bounce`: Scale bounce when pot increases
  - `win-indicator`: Floating "+$XXX" with scale animation
  - `hand-improvement`: Scale animation when hand strength improves

### Layout
- **Poker Table**: 800px × 500px oval with radial gradient
- **Player Positioning**: Trigonometric calculation around oval perimeter
- **Community Cards**: Centered at 45% from top
- **Controls**: Bottom-fixed with backdrop blur

### Sound Design
- **Implementation**: Web Audio API with singleton AudioContext pattern
- **Architecture**: Module-scope AudioContext shared across all components to avoid browser limits (max 6 contexts)
- **Sound Types** (12 total):
  - **Card Sounds**: 
    - `card-deal` (200Hz, 0.15s) - Card dealing from deck
    - `card-flip` (300Hz, 0.2s) - Card flip reveal
    - `card-shuffle` (150Hz, 0.3s) - Deck shuffling
  - **Chip Sounds**:
    - `chip-place` (400Hz, 0.1s) - Chip placement
    - `chip-collect` (350Hz, 0.15s) - Chip collection
    - `chip-stack` (380Hz, 0.08s) - Chip stacking
  - **Action Sounds**:
    - `fold` (250Hz, 0.2s) - Player fold action
    - `check` (320Hz, 0.15s) - Player check action
    - `raise` (450Hz, 0.25s) - Player raise/bet action
    - `button-click` (500Hz, 0.1s) - UI button interactions
  - **Victory Sounds**:
    - `victory-small` (ascending 440→550→660Hz, 0.6s) - Wins under $100
    - `victory-big` (ascending 440→587→740Hz, 1.0s) - Wins over $100
- **Volume Levels**: 0.1-0.35 range for balanced audio feedback
- **Procedural Generation**: All sounds synthesized using oscillators (no audio files)
- **Integration Points**:
  - PlayingCard: deal/flip sounds on card animations
  - Chip/FlyingChip: placement/collection sounds on chip movements
  - ActionControls: fold/check/raise/button-click on player actions
  - WinnerCelebration: victory fanfare based on win amount
  - poker-game: shuffle sound on new hand start

## Game Features

### Core Gameplay
- 6-player Texas Hold'em (1 human + 5 AI bots)
- Complete betting rounds: pre-flop, flop, turn, river
- Player actions: fold, check, call, bet, raise
- Pot tracking and chip management
- Dealer button rotation
- Current player turn indicator with glow animation

### Visual Features
- **Table Atmosphere**:
  - Realistic green felt texture with subtle noise pattern
  - Polished wood grain border with authentic gradients
  - Ambient lighting effects with inner shadows
  - Subtle vignette for depth
  - Multiple z-index layers for proper element stacking
- **Cards & Chips**:
  - Playing cards with proper suit symbols (♠ ♥ ♦ ♣) and 3D flip animations
  - Color-coded suits (red for hearts/diamonds, black for spades/clubs)
  - Face-down cards for bot players, face-up for human
  - Animated chip stacks with reflective shine
  - Flying chips with arc trajectories
  - Smooth chip counter animations
- **Player Interface**:
  - Semi-transparent player seats with elevation shadows
  - Animated chip counts and bet displays
  - Winner badges and celebration effects
  - Current player pulsing glow indicator
  - Action feedback notifications (fold, bet, raise)
  - Win amount indicators (+$XXX)
- **Information Display**:
  - Real-time hand strength indicator with color-coded badges
  - Draw detection (flush draw, straight draw) with outs counting
  - Action history sidebar with phase grouping
  - Contextual toast notifications with icons
  - Phase transition announcements

### Player Controls
- **Basic Actions**:
  - Fold button (red/destructive) with hover glow
  - Check button (when no bet to call)
  - Call button (to match current bet)
  - Bet/Raise button with context-aware labeling
- **Advanced Betting**:
  - Adjustable bet slider with smooth transitions
  - Quick bet buttons: 1/2 Pot, Pot, All-In
  - Bet amount display with pot percentage
  - Risk warnings for large bets (>50% of stack)
  - Real-time validation with shake feedback
- **Keyboard Shortcuts**:
  - F: Fold
  - C: Check/Call
  - R: Raise/Bet
  - A: All-In
- **Visual Feedback**:
  - Button press scale animations
  - Disabled state during bot turns
  - Shake animation for invalid actions
  - Border flash for validation errors

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
- Framer Motion for animations
- Radix UI components (Slider, ScrollArea, Toast, etc.)
- Lucide React for icons
- Shadcn UI components (Button, Slider, Toast, Badge, Card)
- React Hook Form for form validation
- Zod for schema validation
