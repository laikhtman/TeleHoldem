
# Figma Design Implementation TODO - Complete App Redesign

## Overview
Complete redesign of the Texas Hold'em Poker application to match the new Figma mobile-first design. This involves replacing the current lobby-first approach with an onboarding-driven experience featuring loading screens, welcome flow, and game zone discovery.

## Critical Design Changes Identified
1. **App Entry Point**: From immediate lobby → Loading screen + Onboarding flow
2. **Navigation Pattern**: From table list → Welcome screens with progressive disclosure
3. **Visual Design**: From glass morphism → Card-based onboarding with illustrations
4. **User Journey**: From direct play → Educational onboarding → Game selection

## Phase 1: App Entry & Loading System 🚨 CRITICAL
### 1.1 Loading Screen Implementation
- [ ] **Create Loading Screen Component** (Screen 0 from Figma)
  - [ ] Dark background with diamond logo
  - [ ] Animated loading progress bar/circle
  - [ ] "Check the environment, challenges, they usually add extremely profitably." text
  - [ ] Loading progress indicator
  - [ ] Smooth transition to onboarding

- [ ] **Update App Entry Point**
  - [ ] Replace immediate routing to lobby
  - [ ] Implement loading sequence on app startup
  - [ ] Add loading states for different app initialization phases
  - [ ] Handle loading errors gracefully

- [ ] **Loading Animation System**
  - [ ] Diamond logo animation (rotation/glow)
  - [ ] Progress bar animation
  - [ ] Text fade-in effects
  - [ ] Skeleton loading for subsequent screens

### 1.2 App Initialization Flow
- [ ] **Initialize App Services During Loading**
  - [ ] Check network connectivity
  - [ ] Load user preferences
  - [ ] Initialize game engine
  - [ ] Preload critical assets
  - [ ] Set up error handling

- [ ] **Loading State Management**
  - [ ] Track loading progress percentage
  - [ ] Handle loading timeouts
  - [ ] Implement retry mechanisms
  - [ ] Show appropriate error states

## Phase 2: Welcome & Onboarding Flow 🚨 CRITICAL
### 2.1 Welcome Screen Component (Screen 1 from Figma)
- [ ] **Welcome Modal/Overlay**
  - [ ] "Welcome to Poker" header with close (X) button
  - [ ] Forest Hideout card illustration
  - [ ] "Discover Diverse Game Zones" heading
  - [ ] Descriptive text about finding perfect table
  - [ ] Orange "NEXT" button
  - [ ] "Skip" option at bottom
  - [ ] Progress dots indicator (3 dots)

- [ ] **Interactive Elements**
  - [ ] Close button functionality
  - [ ] Next button with smooth transitions
  - [ ] Skip button to bypass onboarding
  - [ ] Swipe gestures for mobile navigation

### 2.2 Chips Education Screen (Screen 2 from Figma)
- [ ] **Chips Information Modal**
  - [ ] Diamond/chip illustration with decorative elements
  - [ ] "Get the Chips You Need" heading
  - [ ] Educational content about chip values and strategy
  - [ ] Orange "NEXT" button
  - [ ] Progress dots (showing step 2 of 3)
  - [ ] Consistent styling with previous screen

### 2.3 Payment Options Screen (Screen 3 from Figma)
- [ ] **Payment Methods Display**
  - [ ] Multiple payment icons (PayPal, crypto, cards, etc.)
  - [ ] "Pay Your Way: Anytime, Anywhere" heading
  - [ ] Description of payment flexibility
  - [ ] Orange "START PLAYING" button (final CTA)
  - [ ] Progress dots (showing step 3 of 3)

### 2.4 Onboarding Flow Management
- [ ] **Flow State Management**
  - [ ] Track current onboarding step
  - [ ] Handle forward/backward navigation
  - [ ] Save onboarding completion state
  - [ ] Allow skipping for returning users

- [ ] **Responsive Design**
  - [ ] Mobile-first implementation
  - [ ] Tablet adaptations
  - [ ] Desktop modal sizing
  - [ ] Safe area handling for iOS

## Phase 3: Complete UI System Overhaul
### 3.1 New Design System Implementation
- [ ] **Color Palette from Figma**
  - [ ] Dark theme primary colors
  - [ ] Orange accent color (#FF9500 or similar)
  - [ ] Modal overlay colors
  - [ ] Text hierarchy colors
  - [ ] Status indicator colors

- [ ] **Typography System**
  - [ ] Header font sizes and weights
  - [ ] Body text specifications
  - [ ] Button text styling
  - [ ] Progress indicators

- [ ] **Component Design Tokens**
  - [ ] Modal/overlay styles
  - [ ] Button designs (orange primary)
  - [ ] Card illustrations framework
  - [ ] Progress dots component
  - [ ] Close button styling

### 3.2 Illustration & Asset System
- [ ] **Create/Import Illustrations**
  - [ ] Forest Hideout card design
  - [ ] Diamond/chip illustrations
  - [ ] Payment method icons
  - [ ] Game zone illustrations
  - [ ] Background patterns/textures

- [ ] **Asset Optimization**
  - [ ] SVG icons for scalability
  - [ ] Optimized images for mobile
  - [ ] Lazy loading implementation
  - [ ] Progressive image enhancement

## Phase 4: Navigation Architecture Redesign
### 4.1 New App Flow Architecture
- [ ] **Route Structure Update**
  - [ ] `/` → Loading screen (new)
  - [ ] `/welcome` → Onboarding flow (new)
  - [ ] `/lobby` → Game selection (redesigned)
  - [ ] `/game` → Actual gameplay (existing)
  - [ ] Handle deep linking and state restoration

- [ ] **State Management for Flow**
  - [ ] Onboarding completion tracking
  - [ ] User preferences persistence
  - [ ] Session state management
  - [ ] Navigation history handling

### 4.2 Post-Onboarding Experience
- [ ] **Redesigned Lobby/Game Selection**
  - [ ] Transform current lobby to match new design language
  - [ ] Implement game zones concept from onboarding
  - [ ] Create card-based game selection
  - [ ] Add filtering and discovery features

- [ ] **Smooth Transitions**
  - [ ] Onboarding → Game selection transition
  - [ ] Loading state management
  - [ ] Animation continuity
  - [ ] State preservation

## Phase 5: Mobile-First Implementation Details
### 5.1 Mobile Interaction Patterns
- [ ] **Touch Gestures**
  - [ ] Swipe between onboarding screens
  - [ ] Pull-to-refresh functionality
  - [ ] Touch feedback (haptic if available)
  - [ ] Scroll behavior optimization

- [ ] **Mobile Performance**
  - [ ] Optimize for slower connections
  - [ ] Implement progressive loading
  - [ ] Memory usage optimization
  - [ ] Battery usage considerations

### 5.2 Cross-Platform Adaptations
- [ ] **Responsive Breakpoints**
  - [ ] Phone (320px - 768px)
  - [ ] Tablet (769px - 1024px)
  - [ ] Desktop (1025px+)
  - [ ] Large desktop (1440px+)

- [ ] **Platform-Specific Features**
  - [ ] iOS safe area handling
  - [ ] Android system UI integration
  - [ ] Web app manifest updates
  - [ ] PWA installation prompts

## Phase 6: Component Implementation Priority
### 6.1 Critical Components (Week 1)
1. **LoadingScreen** component
2. **OnboardingModal** component
3. **WelcomeFlow** state management
4. **ProgressIndicator** component
5. **App routing updates**

### 6.2 Supporting Components (Week 2)
1. **IllustrationCard** component
2. **PaymentIcons** component
3. **AnimatedButton** component (orange theme)
4. **ModalOverlay** component
5. **GestureHandler** utilities

### 6.3 Integration Components (Week 3)
1. **Lobby redesign** to match new aesthetic
2. **Navigation flow** completion
3. **State persistence** system
4. **Performance optimization**
5. **Testing and QA**

## Implementation Checklist

### Immediate Actions Required:
- [ ] **Create new LoadingScreen component**
- [ ] **Implement OnboardingFlow components**
- [ ] **Update App.tsx routing logic**
- [ ] **Design new color scheme and variables**
- [ ] **Create illustration placeholder system**

### File Structure Updates:
```
client/src/components/onboarding/
├── LoadingScreen.tsx
├── WelcomeFlow.tsx
├── OnboardingModal.tsx
├── ChipsEducation.tsx
├── PaymentOptions.tsx
└── ProgressDots.tsx

client/src/pages/
├── LoadingPage.tsx (new)
├── OnboardingPage.tsx (new)
├── lobby.tsx (major redesign)
```

### Critical Routes to Implement:
1. `"/"` → LoadingPage (replaces direct lobby)
2. `"/welcome"` → OnboardingPage
3. `"/lobby"` → Redesigned game selection
4. `"/game"` → Existing game (minimal changes)

## Success Criteria
- [ ] ✅ App loads with new loading screen
- [ ] ✅ Three-step onboarding flow works smoothly
- [ ] ✅ Mobile-first responsive design
- [ ] ✅ Smooth transitions between screens
- [ ] ✅ Onboarding can be skipped for returning users
- [ ] ✅ All illustrations and assets load properly
- [ ] ✅ Orange button theme implemented consistently
- [ ] ✅ Progress indicators work correctly
- [ ] ✅ Close/skip functionality works
- [ ] ✅ Final "START PLAYING" leads to game selection

## Dependencies & Considerations
- [ ] **Asset Creation**: Need all illustrations from Figma
- [ ] **Animation Library**: Consider Framer Motion for smooth transitions
- [ ] **State Management**: Persist onboarding completion
- [ ] **Performance**: Optimize loading sequence
- [ ] **Accessibility**: Maintain screen reader support
- [ ] **Testing**: Test on various mobile devices

---
**CRITICAL NOTE**: This represents a fundamental app architecture change. The current lobby-first approach will be completely replaced with an onboarding-first experience. This affects the entire user journey from app startup.

**Next Steps**:
1. Create LoadingScreen component
2. Implement OnboardingFlow
3. Update App routing
4. Redesign lobby to match new aesthetic
5. Test complete user journey

*Last Updated: January 2025*
*Design Source: Figma - POKER App Mobile Onboarding Flow*
