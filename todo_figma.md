
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
4. `"/profile"` → ProfilePage (user stats and achievements)
5. `"/settings"` → SettingsPageMobile (mobile-optimized settings)
6. `"/lobby"` → Redesigned game selection
7. `"/game"` → Existing game (minimal changes)

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

## Phase 9: Profile & Settings System Implementation 🚨 CRITICAL
### 9.1 Profile Screen Implementation (Screen 1)
- [ ] **Profile Header Design**
  - [ ] Gold coin balance display (e.g., "1,063,131") with coin icon
  - [ ] User name display ("James") with edit capability
  - [ ] User avatar with level indicator and online status
  - [ ] Crown/achievement icon for special status
  - [ ] Level display ("LV 900") with progress indication

- [ ] **Player Statistics Cards**
  - [ ] "Hands" statistics card with icon and count
  - [ ] "Last Winnings" card showing recent earnings
  - [ ] Additional stat cards in grid layout
  - [ ] Card styling with dark theme and proper spacing

- [ ] **Achievement System Display**
  - [ ] Achievement badges/icons in grid layout
  - [ ] Achievement titles and descriptions
  - [ ] Progress indicators for incomplete achievements
  - [ ] Rarity indicators (common, rare, legendary)
  - [ ] Achievement unlock animations

- [ ] **Navigation Elements**
  - [ ] Settings gear icon in top right
  - [ ] Back navigation where applicable
  - [ ] Smooth transitions between screens

### 9.2 Settings Screen Implementation (Screen 2)
- [ ] **Settings Categories**
  - [ ] "Wallets & Deposits" section with wallet icon
  - [ ] "Privacy & Security" section with lock icon  
  - [ ] "Profile Settings" section with user icon
  - [ ] Each section with arrow indicator for navigation
  - [ ] Proper section spacing and visual hierarchy

- [ ] **Audio Settings**
  - [ ] "Sounds" toggle with speaker icon
  - [ ] "Set amounts" option
  - [ ] "Bet odds-chart" toggle
  - [ ] "Voiceover" toggle with appropriate controls
  - [ ] Visual feedback for toggle states

- [ ] **Settings List Design**
  - [ ] Dark card-based layout for each setting
  - [ ] Icon + text + toggle/arrow layout
  - [ ] Proper touch targets (44px minimum)
  - [ ] Visual hierarchy with consistent spacing

### 9.3 Wallets Management System (Screen 3)
- [ ] **Wallet List Interface**
  - [ ] Connected wallet cards showing:
    - [ ] Wallet logo/icon (MetaMask, etc.)
    - [ ] Wallet name
    - [ ] Connection status (green dot for connected)
    - [ ] Balance if applicable
    - [ ] Checkmark for primary wallet

- [ ] **Wallet Connection Features**
  - [ ] "Connect new wallet" functionality
  - [ ] Wallet switching capabilities
  - [ ] Disconnect wallet option
  - [ ] Primary wallet selection
  - [ ] Balance refresh functionality

### 9.4 MetaMask Integration Screen (Screen 4)
- [ ] **MetaMask Connection Modal**
  - [ ] QR code display for desktop connection
  - [ ] MetaMask logo and branding
  - [ ] Connection instructions text
  - [ ] "Reconnect wallet" button
  - [ ] Close button (X) functionality
  - [ ] Error handling for connection failures

- [ ] **QR Code System**
  - [ ] Generate connection QR codes
  - [ ] Auto-refresh expired codes
  - [ ] Mobile/desktop detection
  - [ ] Alternative connection methods

### 9.5 Wallet Success Screen (Screen 5)
- [ ] **Success State Design**
  - [ ] "Wallet disconnected" confirmation message
  - [ ] Success icon/animation
  - [ ] "You have disconnected wallet" descriptive text
  - [ ] Orange "OK" button to acknowledge
  - [ ] Proper modal/overlay styling

- [ ] **Success Animations**
  - [ ] Smooth transition animations
  - [ ] Success state visual feedback
  - [ ] Auto-dismiss after confirmation
  - [ ] Sound effects for success states

### 9.6 Backend Integration for Profile System
- [ ] **User Profile API**
  - [ ] GET /api/user/profile - fetch user data
  - [ ] PUT /api/user/profile - update profile info
  - [ ] GET /api/user/stats - fetch player statistics
  - [ ] GET /api/user/achievements - fetch achievements
  - [ ] POST /api/user/avatar - update avatar

- [ ] **Wallet Management API**
  - [ ] GET /api/wallets - list connected wallets
  - [ ] POST /api/wallets/connect - connect new wallet
  - [ ] DELETE /api/wallets/:id - disconnect wallet
  - [ ] PUT /api/wallets/:id/primary - set primary wallet
  - [ ] GET /api/wallets/balance - fetch balances

- [ ] **Settings Management API**
  - [ ] GET /api/user/settings - fetch user settings
  - [ ] PUT /api/user/settings - update settings
  - [ ] POST /api/user/settings/reset - reset to defaults

### 9.7 State Management for Profile System
- [ ] **Profile State Management**
  - [ ] User profile data store
  - [ ] Statistics tracking and caching
  - [ ] Achievement system integration
  - [ ] Level and experience tracking
  - [ ] Profile picture/avatar management

- [ ] **Settings State Management**
  - [ ] Settings persistence across sessions
  - [ ] Real-time settings sync
  - [ ] Default settings management
  - [ ] Settings validation and error handling

### 9.8 Component Architecture for Profile/Settings
- [ ] **Profile Components**
  - [ ] ProfileHeader.tsx - header with balance and user info
  - [ ] StatisticsCards.tsx - player stats display
  - [ ] AchievementGrid.tsx - achievement system
  - [ ] UserAvatar.tsx - avatar with level and status
  - [ ] ProfileNavigation.tsx - navigation elements

- [ ] **Settings Components**
  - [ ] SettingsList.tsx - main settings interface
  - [ ] SettingsCategory.tsx - category sections
  - [ ] SettingsToggle.tsx - toggle switches
  - [ ] WalletManager.tsx - wallet management interface
  - [ ] WalletCard.tsx - individual wallet display

- [ ] **Modal Components**
  - [ ] WalletConnectionModal.tsx - wallet connection flow
  - [ ] QRCodeDisplay.tsx - QR code generation and display
  - [ ] SuccessModal.tsx - success state feedback
  - [ ] SettingsModal.tsx - settings overlay/modal

## Phase 10: Component Implementation Priority
### 10.1 Critical Components (Week 1)
1. **ProfileHeader** component with balance and user info
2. **SettingsList** component with categories
3. **WalletManager** component for wallet operations
4. **GameHeader** component for game interface
5. **App routing updates** for new screens

### 10.2 Supporting Components (Week 2)
1. **StatisticsCards** for profile stats
2. **AchievementGrid** for achievement display
3. **WalletCard** for wallet list items
4. **QRCodeDisplay** for wallet connections
5. **SuccessModal** for confirmation states

### 10.3 Integration and Game Components (Week 3)
1. **RadialPlayerLayout** component  
2. **CommunityCardsTable** redesign
3. **PlayerHandDisplay** component
4. **MobileActionControls** redesign
5. **Animation system** implementation

### 10.4 Polish and Testing (Week 4)
1. **Gesture handling** integration
2. **Responsive breakpoints** fine-tuning
3. **Performance optimization**
4. **Cross-device testing**
5. **End-to-end user flow testing**

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

client/src/components/profile/
├── ProfileHeader.tsx (new)
├── StatisticsCards.tsx (new)
├── AchievementGrid.tsx (new)
├── UserAvatar.tsx (new)
├── ProfileNavigation.tsx (new)
└── LevelIndicator.tsx (new)

client/src/components/settings/
├── SettingsList.tsx (new)
├── SettingsCategory.tsx (new)
├── SettingsToggle.tsx (new)
├── WalletManager.tsx (new)
├── WalletCard.tsx (new)
├── WalletConnectionModal.tsx (new)
├── QRCodeDisplay.tsx (new)
└── SuccessModal.tsx (new)

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

client/src/pages/
├── ProfilePage.tsx (new)
├── SettingsPageMobile.tsx (new)
├── LoadingPage.tsx (new)
├── OnboardingPage.tsx (new)
├── RegistrationPage.tsx (new)
└── lobby.tsx (major redesign)
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

### Profile & Settings System
- [ ] ✅ Profile screen with balance and user info
- [ ] ✅ Player statistics and achievement display
- [ ] ✅ Settings categories with proper navigation
- [ ] ✅ Audio and game settings toggles work
- [ ] ✅ Wallet management system functional
- [ ] ✅ MetaMask integration with QR codes
- [ ] ✅ Wallet connection/disconnection flow
- [ ] ✅ Success states and confirmations
- [ ] ✅ Settings persistence across sessions
- [ ] ✅ Profile data synchronization

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
- [ ] ✅ Complete user journey: Loading → Onboarding → Registration → Profile → Settings → Game

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

## Phase 11: Notification Center Implementation 🚨 CRITICAL
### 11.1 Notification Center Core Components
- [ ] **NotificationCenter Screen Component**
  - [ ] Back arrow navigation with "Notifications" title
  - [ ] Two-tab system: "Unread" and "Read" sections
  - [ ] "Read All" button for unread notifications
  - [ ] "Clear All" button for read notifications
  - [ ] Dark theme with proper section separation
  - [ ] Smooth tab switching animations

- [ ] **NotificationItem Component**
  - [ ] Icon-based notification types with proper styling:
    - [ ] 🔔 Bell icon for payment/subscription notifications
    - [ ] 🎁 Gift box icon for mystery gifts and rewards
    - [ ] 🏆 Trophy icon for achievements and challenges
    - [ ] 📄 Document icon for general updates
  - [ ] Orange dot indicator for unread notifications
  - [ ] Notification title with proper typography
  - [ ] Timestamp display (e.g., "Today 19:53", "Yesterday, 9:00")
  - [ ] Notification description/body text
  - [ ] Proper card styling with dark theme

### 11.2 Notification Actions & Interactions
- [ ] **Swipe Actions Implementation**
  - [ ] Left swipe to delete notification (trash icon)
  - [ ] Smooth animation for swipe gestures
  - [ ] Confirmation dialog for destructive actions
  - [ ] Visual feedback during swipe interactions

- [ ] **Notification State Management**
  - [ ] Mark individual notifications as read on tap
  - [ ] "Read All" functionality for unread tab
  - [ ] "Clear All" functionality for read tab
  - [ ] Persistent notification state across app sessions
  - [ ] Real-time notification updates

### 11.3 Notification Types Implementation
- [ ] **Payment & Subscription Notifications**
  - [ ] "Update payment method" with bell icon
  - [ ] "Oops, we're having trouble paying" payment failures
  - [ ] Deposit bonus and promotional notifications
  - [ ] Subscription renewal reminders
  - [ ] Payment success confirmations

- [ ] **Game Rewards & Achievements**
  - [ ] "You've received a mystery gift!" with gift icon
  - [ ] "5 Days streak challenge done!" with trophy icon
  - [ ] "New achievement unlocked!" with document icon
  - [ ] XP and coin reward notifications
  - [ ] Daily/weekly challenge completions

- [ ] **System & Game Updates**
  - [ ] General game announcements
  - [ ] Feature updates and new releases
  - [ ] Maintenance notifications
  - [ ] Tournament and event announcements

### 11.4 Notification Backend Integration
- [ ] **Notification API Endpoints**
  - [ ] GET /api/notifications - fetch user notifications
  - [ ] PUT /api/notifications/:id/read - mark as read
  - [ ] PUT /api/notifications/read-all - mark all as read
  - [ ] DELETE /api/notifications/:id - delete notification
  - [ ] DELETE /api/notifications/clear-all - clear all read
  - [ ] POST /api/notifications/push - send push notification

- [ ] **Real-time Notification System**
  - [ ] WebSocket integration for live notifications
  - [ ] Push notification service integration
  - [ ] Notification queuing system
  - [ ] Background notification sync
  - [ ] Offline notification storage

### 11.5 Mobile Notification Features
- [ ] **Push Notifications**
  - [ ] Browser push notification support
  - [ ] Permission request handling
  - [ ] Notification payload formatting
  - [ ] Click-to-action functionality
  - [ ] Notification sound and vibration

- [ ] **Badge System**
  - [ ] Unread notification count badge
  - [ ] Tab bar notification indicator
  - [ ] App icon badge (if PWA)
  - [ ] Real-time badge updates

### 11.6 UI/UX Enhancement Features
- [ ] **Visual Polish**
  - [ ] Smooth scroll behavior in notification list
  - [ ] Loading states for notification actions
  - [ ] Empty state design for no notifications
  - [ ] Pull-to-refresh functionality
  - [ ] Skeleton loading for notification items

- [ ] **Accessibility Features**
  - [ ] Screen reader support for notifications
  - [ ] Keyboard navigation support
  - [ ] High contrast mode compatibility
  - [ ] Voice-over announcements for new notifications

### 11.7 Notification Content Templates
- [ ] **Payment Notifications**
  - [ ] Payment method update reminders
  - [ ] Subscription renewal notices
  - [ ] Payment failure alerts
  - [ ] Deposit bonus announcements
  - [ ] Free spin notifications

- [ ] **Game Achievement Notifications**
  - [ ] Daily streak completions
  - [ ] Achievement unlocks with XP rewards
  - [ ] Mystery gift notifications
  - [ ] Tournament result announcements
  - [ ] Leaderboard position updates

### 11.8 Component Architecture for Notifications
- [ ] **Core Components**
  - [ ] NotificationCenter.tsx - main notification screen
  - [ ] NotificationList.tsx - notification list container
  - [ ] NotificationItem.tsx - individual notification
  - [ ] NotificationIcon.tsx - icon system for notification types
  - [ ] SwipeActions.tsx - swipe gesture handling

- [ ] **Supporting Components**
  - [ ] NotificationTabs.tsx - unread/read tab system
  - [ ] NotificationBadge.tsx - unread count indicator
  - [ ] EmptyNotifications.tsx - empty state component
  - [ ] NotificationActions.tsx - bulk action buttons
  - [ ] PushNotificationHandler.tsx - push notification service

### 11.9 State Management for Notifications
- [ ] **Notification Store**
  - [ ] Notification data structure and types
  - [ ] Unread/read state management
  - [ ] Notification filtering and sorting
  - [ ] Local storage persistence
  - [ ] Real-time updates handling

- [ ] **Integration with Game Events**
  - [ ] Achievement notifications from game engine
  - [ ] Tournament result notifications
  - [ ] Payment status notifications
  - [ ] Social interaction notifications
  - [ ] Daily task completion notifications

### 11.10 File Structure for Notification System
```
client/src/components/notifications/
├── NotificationCenter.tsx (new)
├── NotificationList.tsx (new)
├── NotificationItem.tsx (new)
├── NotificationIcon.tsx (new)
├── NotificationTabs.tsx (new)
├── NotificationBadge.tsx (new)
├── SwipeActions.tsx (new)
├── EmptyNotifications.tsx (new)
├── NotificationActions.tsx (new)
└── PushNotificationHandler.tsx (new)

client/src/pages/
├── NotificationPage.tsx (new)

client/src/hooks/
├── useNotifications.ts (new)
├── usePushNotifications.ts (new)
├── useNotificationActions.ts (new)

server/
├── notifications.ts (new)
├── pushService.ts (new)
```

### 11.11 Priority Implementation Order
1. **Week 1: Core Notification System**
   - NotificationCenter component with tabs
   - NotificationItem with proper styling
   - Basic navigation and state management

2. **Week 2: Interactions and Actions**
   - Swipe gestures for delete actions
   - Read/unread state management
   - Bulk actions (Read All, Clear All)

3. **Week 3: Backend Integration**
   - API endpoints for notifications
   - Real-time notification updates
   - Push notification service

4. **Week 4: Polish and Testing**
   - Visual polish and animations
   - Empty states and error handling
   - Cross-device testing and optimization

## Phase 12: Store and Payment System Implementation 🚨 CRITICAL
### 12.1 Game Store Core Architecture
- [ ] **Store Navigation Component**
  - [ ] Back arrow with "Game Store" title
  - [ ] Diamond logo with balance display at top
  - [ ] "Buy Chips" primary section header
  - [ ] Smooth navigation transitions
  - [ ] Dark theme with orange accents

- [ ] **Store Header with Balance Display**
  - [ ] Current chip balance prominently displayed
  - [ ] Diamond icon next to balance
  - [ ] Real-time balance updates
  - [ ] Currency formatting (commas for thousands)
  - [ ] Responsive header sizing

### 12.2 Chip Packages Implementation (Screen 1)
- [ ] **Chip Package Cards System**
  - [ ] Various chip packages with different values:
    - [ ] Starter Pack (red chips) - lower value
    - [ ] Premium Pack (blue chips) - mid value  
    - [ ] VIP Pack (gold chips) - high value
    - [ ] Ultimate Pack (purple chips) - highest value
  - [ ] Each card shows:
    - [ ] Chip stack illustration with proper colors
    - [ ] Package name and chip count
    - [ ] Price in USD/crypto
    - [ ] "BUY" button in orange theme
    - [ ] Special offers/bonuses if applicable

- [ ] **Chip Package Visual Design**
  - [ ] Realistic 3D chip stack illustrations
  - [ ] Color-coded chip types (red, blue, gold, purple)
  - [ ] Gradient backgrounds for premium packages
  - [ ] Proper card shadows and hover effects
  - [ ] Responsive grid layout (2 columns on mobile)

- [ ] **Special Chip Offers Section**
  - [ ] "Guest Chips" section with bonus offers
  - [ ] Limited-time promotions
  - [ ] First-time buyer bonuses
  - [ ] Daily deal rotations
  - [ ] VIP member exclusive packages

### 12.3 Table Customization Store (Screen 2)
- [ ] **Table Themes Section**
  - [ ] "Red Chips" poker table theme
  - [ ] "Blue Chips" poker table theme  
  - [ ] Various colored poker table options
  - [ ] Each theme card shows:
    - [ ] Table preview image/illustration
    - [ ] Theme name
    - [ ] Price (some marked as "OWNED")
    - [ ] "BUY" or "OWNED" status button

- [ ] **Table Background Options**
  - [ ] "Sunset Scene" table background
  - [ ] Multiple environmental backgrounds
  - [ ] Premium table surface materials
  - [ ] Seasonal/themed backgrounds
  - [ ] Unlockable achievement backgrounds

### 12.4 Table Surface Customization (Detailed View)
- [ ] **Table Surface Colors**
  - [ ] Multiple poker table felt colors:
    - [ ] Classic Green (default)
    - [ ] Royal Blue  
    - [ ] Deep Red
    - [ ] Sunset Orange
    - [ ] Premium Black
    - [ ] Golden Elite
  - [ ] Each with realistic felt texture
  - [ ] Preview functionality before purchase

- [ ] **Table Shape Options**
  - [ ] Oval poker tables (classic)
  - [ ] Round tables
  - [ ] Rectangular tournament tables
  - [ ] VIP private table designs
  - [ ] Different size options

### 12.5 Store Purchase System
- [ ] **Payment Integration**
  - [ ] Multiple payment methods support:
    - [ ] Credit/debit cards
    - [ ] PayPal integration
    - [ ] Cryptocurrency payments (BTC, ETH)
    - [ ] Apple Pay/Google Pay
    - [ ] Bank transfers
  - [ ] Secure payment processing
  - [ ] Purchase confirmation flows

- [ ] **Purchase Flow Components**
  - [ ] Item selection confirmation modal
  - [ ] Payment method selection
  - [ ] Purchase processing indicators
  - [ ] Success/failure feedback
  - [ ] Receipt generation and storage

### 12.6 Store State Management
- [ ] **Inventory System**
  - [ ] Track owned vs. unowned items
  - [ ] User inventory management
  - [ ] Item usage/activation system
  - [ ] Purchase history tracking
  - [ ] Refund/return policies

- [ ] **Store Data Management**
  - [ ] Dynamic pricing system
  - [ ] Special offers and promotions
  - [ ] Seasonal item rotations
  - [ ] User-specific recommendations
  - [ ] Purchase analytics tracking

### 12.7 Backend Store Integration
- [ ] **Store API Endpoints**
  - [ ] GET /api/store/items - fetch all store items
  - [ ] GET /api/store/packages - chip packages
  - [ ] GET /api/store/themes - table themes
  - [ ] POST /api/store/purchase - process purchase
  - [ ] GET /api/user/inventory - user's owned items
  - [ ] PUT /api/user/equipped - set active theme

- [ ] **Payment Processing APIs**
  - [ ] Payment gateway integration
  - [ ] Transaction validation
  - [ ] Purchase receipt generation
  - [ ] Refund processing
  - [ ] Fraud detection systems

### 12.8 Store UI Components Architecture
- [ ] **Core Store Components**
  - [ ] StoreHeader.tsx - header with balance
  - [ ] ChipPackageCard.tsx - individual chip packages
  - [ ] ThemeCard.tsx - table theme cards
  - [ ] PurchaseModal.tsx - purchase confirmation
  - [ ] PaymentMethods.tsx - payment selection

- [ ] **Supporting Components**
  - [ ] StoreNavigation.tsx - store navigation
  - [ ] ItemPreview.tsx - theme preview system
  - [ ] PurchaseHistory.tsx - transaction history
  - [ ] InventoryManager.tsx - owned items management
  - [ ] PromotionBanner.tsx - special offers display

### 12.9 Store Visual Design Implementation
- [ ] **Store Theme Consistency**
  - [ ] Dark theme with orange accents throughout
  - [ ] Consistent card styling with current app theme
  - [ ] Orange "BUY" buttons matching app design
  - [ ] Proper contrast ratios for accessibility

- [ ] **Item Visualization System**
  - [ ] High-quality chip stack renders
  - [ ] Table theme preview images
  - [ ] 3D-like illustrations for premium items
  - [ ] Smooth hover and selection animations
  - [ ] Loading states for purchase processing

### 12.10 Store Security and Validation
- [ ] **Purchase Security**
  - [ ] Server-side purchase validation
  - [ ] Duplicate purchase prevention
  - [ ] Balance verification before purchases
  - [ ] Secure payment token handling
  - [ ] Purchase audit logging

- [ ] **Anti-Fraud Measures**
  - [ ] Rate limiting on purchases
  - [ ] Suspicious activity detection
  - [ ] IP-based purchase restrictions
  - [ ] Payment verification systems

### 12.11 Store Integration with Game
- [ ] **Theme Application System**
  - [ ] Real-time theme switching in games
  - [ ] Theme persistence across sessions
  - [ ] Theme preview in lobby
  - [ ] Social theme sharing features

- [ ] **Chip Balance Integration**
  - [ ] Real-time balance updates after purchases
  - [ ] Balance synchronization across devices
  - [ ] Chip transaction history
  - [ ] Balance notifications

### 12.12 File Structure for Store System
```
client/src/components/store/
├── StoreHeader.tsx (new)
├── StoreNavigation.tsx (new)
├── ChipPackageCard.tsx (new)
├── ChipPackageGrid.tsx (new)
├── ThemeCard.tsx (new)
├── ThemeGrid.tsx (new)
├── PurchaseModal.tsx (new)
├── PaymentMethods.tsx (new)
├── ItemPreview.tsx (new)
├── PurchaseHistory.tsx (new)
├── InventoryManager.tsx (new)
├── PromotionBanner.tsx (new)
├── StoreCategories.tsx (new)
└── StoreSearch.tsx (new)

client/src/pages/
├── StorePage.tsx (new)
├── ChipStorePage.tsx (new)
├── ThemeStorePage.tsx (new)
├── PurchaseHistoryPage.tsx (new)
└── InventoryPage.tsx (new)

client/src/hooks/
├── useStore.ts (new)
├── usePurchase.ts (new)
├── useInventory.ts (new)
├── useThemes.ts (new)
└── usePayments.ts (new)

server/store/
├── storeController.ts (new)
├── purchaseController.ts (new)
├── inventoryController.ts (new)
├── paymentService.ts (new)
└── storeValidation.ts (new)
```

### 12.13 Store Implementation Priority
1. **Week 1: Core Store Structure**
   - Store navigation and header
   - Basic chip package display
   - Store routing and pages

2. **Week 2: Purchase System**
   - Purchase modal and flow
   - Payment method integration
   - Basic inventory management

3. **Week 3: Theme System**
   - Table theme cards and preview
   - Theme application in games
   - Advanced store features

4. **Week 4: Polish and Integration**
   - Store animations and polish
   - Advanced payment methods
   - Store analytics and optimization

### 12.14 Store Success Criteria
- [ ] ✅ Complete store navigation works smoothly
- [ ] ✅ All chip packages display correctly with proper pricing
- [ ] ✅ Table themes show accurate previews
- [ ] ✅ Purchase flow works end-to-end
- [ ] ✅ Payment methods integrate properly
- [ ] ✅ Inventory system tracks owned items
- [ ] ✅ Themes apply correctly in game
- [ ] ✅ Balance updates in real-time
- [ ] ✅ Store matches Figma design exactly
- [ ] ✅ Mobile responsive design works properly
- [ ] ✅ Purchase security measures implemented
- [ ] ✅ Store performance optimized for mobile

*Last Updated: January 2025*
*Design Source: Figma - POKER App Complete Interface Design*
*Latest Addition: Complete Store and Payment System Implementation*
