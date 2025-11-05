# Texas Hold'em Poker - iOS-Optimized Design Guidelines

## Design Approach: Mobile Poker Room System

**Selected Approach**: iOS-native poker experience following Apple Human Interface Guidelines with poker room aesthetics. Optimized for Telegram Mini App on iPhone Safari (375px-430px widths).

**Core Principle**: Touch-first poker interface where all game elements are thumb-reachable, cards are instantly readable on small screens, and controls feel native to iOS.

---

## Core Design Elements

### Typography
**Font Stack**: SF Pro Display (iOS system font fallback), Inter (Google Fonts CDN backup)

**Hierarchy**:
- Player Names: 13px, 600 weight
- Chip Counts: 15px, 700 weight, tabular-nums
- Pot Display: 20px, 700 weight, tabular-nums
- Card Ranks: 32px, 700 weight (larger for mobile readability)
- Button Text: 17px, 600 weight (Apple HIG standard)
- Game State: 16px, 500 weight

### Color Palette
**Poker Theme** (single mode - dark optimized for iOS):
- Background: `#1C1C1E` (iOS dark background)
- Poker Felt: `hsl(140, 65%, 28%)` - Deep green
- Card Background: `#FFFFFF`
- Pot Gold: `hsl(45, 88%, 58%)`
- Primary Text: `#FFFFFF`
- Secondary Text: `rgba(255, 255, 255, 0.6)`
- Success: `#34C759` (iOS green)
- Danger: `#FF3B30` (iOS red)
- Warning: `#FF9500` (iOS orange)

**Card Suits**: Red suits `#D32F2F`, Black suits `#212121`

### Layout System
**Tailwind Spacing**: Primary units `4, 8, 12, 16, 20` (p-4, p-8, etc.)

**Safe Area Handling**:
- Top: `env(safe-area-inset-top) + 12px` for status bar/Dynamic Island
- Bottom: `env(safe-area-inset-bottom) + 16px` for home indicator
- Sides: `env(safe-area-inset-left/right) + 12px`

**Viewport Strategy**: Use `height: 100dvh` (dynamic viewport height) to account for iOS Safari address bar behavior

---

## iOS-Critical Requirements

### Touch Targets
- **Minimum**: 44pt × 44pt (58.67px @ 1x, 88px @ 2x for iPhone 15 Pro) for all interactive elements
- Action Buttons: 56px height minimum
- Slider thumb: 44px × 44px minimum
- Card tap areas: Full card dimensions plus 8px padding

### Input Handling
**Prevent Zoom**: `font-size: 16px` minimum on all inputs/buttons (iOS Safari zooms on <16px)
**Bet Slider**: Use native iOS range input styling with larger thumb
**Keyboard Avoidance**: Absolute position controls that shift up when keyboard appears

### Performance Optimizations
- Use `transform` and `opacity` only for animations (60fps on A-series chips)
- Maximum 2 simultaneous animations
- Debounce slider to 16ms (60fps frame time)
- Use `will-change` sparingly, remove after animation completes

### Haptic Feedback
Trigger via Telegram Mini App SDK:
- Light haptic: Card dealing
- Medium haptic: Button press
- Heavy haptic: Pot win
- Selection haptic: Slider adjustment

---

## Component Library

### Mobile Poker Table
- **Vertical Layout**: Opponent players stacked top (2-3 visible), human player bottom
- **Felt Area**: Full width, rounded corners 16px, subtle radial gradient
- **Dimensions**: Width 100%, height calculated (100dvh - controls - safe areas)

### Playing Cards
- **Size**: 56px × 80px (optimal for iPhone screens)
- **Border-radius**: 6px
- **Spacing**: 4px gap between cards
- **Rank/Suit**: Larger symbols (32px) for readability
- **Animation**: 0.25s ease-out slide-in, staggered 80ms

### Player Seats
- **Height**: 72px minimum (fits name + chips + cards)
- **Padding**: 12px
- **Active Border**: 2px gold, no glow (performance)
- **Layout**: Horizontal flex (avatar, name/chips, cards)
- **Turn Indicator**: Solid gold border (no animation to preserve battery)

### Action Controls (Bottom Fixed)
- **Container**: Fixed bottom with safe-area-inset-bottom
- **Background**: Frosted glass effect `backdrop-filter: blur(20px)` with dark overlay
- **Button Grid**: 2×2 or 3-column layout (Fold left, Call center, Raise right)
- **Heights**: 56px buttons, 44px slider thumb
- **Spacing**: 12px between buttons
- **States**: Use iOS-native active states (brightness adjustment, no scale)

### Bet Slider
- **Track Height**: 44px (full touch target)
- **Thumb**: 44px circle with shadow
- **Value Display**: Above slider, 20px font, tabular-nums
- **Min/Max Labels**: Below slider, 13px, secondary color

### Pot Display
- **Position**: Centered above community cards
- **Size**: 20px font, monospace
- **Background**: Semi-transparent dark `rgba(0,0,0,0.6)` with 8px border-radius
- **Icon**: 16px coin stack SVG

### Community Cards Area
- **Layout**: Horizontal centered row, 4px gaps
- **Container Height**: 96px (80px cards + 16px margin)
- **Empty Slots**: 1px dashed border `rgba(255,255,255,0.2)`

---

## Mobile Layout Structure

**Vertical Stack** (top to bottom):
1. **Header Bar** (44px + safe-area-top): Pot display, game state
2. **Opponent Area** (flexible): 2-3 player seats, vertically stacked
3. **Community Cards** (96px): Centered horizontal row
4. **Human Player Seat** (88px): Cards + chips display
5. **Action Controls** (180px + safe-area-bottom): Buttons + slider

**Width Breakpoints**:
- Small (375px): iPhone SE, 12/13 mini - 2 buttons wide
- Medium (390px-393px): iPhone 14/15 Pro - 3 buttons wide  
- Large (430px): iPhone 14/15 Pro Max - 3 buttons wide with more padding

---

## Accessibility
- VoiceOver labels on all cards: "Ace of Spades", "King of Hearts"
- Button labels: Clear action text "Fold", "Call $50", "Raise"
- Color contrast: 4.5:1 minimum (all text on felt meets WCAG AA)
- Focus indicators: 2px white outline on keyboard navigation
- Reduced motion: Respect `prefers-reduced-motion`, skip card animations

---

## iOS Safari Specific Handling
- Use `100dvh` not `100vh` for viewport height
- Disable pull-to-refresh: `overscroll-behavior-y: contain` on body
- Prevent double-tap zoom: `touch-action: manipulation` on interactive elements
- Fixed positioning: Account for Safari toolbar behavior during scroll
- Momentum scrolling: `-webkit-overflow-scrolling: touch` on scrollable areas

---

## Visual Priorities
1. **Community Cards** - Central focus, large and readable
2. **Action Buttons** - Thumb zone, always accessible
3. **Pot Amount** - Persistent visibility in header
4. **Player Chips** - Clear, tabular numbers
5. **Turn Indicator** - Obvious but not distracting

This mobile-first design creates a thumb-optimized poker experience that feels native to iOS while maintaining poker room authenticity.