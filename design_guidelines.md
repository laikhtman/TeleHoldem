# Texas Hold'em Poker - Crypto/Web3 Design Guidelines

## Design Approach: Futuristic Crypto Gaming Experience

**Selected Approach**: Behance-inspired crypto gaming aesthetic with glass morphism, neon accents, and sophisticated lighting effects. iOS-optimized for Telegram Mini App (375px-430px widths).

**Core Principle**: Premium web3 poker interface combining futuristic visual effects with thumb-optimized mobile controls and instant readability.

---

## Core Design Elements

### Typography
**Font Stack**: SF Pro Display (primary), Inter (fallback via Google Fonts CDN)

**Hierarchy**:
- Player Names: 13px, 600 weight, tracking-wide
- Chip Counts: 16px, 700 weight, tabular-nums, text-shadow glow
- Pot Display: 24px, 800 weight, tabular-nums, purple gradient text
- Card Ranks: 36px, 700 weight
- Action Buttons: 17px, 600 weight, uppercase tracking
- Game State: 14px, 500 weight, opacity-80

### Color Palette - Crypto Dark Theme
**Backgrounds**:
- Primary: `#0A0A0F` (deep space black)
- Secondary: `#13111C` (dark purple-black)
- Glass Panels: `rgba(20, 18, 30, 0.6)` with backdrop-blur(20px)

**Neon Accents**:
- Primary Purple: `#8B5CF6` 
- Secondary Pink: `#EC4899`
- Accent Cyan: `#06B6D4`
- Gold Highlight: `#FBBF24`

**Gradients**:
- Primary: `linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)`
- Button: `linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)`
- Glow: `0 0 20px rgba(139, 92, 246, 0.5)`

**Text**:
- Primary: `#FFFFFF`
- Secondary: `rgba(255, 255, 255, 0.7)`
- Muted: `rgba(255, 255, 255, 0.4)`

**Card Elements**:
- Card Background: `linear-gradient(135deg, #FFFFFF 0%, #F3F4F6 100%)`
- Red Suits: `#EF4444`
- Black Suits: `#1F2937`

### Layout System
**Tailwind Spacing**: Primary units `4, 6, 8, 12, 16, 20`

**Safe Area Handling**:
- Top: `env(safe-area-inset-top) + 16px`
- Bottom: `env(safe-area-inset-bottom) + 20px`
- Sides: `env(safe-area-inset-left/right) + 12px`

**Viewport**: `height: 100dvh` for dynamic iOS Safari behavior

---

## Component Library

### Poker Table
- **Background**: Radial gradient from `#13111C` (center) to `#0A0A0F` (edges)
- **Felt Effect**: Subtle grid pattern overlay at 5% opacity
- **Glow Elements**: Purple/pink radial glows at corners (blur-3xl, opacity-20)
- **Border**: 1px solid `rgba(139, 92, 246, 0.2)` with inner glow

### Playing Cards
- **Size**: 60px × 86px
- **Background**: White gradient with subtle shadow
- **Border**: 1px solid `rgba(0, 0, 0, 0.1)`, border-radius 8px
- **Rank/Suit**: 36px symbols, crisp rendering
- **Glow on Active**: `0 0 16px rgba(139, 92, 246, 0.6)`
- **Animation**: 0.3s ease-out with slight scale (1.02) on deal

### Glass Morphism Panels
**Player Seats**:
- Background: `rgba(20, 18, 30, 0.6)` + backdrop-blur(20px)
- Border: 1px solid `rgba(139, 92, 246, 0.3)`
- Border-radius: 16px
- Box-shadow: `0 8px 32px rgba(0, 0, 0, 0.4)`
- Padding: 16px
- Active Border: 2px solid with purple-pink gradient

**Pot Display Container**:
- Background: `rgba(20, 18, 30, 0.8)` + backdrop-blur(24px)
- Border: 1px solid gradient (purple-pink)
- Inner glow: Purple shadow
- Icon: Gradient-filled chip stack SVG

### Action Controls (Bottom Fixed)
**Container**:
- Background: `rgba(10, 10, 15, 0.95)` + backdrop-blur(24px)
- Top border: 1px solid `rgba(139, 92, 246, 0.3)`
- Height: 200px + safe-area-inset-bottom

**Gradient Buttons**:
- Background: Purple-pink gradient
- Height: 56px, border-radius 12px
- Text: White, 17px, 600 weight, uppercase
- Box-shadow: `0 4px 20px rgba(139, 92, 246, 0.4)`
- Glow on press: Increased shadow blur to 30px
- Touch target: 44pt minimum

**Bet Slider**:
- Track: 6px height, `rgba(139, 92, 246, 0.2)` background
- Filled Track: Purple-pink gradient
- Thumb: 48px circle, gradient fill, white border (2px), shadow with purple glow
- Value Display: 20px font, gradient text effect, positioned above thumb

### Community Cards Area
- **Container**: Glass morphism panel (backdrop-blur)
- **Layout**: Horizontal row, 6px gaps
- **Height**: 110px (cards + padding)
- **Empty Slots**: 2px dashed border `rgba(139, 92, 246, 0.3)` with purple inner glow

### Chip Displays
- **Style**: Modern hexagonal/circular badges
- **Background**: Glass panel with gradient border
- **Icon**: Gradient-filled crypto coin SVG
- **Typography**: Tabular nums with subtle text shadow

---

## Visual Effects

### Glow & Lighting
- **Active Turn Indicator**: Animated purple glow pulse (2s infinite)
- **Pot Amount**: Constant gold glow
- **Win Highlights**: Bright purple-pink gradient glow
- **Card Highlights**: Cyan accent glow for best hand

### Neon Accents
- **Dealer Button**: Circular with gradient fill + outer glow
- **Timer Rings**: Animated purple gradient stroke
- **Chip Stacks**: Subtle cyan edge lighting

### Depth & Layering
- **z-index Strategy**: Cards (40), controls (30), panels (20), table (10), background (0)
- **Shadow Hierarchy**: Stronger shadows = higher elevation
- **Blur Intensity**: Stronger blur = more background separation

---

## Mobile Layout Structure

**Vertical Stack** (top to bottom):
1. **Header** (56px + safe-area-top): Glass panel with pot display, game info, gradient text
2. **Opponent Area** (flexible): 2-3 glass panels, purple glow on active player
3. **Community Cards** (110px): Centered glass container
4. **Human Player** (96px): Glass panel with cards + chip display
5. **Action Controls** (200px + safe-area-bottom): Gradient buttons + glowing slider

**Breakpoints**: 375px (2-button), 390px+ (3-button grid)

---

## Accessibility & Performance
- **Contrast**: 7:1 on all gradient text (use white overlay)
- **VoiceOver**: Full card/action descriptions
- **Reduced Motion**: Disable glows/pulses, keep essential animations
- **Performance**: Max 3 simultaneous glows, use `will-change` temporarily
- **Touch Targets**: 44pt minimum maintained across all controls

---

## iOS Optimization
- **100dvh** for viewport height
- **touch-action: manipulation** on buttons
- **overscroll-behavior-y: contain** on body
- **Font size**: 16px minimum (prevent zoom)
- **Haptics**: Light (deal), Medium (button), Heavy (win)

This crypto-aesthetic design delivers a premium web3 gaming experience with sophisticated visual effects while maintaining optimal mobile performance and iOS native feel.