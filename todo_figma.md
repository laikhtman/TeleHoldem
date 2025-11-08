# Figma Design Implementation TODO - Complete App Redesign

## Overview
Complete implementation of the new Figma design system for the Texas Hold'em Poker application. The design features a dark theme with vibrant card-themed onboarding, loading animations, and a completely new user flow starting with welcome screens.

## Design Analysis from Figma Screenshots

### Screen Flow:
1. **Loading Screen (0.)** - Animated diamond logo with "Advice" text and loading indicator
2. **Onboarding Screen 1 (1.)** - "Discover Diverse Game Zones" with forest hideout card
3. **Onboarding Screen 2** - "Get the Chips You Need" with diamond/chip graphics
4. **Onboarding Screen 3** - "Pay Your Way: Anytime, Anywhere" with payment icons
5. **Main Game Interface** - (awaiting additional screenshots)

## Phase 1: Loading & Onboarding System (CRITICAL - 12-16 hours)

### 1.1 Loading Screen Component ⏳
- [ ] **Create LoadingScreen.tsx component (3-4 hours)**
  - [ ] Dark background (#1a1a1a or similar from Figma)
  - [ ] Centered diamond logo with golden gradient
  - [ ] Animated rotating border around diamond (subtle spin)
  - [ ] "Advice" text below logo in clean sans-serif
  - [ ] Bottom text: "Check the opponents strategies, they usually bet calculated probability"
  - [ ] Progress bar or loading indicator at bottom
  - [ ] Smooth fade-in/fade-out transitions
  - [ ] Auto-advance to onboarding after 2-3 seconds

### 1.2 Onboarding Flow System ⏳
- [ ] **Create OnboardingFlow.tsx component (4-5 hours)**
  - [ ] Multi-screen carousel with smooth swipe transitions
  - [ ] Progress dots indicator at bottom
  - [ ] "NEXT" button with orange gradient (#FF8C00 to #FFA500)
  - [ ] "Skip" option in bottom left
  - [ ] Close button (X) in top right corner
  - [ ] Smooth page transitions with proper easing

### 1.3 Onboarding Screen 1: Game Zones ⏳
- [ ] **Implement "Discover Diverse Game Zones" screen (2-3 hours)**
  - [ ] Title: "Welcome to Poker" in top section
  - [ ] Large card visual showing "Forest Hideout" game zone
  - [ ] Card design with green forest background and tent icon
  - [ ] Stats display: "#56/10 🕐 50 💎 6.6M"
  - [ ] Subtitle: "Discover Diverse Game Zones"
  - [ ] Description text about table selection and skill level
  - [ ] Visual card with proper shadows and rounded corners

### 1.4 Onboarding Screen 2: Chips & Strategy ⏳
- [ ] **Implement "Get the Chips You Need" screen (2-3 hours)**
  - [ ] Central diamond logo with surrounding chip graphics
  - [ ] Purple and green circular chip icons around main diamond
  - [ ] Title: "Get the Chips You Need"
  - [ ] Description about smart gameplay and chip values
  - [ ] Vibrant color scheme matching Figma design

### 1.5 Onboarding Screen 3: Payment Integration ⏳
- [ ] **Implement "Pay Your Way" screen (2-3 hours)**
  - [ ] Multiple payment icons in circular arrangement
  - [ ] PayPal, Ethereum, dice, and other payment method icons
  - [ ] Title: "Pay Your Way: Anytime, Anywhere"
  - [ ] Description about fantasy gameplay and preferences
  - [ ] "START PLAYING" button (final CTA)

## Phase 2: Visual Design System Update (8-10 hours)

### 2.1 Color Scheme Overhaul ⏳
- [ ] **Extract exact colors from Figma (2-3 hours)**
  - [ ] Background: Deep dark (#1a1a1a or #0f0f0f)
  - [ ] Orange accent gradient: #FF8C00 to #FFA500
  - [ ] Purple accents: #8B5CF6 variants
  - [ ] Green accents: #10B981 variants
  - [ ] White text: #FFFFFF
  - [ ] Muted text: #9CA3AF
  - [ ] Update CSS variables in index.css

### 2.2 Typography System ⏳
- [ ] **Implement Figma typography (1-2 hours)**
  - [ ] Main headings: Bold, 24-28px
  - [ ] Subtitles: Medium, 18-20px
  - [ ] Body text: Regular, 14-16px
  - [ ] Button text: Medium/Semibold, 16px, uppercase
  - [ ] Proper line heights and letter spacing

### 2.3 Component Styling Updates ⏳
- [ ] **Button component redesign (2-3 hours)**
  - [ ] Orange gradient buttons for primary actions
  - [ ] Proper border radius (12-16px)
  - [ ] Consistent padding and sizing
  - [ ] Hover and active states
  - [ ] "Skip" button styling (transparent with white text)

### 2.4 Card and Game Zone Graphics ⏳
- [ ] **Design game zone card components (2-3 hours)**
  - [ ] Card container with rounded corners and shadows
  - [ ] Background image support for different zones
  - [ ] Stats overlay (player count, time, chips, rating)
  - [ ] Proper aspect ratio and responsive sizing
  - [ ] Hover effects and selection states

## Phase 3: Navigation and App Flow (6-8 hours)

### 3.1 App Initialization Logic ⏳
- [ ] **Update App.tsx routing (2-3 hours)**
  - [ ] First-time user flow detection
  - [ ] Loading screen → Onboarding → Game flow
  - [ ] Skip onboarding for returning users
  - [ ] Proper state management for flow progression
  - [ ] LocalStorage integration for onboarding completion

### 3.2 Transition Animations ⏳
- [ ] **Implement smooth transitions (2-3 hours)**
  - [ ] Screen-to-screen slide transitions
  - [ ] Fade animations for loading screen
  - [ ] Progress dot animations
  - [ ] Button press feedback animations
  - [ ] Proper timing and easing curves

### 3.3 Mobile Optimization ⏳
- [ ] **Ensure mobile-first design (2-3 hours)**
  - [ ] Touch-friendly button sizes (minimum 44px height)
  - [ ] Proper spacing for mobile viewports
  - [ ] Swipe gesture support for onboarding
  - [ ] iOS safe area handling
  - [ ] Responsive text sizing

## Phase 4: Game Zone Selection Interface (4-6 hours)

### 4.1 Game Zone Cards Component ⏳
- [ ] **Create GameZoneCard.tsx (2-3 hours)**
  - [ ] Card layout matching Figma design
  - [ ] Background image/gradient support
  - [ ] Stats display component
  - [ ] Selection states and animations
  - [ ] Click handlers for zone selection

### 4.2 Game Lobby Integration ⏳
- [ ] **Update lobby page (2-3 hours)**
  - [ ] Display multiple game zones as cards
  - [ ] Filter and search functionality
  - [ ] Zone selection leading to game creation
  - [ ] Proper state management and navigation

## Phase 5: Animation and Polish (4-6 hours)

### 5.1 Loading Animations ⏳
- [ ] **Implement logo animations (1-2 hours)**
  - [ ] Diamond logo rotation/pulse effect
  - [ ] Loading progress indicators
  - [ ] Text fade-in animations
  - [ ] Smooth timing curves

### 5.2 Micro-interactions ⏳
- [ ] **Add interaction feedback (2-3 hours)**
  - [ ] Button press animations
  - [ ] Card hover effects
  - [ ] Progress dot animations
  - [ ] Swipe gesture feedback
  - [ ] Sound effects integration

### 5.3 Performance Optimization ⏳
- [ ] **Optimize for mobile performance (1-2 hours)**
  - [ ] Lazy loading for onboarding screens
  - [ ] Image optimization and preloading
  - [ ] Reduce bundle size impact
  - [ ] GPU-accelerated animations

## Phase 6: Integration with Existing App (3-4 hours)

### 6.1 Route Configuration ⏳
- [ ] **Update routing system (1-2 hours)**
  - [ ] Add loading and onboarding routes
  - [ ] Proper redirect logic
  - [ ] Authentication flow integration
  - [ ] State persistence

### 6.2 Component Integration ⏳
- [ ] **Connect to existing components (1-2 hours)**
  - [ ] Link onboarding to main game
  - [ ] Preserve user preferences
  - [ ] Theme system integration
  - [ ] Error boundary coverage

### 6.3 Testing and Refinement ⏳
- [ ] **Quality assurance (1 hour)**
  - [ ] Cross-device testing
  - [ ] Animation performance testing
  - [ ] User flow validation
  - [ ] Accessibility compliance

## Implementation Priority

### Week 1 (Critical Path)
1. Loading Screen Component
2. Onboarding Flow System
3. All three onboarding screens
4. Color scheme and typography updates

### Week 2 (Enhancement)
5. Navigation and app flow
6. Game zone card components
7. Animation and polish
8. Mobile optimization

### Week 3 (Polish)
9. Integration with existing app
10. Performance optimization
11. Testing and refinement
12. Final QA and bug fixes

## File Structure Changes Required

```
client/src/components/
├── onboarding/
│   ├── LoadingScreen.tsx          # New
│   ├── OnboardingFlow.tsx         # New
│   ├── GameZoneCard.tsx          # New
│   └── WelcomeScreens.tsx        # Update existing
├── ui/
│   └── button.tsx                # Update styling
└── ...existing components
```

## Design Specifications from Figma

### Colors (Hex Values)
- Background Dark: #1a1a1a
- Orange Primary: #FF8C00
- Orange Secondary: #FFA500
- Purple Accent: #8B5CF6
- Green Accent: #10B981
- White Text: #FFFFFF
- Muted Text: #9CA3AF

### Typography
- Font Family: System font stack (SF Pro, Segoe UI, etc.)
- Heading sizes: 24px, 20px, 18px
- Body sizes: 16px, 14px
- Button size: 16px, medium weight
- Line height: 1.4-1.6 for body text

### Spacing
- Card padding: 24px
- Button padding: 16px 32px
- Section spacing: 32px
- Element spacing: 16px

### Border Radius
- Cards: 16px
- Buttons: 12px
- Small elements: 8px

## Success Criteria
- [ ] 100% visual fidelity to Figma designs
- [ ] Smooth 60fps animations on mobile
- [ ] Proper onboarding flow completion
- [ ] Mobile-first responsive design
- [ ] Performance score >90 (Lighthouse)
- [ ] Accessibility compliance (WCAG 2.1)

---
*Updated: Based on Figma screenshots provided*
*Design Version: New onboarding and loading flow*