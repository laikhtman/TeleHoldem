# Texas Hold'em Poker - Crypto/Web3 Design Guidelines

## Design Approach: Premium Crypto Gaming Experience

**Selected Approach**: Figma-inspired crypto gaming aesthetic combining glass morphism, neon accents, layered depth effects, and sophisticated lighting. Designed for mobile-first iOS Telegram Mini App (375px-430px widths).

**Core Principle**: Futuristic web3 poker interface with dramatic neon glows, floating glass panels, gradient transitions, and premium gaming atmosphere while maintaining instant readability and thumb-optimized controls.

---

## Core Design Elements

### Typography
**Font Stack**: SF Pro Display (primary), Inter (fallback via Google Fonts CDN)

**Hierarchy**:
- Player Names: 13px, 600 weight, tracking-wide, neon text-shadow
- Chip Counts: 16px, 700 weight, tabular-nums, purple gradient glow
- Pot Display: 24px, 800 weight, tabular-nums, animated gradient text
- Card Ranks: 36px, 700 weight, crisp rendering
- Action Buttons: 17px, 600 weight, uppercase, letter-spacing wide
- Game State: 14px, 500 weight, cyan accent glow

### Glass Morphism Effects
**All UI Panels**: Semi-transparent backgrounds with backdrop-blur(20px-24px), 1-2px gradient borders (purple-to-pink), layered box-shadows with purple/pink glow, 12-16px border-radius for premium feel.

**Depth Layering**: Foreground elements use stronger blur (24px) and brighter glows, background elements softer blur (16px) with subtle glows, z-index hierarchy maintained for floating effect.

### Neon Accent System
**Primary Purple**: `#8B5CF6` - Main interactive elements, active states, primary glows
**Secondary Pink**: `#EC4899` - Gradient transitions, hover intensification, winning highlights  
**Accent Cyan**: `#06B6D4` - Special indicators, secondary actions, card highlights
**Gold**: `#FBBF24` - Pot amounts, premium features, winner effects

**Gradients**: All buttons/borders use 135deg purple-to-pink gradients. Text uses gradient fills for premium elements. Glows layer multiple colors for depth (purple base + pink edges).

### Layout System
**Tailwind Spacing**: Primary units `4, 6, 8, 12, 16, 20` for consistent rhythm.

**iOS Safe Areas**: Top padding includes safe-area-inset-top + 16px, bottom includes safe-area-inset-bottom + 20px, sides use safe-area-inset-left/right + 12px.

**Viewport**: 100dvh with overscroll-behavior-y: contain for native feel.

---

## Component Library

### Poker Table
**Felt**: Deep purple-black radial gradient (#13111C center to #0A0A0F edges) with subtle grid pattern overlay (5% opacity). **Neon Trim**: 2px gradient border (purple-to-pink) with outer glow (blur-2xl, purple shadow). **Corner Accents**: Radial purple/pink glows positioned at corners for depth.

### Playing Cards
**Dimensions**: 60px × 86px with 8px border-radius. **3D Depth**: White gradient background, 1px gradient border, multi-layer shadow (base shadow + neon glow on hover). **Active States**: Scale to 1.02, intensify border glow to blur-xl, add cyan accent highlight for winning combinations. **Animation**: 0.3s ease-out transitions for all states.

### Glass Panels (Player Seats, Info Displays)
**Background**: rgba(20, 18, 30, 0.6) with backdrop-blur(20px). **Borders**: 1px solid with purple-pink gradient, enhanced to 2px on active player. **Shadows**: Layered shadows - base dark shadow + purple glow. **Hover States**: Intensify glow from blur-lg to blur-xl, subtle float animation (translateY -2px). **Padding**: 16px standard.

### Neon Action Buttons
**Primary Buttons**: Purple-pink gradient background, 56px height, 12px border-radius, white text with subtle glow. **Hover Effect**: Glow intensifies from blur-lg (20px) to blur-2xl (40px), gradient brightens 10%, subtle scale to 1.02. **Active State**: Scale to 0.98, glow pulses once. **Touch Targets**: 44pt minimum maintained.

### Bet Slider
**Track**: 6px height, glass morphism background with purple tint. **Filled Track**: Animated purple-pink gradient. **Thumb**: 48px circle with gradient fill, white 2px border, dramatic purple glow that intensifies on drag. **Value Display**: Floating above thumb with gradient text and matching glow.

### Community Cards Container
**Glass Panel**: Centered, 110px height, backdrop-blur(24px), gradient border. **Empty Card Slots**: 2px dashed purple border with inner glow, subtle pulse animation waiting for deal. **Layout**: Horizontal row, 6px gaps, centered alignment.

### Pot Display
**Container**: Prominent glass panel with extra strong backdrop-blur(28px), double gradient border (inner + outer), dramatic gold glow. **Icon**: Gradient-filled crypto coin SVG with neon edge lighting. **Typography**: 24px gradient text with animated shimmer effect.

---

## Visual Effects & Animations

### Floating Animations
**Player Panels**: Subtle vertical float (translateY 0 to -4px) on 3s ease-in-out loop. **Cards**: Gentle rotation wobble (±1deg) on hover. **Buttons**: Lift effect on hover with shadow expansion.

### Neon Glow Interactions
**Hover States**: All interactive elements intensify glow blur by 2x, expand shadow spread. **Active Turn**: Animated pulse ring (2s infinite) with purple-pink gradient. **Winning Highlights**: Dramatic multi-color glow burst (purple + pink + cyan layers).

### Gradient Transitions
**Text Gradients**: Animated shimmer effect (3s infinite) on premium elements. **Button Gradients**: Subtle hue rotation on hover. **Border Gradients**: Animated gradient position shift for living effect.

### Depth & Layering
**z-index Strategy**: Floating cards (50), action controls (40), player panels (30), community cards (25), pot display (20), table felt (10), background effects (0). **Shadow Hierarchy**: 3-tier system - dramatic glows (top layer), medium elevation shadows (mid), subtle base shadows (bottom).

---

## Mobile Layout Structure

**Vertical Stack**: Header with pot (glass panel, gradient text, 56px + safe-area) → Opponent area (2-3 floating glass panels with neon glows) → Community cards (centered glass container, 110px) → Human player (glass panel with gradient borders, 96px) → Action controls (gradient buttons + glowing slider, 200px + safe-area-bottom).

**Breakpoints**: 375px (2-button layout), 390px+ (3-button grid), 414px+ (enhanced spacing).

---

## Accessibility & Performance

**Contrast**: 7:1 minimum on all gradient text using white overlays. **Reduced Motion**: Disable floating/pulse animations, maintain glow effects. **Performance**: Limit to 4 simultaneous glow effects, use will-change sparingly on active interactions only. **VoiceOver**: Complete card descriptions, action feedback. **Touch Optimization**: All buttons 44pt minimum, adequate spacing between controls.

---

## Images

**No Hero Images**: This is a game interface, not a marketing page. All visual interest comes from neon effects, glass morphism, gradient treatments, and the poker table itself. The "hero" is the immersive gaming experience created through layered visual effects.

**Decorative Elements**: Crypto-themed SVG icons (wallet, chips, tokens) rendered with gradient fills and neon edge lighting throughout the interface for thematic consistency.