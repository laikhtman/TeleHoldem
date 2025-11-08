
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
2. `"/welcome"` → OnboardingPage (3 screens)
3. `"/register"` → RegistrationPage (5 screens)
4. `"/lobby"` → Redesigned game selection
5. `"/game"` → Existing game (minimal changes)

## Phase 7: Registration Flow Implementation 🚨 CRITICAL
### 7.1 Complete Registration System (Based on Figma Screenshots)
- [ ] **Registration Entry Screen (Screen 1)**
  - [ ] Registration modal with close (X) button
  - [ ] Email input field with placeholder "nagi123@gmail.com"
  - [ ] Password input field with show/hide toggle (eye icon)
  - [ ] "Remember me" checkbox with User Agreement link
  - [ ] Orange "REGISTER" button
  - [ ] "Sign in" link at bottom for existing users
  - [ ] Dark theme with proper input styling

- [ ] **Verification Screen (Screen 2)**
  - [ ] Back arrow navigation
  - [ ] "Verification" header
  - [ ] Circular verification UI (camera/face scan interface)
  - [ ] Central verification element with progress indicators
  - [ ] "1" step indicator at bottom
  - [ ] Orange "CONFIRM" button
  - [ ] "Resend code" link option
  - [ ] Face/ID verification integration

- [ ] **Wallet Import Screen (Screen 3)**
  - [ ] Back arrow and green checkmark (completed step)
  - [ ] "Import wallet" header
  - [ ] Wallet option cards with icons:
    - [ ] Meta Mask (with logo and star rating)
    - [ ] Meta Ment (with logo)
    - [ ] Binance Wallet (with logo)
    - [ ] Trust Wallet (with logo)
    - [ ] Coin 98 (with logo)
    - [ ] Phantom (with logo)
  - [ ] Orange "IMPORT" button
  - [ ] "Import Later" option

- [ ] **Unique Phrase Setup Screen (Screen 4)**
  - [ ] Back arrow and green checkmark
  - [ ] "Unique Phrase" header
  - [ ] 12-word grid layout (3x4 grid):
    - [ ] Each word in individual input boxes
    - [ ] Numbered positions (1-12)
    - [ ] Words like: "1", "4", "3", "5", "7", "8", "9", "10", "11", "12"
  - [ ] Full keyboard interface at bottom
  - [ ] Orange "CONFIRM" button
  - [ ] Secure phrase validation

- [ ] **Congratulations Screen (Screen 5)**
  - [ ] "Congratulations!" header
  - [ ] Character avatars (3 poker players with different styles)
  - [ ] "Welcome to our poker community!" subheading
  - [ ] Community description text
  - [ ] Orange "LET'S PLAY!" button (final CTA)
  - [ ] Success celebration UI

### 7.2 Registration Flow State Management
- [ ] **Multi-Step Form Management**
  - [ ] Track current step (1-5)
  - [ ] Form data persistence across steps
  - [ ] Back navigation with data preservation
  - [ ] Skip options where applicable
  - [ ] Progress indicators

- [ ] **Validation System**
  - [ ] Email format validation
  - [ ] Password strength requirements
  - [ ] Verification code validation
  - [ ] Wallet connection verification
  - [ ] 12-word phrase validation
  - [ ] Error handling for each step

### 7.3 Authentication Integration
- [ ] **User Account Creation**
  - [ ] Email/password registration
  - [ ] User profile creation
  - [ ] Account activation flow
  - [ ] Initial bankroll assignment
  - [ ] Welcome bonus handling

- [ ] **Wallet Integration**
  - [ ] MetaMask connection
  - [ ] Multi-wallet support
  - [ ] Wallet address verification
  - [ ] Crypto balance checking
  - [ ] Transaction handling setup

### 7.4 Security Implementation
- [ ] **Verification Systems**
  - [ ] Email verification
  - [ ] Face/ID verification (if applicable)
  - [ ] Two-factor authentication setup
  - [ ] Security phrase storage (encrypted)
  - [ ] Account security measures

- [ ] **Data Protection**
  - [ ] Encrypted password storage
  - [ ] Secure phrase encryption
  - [ ] GDPR compliance
  - [ ] Privacy policy integration
  - [ ] Terms of service acceptance

## Phase 8: Complete Game View Redesign 🚨 CRITICAL
### 7.1 Game Interface Architecture (Based on Figma Screenshots)
- [ ] **Complete Mobile Game Layout Redesign**
  - [ ] Dark theme with green poker table background
  - [ ] Compact vertical layout optimized for mobile screens
  - [ ] Header with game info (Texas Hold'em, pot amount, player stats)
  - [ ] Player avatars arranged around the table perimeter
  - [ ] Community cards center-positioned on green felt
  - [ ] Player's cards prominently displayed at bottom
  - [ ] Action controls at very bottom of screen

### 7.2 Header Design Implementation
- [ ] **Game Header Component**
  - [ ] "Texas Hold'em" title on left with back arrow
  - [ ] Central pot display with coin icon and amount (e.g., "1,053,033")
  - [ ] Right-side menu/settings button
  - [ ] Player info bar below header (bankroll, position indicators)

### 7.3 Player Positioning System
- [ ] **Radial Player Layout**
  - [ ] 6 players arranged around oval table perimeter
  - [ ] Each player shows: avatar, name, chip count, cards (if applicable)
  - [ ] Current player highlighted with special border/glow
  - [ ] Dealer button and position indicators
  - [ ] Folded players grayed out but still visible

### 7.4 Community Cards Redesign
- [ ] **Center Table Card Display**
  - [ ] 5 card slots horizontally arranged on green felt
  - [ ] Cards properly spaced and sized for mobile viewing
  - [ ] Empty slots shown with card-back placeholders
  - [ ] Smooth animation for card reveals (flop, turn, river)

### 7.5 Player Hand Display
- [ ] **Bottom Player Card Area**
  - [ ] Two hole cards prominently displayed
  - [ ] Cards larger than community cards for better visibility
  - [ ] "Your turn" indicator when it's player's action
  - [ ] Current bet amount and chip count display
  - [ ] Hand strength indicator (if applicable)

### 7.6 Action Controls Redesign
- [ ] **Bottom Action Bar**
  - [ ] Three primary buttons: Fold (red), Call (blue), Raise (green/orange)
  - [ ] Bet amount slider/input below buttons
  - [ ] Quick bet buttons (100, +, 2x, Raise amounts)
  - [ ] All buttons sized for touch interaction (minimum 44px)

### 7.7 Visual Design System Updates
- [ ] **Color Scheme Implementation**
  - [ ] Dark background (#1a1a1a or similar)
  - [ ] Green poker felt (#0f7b3c or similar)
  - [ ] Gold/yellow accent colors for active elements
  - [ ] Red for fold/danger actions
  - [ ] Blue/cyan for call/neutral actions
  - [ ] Proper contrast ratios for accessibility

- [ ] **Typography and Spacing**
  - [ ] Clean, readable fonts optimized for mobile
  - [ ] Proper hierarchy (headers, body text, button text)
  - [ ] Adequate spacing between interactive elements
  - [ ] Consistent padding and margins

### 7.8 Mobile-First Responsive Design
- [ ] **Screen Size Adaptations**
  - [ ] Portrait orientation primary layout
  - [ ] Landscape orientation fallback
  - [ ] Safe area handling for notched devices
  - [ ] Proper scaling for different screen densities

- [ ] **Touch Interactions**
  - [ ] Tap targets minimum 44x44 points
  - [ ] Gesture support (swipe to fold, double-tap to call)
  - [ ] Haptic feedback for actions
  - [ ] Visual feedback for button presses

### 7.9 Animation and Transitions
- [ ] **Game Flow Animations**
  - [ ] Card dealing animations
  - [ ] Chip movement from players to pot
  - [ ] Player action indicators
  - [ ] Phase transition effects
  - [ ] Winner celebration animations

### 7.10 State Management Updates
- [ ] **Game State Integration**
  - [ ] Update existing game engine to work with new UI
  - [ ] Maintain all current game logic
  - [ ] Ensure proper state synchronization
  - [ ] Handle offline/online modes

## Phase 8: Registration Flow Components
### 8.1 Registration Components (Week 1)
1. **RegistrationModal** component
2. **VerificationScreen** component
3. **WalletImportScreen** component
4. **UniquePhraseScreen** component
5. **CongratulationsScreen** component

### 8.2 Supporting Registration Components (Week 2)
1. **WalletCard** component for wallet options
2. **PhraseInputGrid** component for 12-word setup
3. **VerificationCircle** component for face scan
4. **RegistrationProgress** indicator
5. **FormValidation** utilities

## Phase 9: Component Implementation Priority
### 9.1 Critical Components (Week 3)
1. **GameHeader** component
2. **RadialPlayerLayout** component  
3. **CommunityCardsTable** redesign
4. **PlayerHandDisplay** component
5. **MobileActionControls** redesign

### 8.2 Supporting Components (Week 2)
1. **PlayerAvatar** with status indicators
2. **PotDisplay** header integration
3. **ActionButton** styled components
4. **BetAmountControls** slider/input
5. **GamePhaseIndicator** component

### 8.3 Integration and Polish (Week 3)
1. **Animation system** implementation
2. **Gesture handling** integration
3. **Responsive breakpoints** fine-tuning
4. **Performance optimization**
5. **Cross-device testing**

## Updated File Structure
```
client/src/components/registration/
├── RegistrationModal.tsx (new)
├── VerificationScreen.tsx (new)
├── WalletImportScreen.tsx (new)
├── WalletCard.tsx (new)
├── UniquePhraseScreen.tsx (new)
├── PhraseInputGrid.tsx (new)
├── CongratulationsScreen.tsx (new)
├── RegistrationProgress.tsx (new)
└── VerificationCircle.tsx (new)

client/src/components/game/
├── GameHeader.tsx (new)
├── RadialPlayerLayout.tsx (new)
├── PlayerAvatar.tsx (new)
├── CommunityCardsTable.tsx (redesigned)
├── PlayerHandDisplay.tsx (new)
├── MobileActionControls.tsx (redesigned)
├── PotDisplay.tsx (header integration)
├── ActionButton.tsx (new)
├── BetAmountControls.tsx (new)
└── GamePhaseIndicator.tsx (new)
```

## Success Criteria
### Loading & Onboarding
- [ ] ✅ App loads with new loading screen
- [ ] ✅ Three-step onboarding flow works smoothly  
- [ ] ✅ Onboarding can be skipped for returning users
- [ ] ✅ All illustrations and assets load properly
- [ ] ✅ Orange/gold button theme implemented consistently
- [ ] ✅ Progress indicators work correctly
- [ ] ✅ Close/skip functionality works

### Registration Flow
- [ ] ✅ Complete 5-step registration process works
- [ ] ✅ Email/password registration with validation
- [ ] ✅ Verification screen with proper UI
- [ ] ✅ Wallet import with multiple wallet support
- [ ] ✅ 12-word unique phrase setup and validation
- [ ] ✅ Congratulations screen with character avatars
- [ ] ✅ Smooth navigation between registration steps
- [ ] ✅ Form data persistence across steps
- [ ] ✅ Proper error handling and validation
- [ ] ✅ Security measures implemented

### Game Interface
- [ ] ✅ Game interface matches Figma design exactly
- [ ] ✅ Mobile-first responsive design implemented
- [ ] ✅ All player positions and cards display correctly
- [ ] ✅ Action controls work intuitively on mobile
- [ ] ✅ Smooth transitions between game phases
- [ ] ✅ Proper touch interactions and gesture support
- [ ] ✅ Dark theme with green table implemented
- [ ] ✅ Header with game info functions properly
- [ ] ✅ Player avatars and status indicators work
- [ ] ✅ Community cards animate correctly
- [ ] ✅ Final registration leads to redesigned game

## Dependencies & Considerations
- [ ] **Asset Creation**: Need all illustrations from Figma
- [ ] **Animation Library**: Framer Motion for smooth transitions
- [ ] **State Management**: Persist onboarding completion and game state
- [ ] **Performance**: Optimize for mobile devices
- [ ] **Accessibility**: Maintain screen reader support
- [ ] **Testing**: Test on various mobile devices and orientations
- [ ] **Game Logic**: Ensure existing poker engine works with new UI
- [ ] **Responsive Design**: Handle different screen sizes gracefully

---
**CRITICAL NOTE**: This represents a complete visual redesign of the poker game interface. The current desktop-focused layout will be replaced with a mobile-first design that matches the Figma specifications exactly. This affects:

1. **Player positioning** - from flexible layout to fixed radial positions
2. **Card display** - larger, more prominent community cards and player hands
3. **Action controls** - complete redesign for mobile touch interaction
4. **Visual theme** - dark theme with green poker table
5. **Information hierarchy** - header-based game info instead of sidebars

**Next Steps**:
1. Implement complete loading and onboarding flow
2. Create comprehensive registration system (5 screens)
3. Integrate wallet connection and security features
4. Create new game interface components
5. Redesign poker table layout system
6. Update action controls for mobile
7. Integrate dark theme with green table
8. Test complete user journey: Loading → Onboarding → Registration → Game

*Last Updated: January 2025*
*Design Source: Figma - POKER App Complete Interface Design*
