# Texas Hold'em Poker Web Application - Design Guidelines

## Design Approach: Poker Room Aesthetic System

**Selected Approach**: Custom poker-themed design system inspired by professional poker rooms and casino environments, prioritizing clarity, readability, and authentic poker table experience.

**Core Principle**: Create an immersive yet functional poker environment where game state is always clear, cards are instantly readable, and controls are intuitive.

---

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (default):
- Background: `222 15% 12%` - Deep charcoal for ambient environment
- Poker Table Felt: `140 70% 25%` - Rich forest green
- Table Border: `25 35% 28%` - Warm brown wood tone
- Card Background: `0 0% 95%` - Off-white for cards
- Pot/Chip Gold: `45 90% 55%` - Casino gold accent

**Text & UI Elements**:
- Primary Text: `0 0% 98%` - Near white
- Secondary Text: `0 0% 70%` - Muted gray
- Success (Win): `140 60% 50%` - Bright green
- Danger (Fold): `0 70% 55%` - Casino red
- Warning (Bet): `45 90% 55%` - Gold

**Card Suits**:
- Red Suits (♥ ♦): `0 85% 45%` - Classic card red
- Black Suits (♠ ♣): `0 0% 10%` - Deep black

### B. Typography

**Font Stack**:
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts CDN)
- Monospace: 'JetBrains Mono', monospace (for chip counts, pot)

**Hierarchy**:
- Player Names: 14px, 600 weight
- Chip Counts: 16px, 700 weight, monospace
- Pot Display: 24px, 700 weight, monospace
- Card Ranks: 28px, 700 weight
- Button Text: 16px, 600 weight
- Game State Messages: 18px, 500 weight

### C. Layout System

**Tailwind Spacing Primitives**: Consistently use units of `2, 4, 8, 12, 16` (p-2, p-4, p-8, etc.)

**Table Structure**:
- Table Container: 800px × 500px oval (200px border-radius on ends)
- Player Positions: Calculated via trigonometry around oval perimeter
- Community Cards: Centered horizontally, positioned at 45% from top
- Controls: Fixed bottom position with 20px margin

**Responsive Breakpoints**:
- Desktop: 1024px+ (full table)
- Tablet: 768-1023px (scaled table to 90%)
- Mobile: <768px (portrait layout with stacked controls)

### D. Component Library

**Poker Table**:
- Green felt surface with subtle texture/gradient (radial gradient from center)
- 10px solid brown border with slight inner shadow
- Oval shape using border-radius
- Subtle vignette effect at edges

**Playing Cards**:
- 70px × 100px rounded rectangles (8px border-radius)
- White background with 2px gray border
- Card rank in top-left and bottom-right corners
- Large centered suit symbol
- Back of cards: Geometric pattern in `220 30% 40%` blue
- Card dealing animation: 0.3s ease slide-in from center

**Player Seats**:
- Semi-transparent dark background: `rgba(0, 0, 0, 0.75)`
- 12px border-radius
- 12px padding
- Active player: 3px gold border `45 90% 55%`
- Current turn indicator: Pulsing gold glow animation

**Chip Stack Displays**:
- Monospace font for amounts
- Chip icon (circular SVG) next to count
- Color-coded by amount: white (<100), red (100-499), blue (500-999), black (1000+)

**Action Buttons**:
- Height: 48px, min-width: 120px
- Border-radius: 8px
- Font-weight: 600
- Fold: Background `0 0% 25%`, hover `0 0% 30%`
- Check/Call: Background `140 50% 40%`, hover `140 50% 45%`
- Bet/Raise: Background `45 85% 50%`, hover `45 85% 55%`
- Active state: Scale down to 0.95 on click

**Bet Slider**:
- Custom styled range input
- Track: 4px height, `0 0% 40%` background
- Filled portion: Gold gradient
- Thumb: 20px circle, gold with shadow
- Current bet amount displayed inline with slider

**Pot Display**:
- Central position above community cards
- Dark background with gold text
- Coin stack icon prefix
- Animated when pot increases (brief scale pulse)

**Community Card Area**:
- 5 card placeholders always visible
- Cards deal from center with stagger (0.1s delay between each)
- Empty slots: Dashed border outline

**Game State Notifications**:
- Toast-style messages for dealer actions
- Top-center position, slide down animation
- Semi-transparent dark background
- Auto-dismiss after 3 seconds

### E. Interactions & Animations

**Minimalist Approach** - Use only essential animations:

**Critical Animations**:
1. Card Dealing: 0.3s ease-out slide from deck position
2. Current Player Turn: Subtle 2s pulse on player seat border
3. Pot Update: 0.2s scale bounce when chips added
4. Button Feedback: 0.1s scale on click

**Avoid**: Background animations, rotating elements, particle effects, unnecessary transitions

---

## Special Implementation Notes

**Player Positioning Algorithm**:
- 6 players around oval table
- Calculate using trigonometric positioning (Math.sin, Math.cos)
- Player 0 (human): Bottom center
- Players 1-5: Distributed clockwise

**Card Visibility Rules**:
- Human player: Cards always face-up
- Bot players: Cards face-down until showdown
- Community cards: Deal sequentially (3 flop, 1 turn, 1 river)

**Accessibility**:
- All interactive elements min 44px touch target
- High contrast between text and backgrounds (4.5:1 minimum)
- Keyboard navigation for all controls (Tab order: Fold → Check → Bet → Slider)
- ARIA labels for screen readers on card elements

**Performance Considerations**:
- Use CSS transforms for animations (GPU accelerated)
- Limit simultaneous animations to 3
- Debounce slider input events
- Use requestAnimationFrame for smooth card dealing

---

## Visual Hierarchy Priorities

1. **Community Cards** - Central focus, largest visual weight
2. **Current Player** - Clear turn indicator
3. **Pot Amount** - Always visible and prominent
4. **Player Chip Counts** - Secondary but readable
5. **Action Controls** - Accessible but not distracting

This design creates an authentic, focused poker experience that prioritizes gameplay clarity while maintaining the atmosphere of a professional poker table.