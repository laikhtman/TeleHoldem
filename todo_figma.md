## 🏦 WALLET SYSTEM IMPLEMENTATION

### 📋 Core Wallet Components

#### 1. **Main Wallet Screen**
- [ ] **1.1** Create main wallet header with balance display
  - Balance: "1053 031" with green plus icon
  - Add "CONVERT" button with orange gradient styling
- [ ] **1.2** Implement wallet cards layout
  - Main Wallet card with chip count display
  - Transaction history list with icons and amounts
  - Color-coded transaction types (green for deposits, etc.)
- [ ] **1.3** Add bottom navigation integration
  - Match existing bottom nav design
  - Highlight wallet tab when active

#### 2. **Converter Modal**
- [ ] **2.1** Create converter overlay modal
  - Semi-transparent dark background
  - Centered conversion panel
- [ ] **2.2** Implement conversion interface
  - Two-way conversion display (0 ↔ 0)
  - "Main Wallet" source display
  - "CONVERT" button with orange styling
  - USDT currency indicator

### 🎯 ONBOARDING & WELCOME SCREENS IMPLEMENTATION

#### 31. **Welcome Screens Design Update**
- [x] **31.1** Create three-screen onboarding flow
  - "Discover Diverse Game Zones" with forest hideout theme
  - "Get the Chips You Need" with poker chips visualization
  - "Pay Your Way" with payment method icons
- [x] **31.2** Implement visual elements matching Figma
  - Dark gradient backgrounds (#1a1a1a to black)
  - Checkered pattern overlay for game zones screen
  - 3D poker chips with purple, gold, and green styling
  - Payment method icons in circular design
- [x] **31.3** Add navigation and interaction
  - Progress dot indicators at bottom
  - Skip functionality with chevron icon
  - Orange gradient "NEXT" and "START PLAYING" buttons
  - Smooth transitions between screens
- [x] **31.4** Integrate with existing onboarding system
  - Connect with OnboardingFlow component
  - Proper completion handling
  - State management for welcome flow

### 🎯 LOADING SCREEN IMPLEMENTATION

#### 32. **Loading Screen Design Update**
- [x] **32.1** Update main loading screen to match Figma design
  - Dark background (#1a1a1a)
  - Circular progress loader with diamond icon
  - Orange/amber progress color (#facc15)
  - "Advice" header with orange styling
- [x] **32.2** Implement tip rotation system
  - Display poker tips during loading
  - Featured tip: "Check the promotional chips, they usually sell extremely profitably!"
  - Randomized tip selection from predefined list
- [x] **32.3** Add progress indicators
  - Circular progress with smooth animation
  - Bottom progress bar matching design
  - Consistent timing and transitions
- [x] **32.4** Update PokerLoader component
  - Match new design aesthetic
  - Diamond icon integration
  - Consistent color scheme with main loading screen

### 💰 DEPOSIT SYSTEM IMPLEMENTATION

#### 3. **Deposit Flow - Step 1: Amount Entry**
- [ ] **3.1** Create deposit screen header
  - Back arrow navigation
  - "Deposit" title centered
  - Status indicator dots (if needed)
- [ ] **3.2** Implement deposit tabs
  - "Crypto" tab (active/selected state)
  - "Fiat" tab (inactive state)
  - Orange active tab styling
- [ ] **3.3** Build amount input interface
  - Large amount input field showing "1000"
  - "Coin Amount" label
  - Yellow/orange input highlight
- [ ] **3.4** Add network selection
  - "Network" dropdown with arrow indicator
  - Shows "Ethereum" as selected
- [ ] **3.5** Create platform wallet display
  - Semi-transparent card background
  - Central loading/placeholder area
  - "Select Network and Token" instruction text

#### 4. **Deposit Flow - Step 2: Network Selection**
- [ ] **4.1** Create network selection modal
  - Dark overlay background
  - "Select Network" header with back arrow
- [ ] **4.2** Implement network options list
  - Ethereum option with checkmark and orange dot
  - Solana option
  - BNB option with BNB logo
  - Avalanche option with AVAX logo
- [ ] **4.3** Add network selection states
  - Selected state with orange accent
  - Hover/touch states
  - Network icons and names
- [ ] **4.4** Create network confirmation
  - "SELECT" button at bottom
  - Orange button styling

#### 5. **Deposit Flow - Step 3: Token Selection**
- [ ] **5.1** Create token selection modal
  - "Select Token" header
  - Back navigation arrow
- [ ] **5.2** Implement token options
  - Tether USDT with logo and checkmark
  - USDC option
  - SHIBA INU option with SHIB logo
  - Token icons and full names
- [ ] **5.3** Add token selection functionality
  - Selected state indicators
  - Token balance display (if applicable)
  - "SELECT" button confirmation

#### 6. **Deposit Flow - Step 4: QR Code & Address**
- [ ] **6.1** Create QR code display screen
  - "Buy Chips" header
  - Crypto/Fiat tab persistence
  - Large QR code in center
- [ ] **6.2** Implement address information
  - Full wallet address display
  - "Tether" token confirmation
  - "500 to 5 USDT" amount range
  - Network: "Ethereum" confirmation
- [ ] **6.3** Add copy functionality
  - Copy button for wallet address
  - Toast notification for successful copy
  - QR code scanning instructions

#### 7. **Deposit Flow - Step 5: Payment Method Selection**
- [ ] **7.1** Create payment method screen
  - Amount display: "1000"
  - "Payment Method" dropdown
  - Your Bill section
- [ ] **7.2** Build payment methods modal
  - "Select Method" header
  - PayPal option with logo and checkmark
  - Google Pay option
  - Apple Pay option
  - Visa card option
  - Master Card option
- [ ] **7.3** Implement payment method states
  - Selected state with orange accent
  - Payment provider logos
  - "SELECT" button

#### 8. **Deposit Flow - Step 6: Payment Details**
- [ ] **8.1** Create payment details screen
  - "Chip" tab active state
  - Amount: "1000" display
  - "Paypal" method confirmation
- [ ] **8.2** Build payment breakdown
  - "Your Bill" itemized list
  - Provider, Method, Operation Type
  - Card details (if applicable)
  - Total amounts and fees
- [ ] **8.3** Add payment terms
  - User Agreement checkbox
  - Terms and conditions link
  - "CONTINUE" button
  - Amount confirmation (207.55 USD example)

#### 9. **Deposit Flow - Step 7: Success State**
- [ ] **9.1** Create congratulations screen
  - "Congratulations" header with X close
  - Success animation/illustration
  - Coin icon with glow effect
- [ ] **9.2** Implement success messaging
  - "You've purchased 1000 Coins" message
  - Purchase confirmation details
  - "GREAT!" acknowledgment button
- [ ] **9.3** Add success interactions
  - Confetti or particle effects
  - Sound feedback (if enabled)
  - Auto-close timer option

#### 10. **Backend Integration**
- [ ] **10.1** Payment processor integration
  - PayPal SDK integration
  - Google Pay API
  - Apple Pay configuration
  - Stripe for card payments
- [ ] **10.2** Cryptocurrency payment handling
  - Wallet address generation
  - Transaction monitoring
  - Confirmation waiting states
  - Error handling for failed transactions
- [ ] **10.3** Transaction history storage
  - Database schema for deposit records
  - Status tracking (pending, completed, failed)
  - Receipt generation
  - Refund handling

#### 11. **Error States & Edge Cases**
- [ ] **11.1** Network connection errors
  - Offline state handling
  - Retry mechanisms
  - Connection lost during payment
- [ ] **11.2** Payment failures
  - Insufficient funds messages
  - Payment declined states
  - Alternative payment suggestions
- [ ] **11.3** Validation errors
  - Amount limits validation
  - Invalid address handling
  - Expired payment sessions
- [ ] **11.4** Loading states
  - Payment processing animations
  - QR code generation loading
  - Network selection loading

### 🏧 WITHDRAWAL SYSTEM IMPLEMENTATION

#### 12. **Withdrawal Flow - Step 1: Initial Setup**
- [ ] **12.1** Create withdrawal screen header
  - Back arrow navigation
  - "Withdraw" title centered
  - Consistent header styling
- [ ] **12.2** Implement withdrawal tabs
  - "Crypto" tab (active/selected state)
  - "Fiat" tab (inactive state) 
  - Orange active tab styling matching deposit flow
- [ ] **12.3** Build withdrawal amount interface
  - Large amount input field showing "1000"
  - "Withdrawal Method" dropdown with arrow indicator
  - Yellow/orange input highlight consistency
- [ ] **12.4** Create withdrawal form fields
  - Amount field with validation
  - "You will get" conversion display (e.g., "520.50 USD")
  - Method selection dropdown
  - Clear visual hierarchy

#### 13. **Withdrawal Flow - Step 2: Method Selection**
- [ ] **13.1** Create withdrawal method modal
  - Dark overlay background
  - "Select Method" header with back arrow
  - Consistent modal styling with deposit flow
- [ ] **13.2** Implement withdrawal method options
  - PayPal option with logo and orange checkmark
  - Google Pay option with G logo
  - Apple Pay option with Apple logo  
  - Visa option with card logo
  - Master Card option with MC logo
- [ ] **13.3** Add method selection states
  - Selected state with orange accent dot
  - Hover/touch feedback states
  - Payment provider icons and branding
- [ ] **13.4** Create method confirmation
  - "SELECT" button at bottom
  - Orange gradient button styling

#### 14. **Withdrawal Flow - Step 3: Payment Details**
- [ ] **14.1** Create detailed withdrawal screen
  - "Chip" tab active state persistence
  - Amount display: "1000" 
  - Selected method confirmation (e.g., "Paypal")
- [ ] **14.2** Build withdrawal breakdown
  - "Your Bill" itemized section
  - Provider, Method, Operation Type fields
  - Account details display
  - Fee calculations and total amounts
- [ ] **14.3** Add withdrawal terms
  - User Agreement checkbox
  - Terms and conditions acceptance
  - "CONTINUE" button with orange styling
  - Final amount display (e.g., "575.83 USD")

#### 15. **Withdrawal Flow - Step 4: Crypto Network Selection**
- [ ] **15.1** Create crypto withdrawal options
  - Network selection interface
  - Warning/info text about blockchain processing
  - "Network" dropdown functionality
- [ ] **15.2** Implement network selection modal
  - "Select Network" header
  - Ethereum option with ETH logo and checkmark
  - Solana option with SOL logo
  - BNB option with BNB Chain logo  
  - Avalanche option with AVAX logo
- [ ] **15.3** Add network-specific information
  - Selected state with orange accent
  - Network fees display
  - Processing time estimates
  - "SELECT" button confirmation

#### 16. **Withdrawal Flow - Step 5: Token Selection**
- [ ] **16.1** Create token selection interface
  - "Select Token" header with back navigation
  - Token amount display and conversion
  - Wallet address input field
- [ ] **16.2** Implement token options list
  - Tether USDT with logo and checkmark
  - USDC option with logo
  - SHIBA INU option with SHIB logo
  - Token balance validation
- [ ] **16.3** Add wallet address functionality
  - Address input field with validation
  - QR code scanner option (if applicable)
  - Address format verification
  - "SELECT" button for confirmation

#### 17. **Withdrawal Flow - Step 6: Final Review**
- [ ] **17.1** Create withdrawal review screen
  - Amount confirmation: "1000 Coins"
  - Network display: "Ethereum"
  - Token display: "USDT"
  - Final conversion: "526.6 USDT"
- [ ] **17.2** Build address confirmation
  - Full wallet address display
  - Address truncation with copy functionality
  - Network and token verification
  - Warning text about irreversible transactions
- [ ] **17.3** Add final confirmation
  - User Agreement checkbox final confirmation
  - Terms acceptance requirement
  - "WITHDRAW" button with special styling
  - Security warnings and disclaimers

#### 18. **Withdrawal Flow - Step 7: Success State**
- [ ] **18.1** Create withdrawal success screen
  - "Congratulations" header with X close button
  - Success celebration animation
  - Coin icon with glow effect
- [ ] **18.2** Implement success messaging
  - "You've withdrawn 1000 Coins" confirmation
  - Payment method confirmation ("via Paypal")
  - Transaction ID or reference number
- [ ] **18.3** Add success interactions
  - "GREAT!" acknowledgment button
  - Transaction receipt option
  - Success sound and haptic feedback
  - Navigation back to wallet

#### 19. **Withdrawal Validation & Security**
- [ ] **19.1** Amount validation
  - Minimum withdrawal limits
  - Maximum daily/monthly limits
  - Available balance checking
  - Fee calculation and display
- [ ] **19.2** Address validation
  - Format verification for each network
  - Checksum validation for applicable networks
  - Invalid address error handling
  - Address book functionality (optional)
- [ ] **19.3** Security measures
  - Two-factor authentication integration
  - Email confirmation requirements
  - SMS verification (if applicable)
  - Withdrawal cooldown periods
- [ ] **19.4** Fraud prevention
  - Suspicious activity detection
  - Rate limiting on withdrawal attempts
  - IP address verification
  - Account verification status checks

#### 20. **Backend Integration - Withdrawals**
- [ ] **20.1** Payment processor integration
  - PayPal withdrawal API integration
  - Google Pay withdrawal handling
  - Apple Pay withdrawal processing
  - Bank card withdrawal systems
- [ ] **20.2** Cryptocurrency withdrawal handling
  - Wallet integration for outgoing transactions
  - Transaction broadcasting to networks
  - Confirmation monitoring and updates
  - Failed transaction handling and refunds
- [ ] **20.3** Withdrawal record management
  - Database schema for withdrawal records
  - Status tracking (pending, processing, completed, failed)
  - Transaction history integration
  - Audit trail for compliance

#### 21. **Withdrawal Error States & Edge Cases**
- [ ] **21.1** Insufficient funds handling
  - Clear error messaging
  - Available balance display
  - Suggested withdrawal amounts
  - Alternative withdrawal methods
- [ ] **21.2** Network/processing failures
  - Transaction failed states
  - Retry mechanisms for failed withdrawals
  - Customer support integration
  - Refund processing for failed transactions
- [ ] **21.3** Validation errors
  - Invalid address format messages
  - Minimum/maximum amount violations
  - Network mismatch warnings
  - Expired session handling
- [ ] **21.4** Loading and pending states
  - Processing animations during withdrawal
  - Estimated completion times
  - Progress indicators for multi-step process
  - Real-time status updates

#### 22. **Withdrawal Settings & Preferences**
- [ ] **22.1** Default withdrawal methods
  - Saved payment method preferences
  - Default network selection for crypto
  - Preferred withdrawal amounts
  - Auto-withdrawal settings (if applicable)
- [ ] **22.2** Withdrawal limits configuration
  - User-defined daily limits
  - Security-based limit adjustments
  - VIP/premium user higher limits
  - Temporary limit modifications
- [ ] **22.3** Notification preferences
  - Email notifications for withdrawals
  - SMS alerts for large withdrawals
  - Push notifications for status updates
  - Transaction confirmation preferences

### 🏆 RATINGS/LEADERBOARD SYSTEM IMPLEMENTATION

#### 23. **Main Ratings Screen**
- [ ] **23.1** Create ratings screen header
  - Navigation hamburger menu (top left)
  - "Wallet" title centered
  - Coin balance display with plus icon (top right)
  - Consistent header styling with wallet screens
- [ ] **23.2** Implement mystery bonus banner
  - Golden gradient background banner
  - "MYSTERY BONUS FOR TOP-10" headline
  - "More info" link/button
  - Floating coin graphics and decorative elements
  - Bitcoin symbol with glow effect
- [ ] **23.3** Create leaderboard section
  - "Top Players" section title
  - Dark section background
  - Smooth scrolling container
  - Loading states for data fetching

#### 24. **Player Ranking Cards**
- [ ] **24.1** Design ranking card layout
  - Dark card backgrounds with subtle gradients
  - Rounded corners and consistent spacing
  - Hover/touch states with subtle animations
  - Rank position highlighting
- [ ] **24.2** Implement player ranking elements
  - Colored rank number badges (1-7+ positions)
  - Player avatar images (circular)
  - Player username display with truncation
  - Chip amount display with formatting
  - Golden coin icons next to amounts
- [ ] **24.3** Add special player states
  - "YOU" indicator with special styling
  - Current user row highlighting
  - Different rank badge colors (gold, silver, bronze themes)
  - Animation for user's position updates

#### 25. **Ranking System Logic**
- [ ] **25.1** Player data management
  - Fetch top players from backend API
  - Real-time ranking updates
  - Player statistics tracking
  - Chip amount formatting (e.g., "153 531 001")
- [ ] **25.2** Ranking calculations
  - Sort players by total chips/winnings
  - Handle tied positions appropriately
  - Update rankings after games
  - Historical ranking tracking
- [ ] **25.3** User position tracking
  - Find and highlight current user in rankings
  - Show user's current position clearly
  - Position change notifications
  - Personal ranking history

#### 26. **Mystery Bonus System**
- [ ] **26.1** Top-10 bonus mechanics
  - Define bonus criteria and amounts
  - Schedule bonus distributions
  - Track eligible players
  - Bonus claim interface
- [ ] **26.2** Bonus information modal
  - "More info" link functionality
  - Detailed bonus rules and terms
  - Distribution schedule display
  - Historical bonus winners
- [ ] **26.3** Bonus notifications
  - Eligibility notifications for top-10 players
  - Bonus distribution alerts
  - Achievement celebrations for reaching top-10
  - Push notifications for bonus events

#### 27. **Navigation Integration**
- [ ] **27.1** Bottom navigation consistency
  - "Ratings" tab active state with green accent
  - Tab icon and label styling
  - Smooth navigation transitions
  - State persistence between tabs
- [ ] **27.2** Inter-screen navigation
  - Links to player profiles (if applicable)
  - Back navigation to wallet/previous screen
  - Deep linking to specific rankings positions
  - Breadcrumb navigation (if needed)

#### 28. **Data Management & Performance**
- [ ] **28.1** API integration
  - Leaderboard data endpoints
  - Real-time updates via WebSocket
  - Caching strategies for performance
  - Error handling for network issues
- [ ] **28.2** Performance optimization
  - Virtual scrolling for large leaderboards
  - Image lazy loading for player avatars
  - Debounced ranking updates
  - Efficient re-rendering strategies
- [ ] **28.3** Data persistence
  - Local storage for ranking cache
  - Offline mode with cached data
  - Progressive data loading
  - Background sync when online

#### 29. **Visual Polish & Animations**
- [ ] **29.1** Micro-interactions
  - Smooth card hover effects
  - Ranking position change animations
  - Loading skeleton screens
  - Pull-to-refresh functionality
- [ ] **29.2** Visual effects
  - Golden glow effects for top positions
  - Particle effects for mystery bonus banner
  - Subtle background animations
  - Ranking change celebration animations
- [ ] **29.3** Responsive design
  - Mobile-first layout optimization
  - Tablet and desktop adaptations
  - Safe area handling for iOS devices
  - Dynamic text sizing based on content

#### 30. **Backend Infrastructure**
- [ ] **30.1** Database schema
  - Player rankings table
  - Historical ranking data
  - Bonus eligibility tracking
  - Performance metrics storage
- [ ] **30.2** API endpoints
  - GET /api/rankings - fetch current leaderboard
  - GET /api/rankings/history - player ranking history
  - GET /api/bonus/top10 - mystery bonus information
  - Real-time ranking update events
- [ ] **30.3** Security and validation
  - Rate limiting on ranking requests
  - Data validation for ranking updates
  - Anti-fraud measures for chip amounts
  - Secure bonus distribution system

## 📱 LOBBY INTERFACE REDESIGN

### Status Bar & Header Area ✅
- [ ] **Status Bar Integration**: iOS status bar with time (9:41), signal bars, wifi, and battery indicator
- [ ] **Top Navigation Bar**: 
  - [ ] Hamburger menu icon (left) - 3 horizontal lines
  - [ ] "Wallet" text title (center-left) - white text, medium weight
  - [ ] Coin balance display with golden coin icon (1,053,031) - golden coin + white text
  - [ ] Green plus button for adding funds (right) - circular green button with + icon
- [ ] **Header gradient background**: Dark theme (#2C2D36 base) with subtle gradients

### Balance & Promotional Area ✅
- [ ] **Promotional Banner Card**:
  - [ ] Golden gradient background (#F4B942 to #E8A317) with bitcoin symbol
  - [ ] "MYSTERY BONUS FOR TOP-10" headline text - white, bold
  - [ ] "More info" subtitle link - smaller white text
  - [ ] Floating golden coin decorative elements around bitcoin icon
  - [ ] Rounded corners (12px radius)
  - [ ] Full-width with horizontal margins
- [ ] **Balance Display**: Prominent coin count with proper formatting and animations

### Player Profile Header (New Component) ✅
- [ ] **Game Balance Section**:
  - [ ] Player avatar (circular, left side)
  - [ ] "Game Balance" label (white text)
  - [ ] Large balance number "12 560" with coin icon
  - [ ] "Level 16" with orange bar chart icon
  - [ ] Settings gear icon (top right)
  - [ ] Dark background with rounded corners

### Lobby Selection Area ✅
- [ ] **"Last Lobbies" Section Header**: 
  - [ ] "Last Lobbies" text - white, centered, medium weight
  - [ ] Proper top margin from promotional banner
- [ ] **Lobby Cards List**:
  - [ ] **Casino Hall NLH Card**:
    - [ ] Crown icon with golden gradient background
    - [ ] "Casino Hall NLH" title (white, bold)
    - [ ] "Played: 35 games" (gray subtitle)
    - [ ] "Profit: 125,35" (green profit text)
    - [ ] Golden background gradient overlay
    - [ ] Full-width horizontal card design
  - [ ] **Chinatown NLH Card**:
    - [ ] Chinese gate/torii icon with red gradient
    - [ ] "Chinatown NLH" title 
    - [ ] "Played: 21 games"
    - [ ] "Profit: 1025,35" (green profit)
    - [ ] Red/burgundy background gradient
  - [ ] **Forest Hideout NLH Card**:
    - [ ] Tent/camping icon with green gradient
    - [ ] "Forest hideout NLH" title
    - [ ] "Played: 12 games"
    - [ ] "Profit: -12,53" (red loss text)
    - [ ] Green forest background gradient
  - [ ] **Card Specifications**:
    - [ ] Rounded corners (16px)
    - [ ] Horizontal layout with icon left, text center-left
    - [ ] Gradient backgrounds specific to each theme
    - [ ] Consistent padding and spacing
    - [ ] Subtle shadow/glow effects

### Bottom Navigation ✅
- [ ] **Tab Bar Structure**:
  - [ ] **Profile tab**: User silhouette icon, "Profile" label, gray when inactive
  - [ ] **Ratings tab**: Trophy icon, "Ratings" label, gray when inactive
  - [ ] **Lobby tab**: Diamond icon, "Lobby" label, GREEN when active (#00D4AA)
  - [ ] **Store tab**: Shopping cart icon, "Store" label, gray when inactive
  - [ ] **Wallet tab**: Wallet icon, "Wallet" label, gray when inactive
- [ ] **Tab Bar Design**:
  - [ ] Dark background (#2C2D36)
  - [ ] 5 evenly distributed tabs
  - [ ] Icons above text labels
  - [ ] Active state with green color and green underline indicator
  - [ ] Rounded top corners
- [ ] **Safe Area Handling**: Bottom safe area padding + home indicator space

### Create Lobby Functionality ✅
- [ ] **"CREATE PRIVATE LOBBY" Button**:
  - [ ] Full-width golden gradient button (#F4B942 to #E8A317)
  - [ ] Tent/camping icon (left side of text)
  - [ ] "CREATE PRIVATE LOBBY" text (white, bold, centered)
  - [ ] Rounded corners (12px)
  - [ ] Positioned above bottom navigation with margin
  - [ ] Proper touch target sizing (minimum 44pt height)
  - [ ] Subtle shadow effect

### Additional UI Components ✅
- [ ] **Home Indicator**: White iOS home indicator bar at bottom
- [ ] **Overall Layout**:
  - [ ] Dark theme throughout (#1E1F26 background)
  - [ ] Consistent 16px horizontal margins
  - [ ] Proper vertical spacing between sections
  - [ ] Smooth scrolling for lobby list
- [ ] **Typography Scale**:
  - [ ] Headers: Bold, white text
  - [ ] Subtitles: Regular, gray text (#8B8B8B)
  - [ ] Profit/Loss: Green (#4CAF50) / Red (#F44336)
  - [ ] Balance: Large, bold, white text

## 🛠️ IMPLEMENTATION PRIORITY

### Phase 1: Core Layout Structure (CRITICAL) ✅
- [ ] **Mobile-first responsive layout foundation**
- [ ] **Safe area handling for iOS** 
- [ ] **Dark theme color system implementation**:
  - [ ] Primary background: #1E1F26
  - [ ] Card background: #2C2D36  
  - [ ] Text primary: #FFFFFF
  - [ ] Text secondary: #8B8B8B
  - [ ] Accent green: #00D4AA
  - [ ] Gold gradient: #F4B942 to #E8A317
  - [ ] Success green: #4CAF50
  - [ ] Error red: #F44336
- [ ] **Typography system setup**:
  - [ ] Font weights: Regular (400), Medium (500), Bold (700)
  - [ ] Text scales for different component types
- [ ] **Component library foundation**:
  - [ ] LobbyCard component
  - [ ] PromotionalBanner component  
  - [ ] BottomNavigation component
  - [ ] ProfileHeader component

### Phase 2: Lobby Interface Components (HIGH) ✅

#### Header & Balance Components
- [ ] **WalletHeader Component**:
  - [ ] Hamburger menu button with proper touch target
  - [ ] "Wallet" title with correct typography
  - [ ] Balance display with golden coin icon and number formatting
  - [ ] Green circular plus button with hover/active states
  - [ ] Proper spacing and alignment

#### Promotional Components  
- [ ] **PromotionalBanner Component**:
  - [ ] Golden gradient background implementation
  - [ ] Bitcoin symbol icon positioning
  - [ ] "MYSTERY BONUS FOR TOP-10" text styling
  - [ ] "More info" clickable link
  - [ ] Floating coin decorative elements (CSS animations)
  - [ ] Responsive sizing and margins

#### Profile Components
- [ ] **ProfileHeader Component** (Game Balance area):
  - [ ] Circular avatar placeholder/image support
  - [ ] "Game Balance" label styling
  - [ ] Large balance number display with coin icon
  - [ ] Level indicator with orange chart icon  
  - [ ] Settings gear icon with proper positioning
  - [ ] Dark rounded container background

#### Lobby List Components
- [ ] **LobbyCard Component**:
  - [ ] Dynamic background gradients per lobby theme
  - [ ] Icon positioning and sizing (crown, gate, tent)
  - [ ] Title text styling and positioning
  - [ ] Subtitle (games played) styling
  - [ ] Profit/loss text with conditional coloring
  - [ ] Proper card dimensions and spacing
  - [ ] Touch interaction states
  - [ ] **Theme variants**:
    - [ ] Casino Hall: Golden gradient + crown icon
    - [ ] Chinatown: Red gradient + torii gate icon  
    - [ ] Forest Hideout: Green gradient + tent icon

#### Navigation Components
- [ ] **BottomNavigation Component**:
  - [ ] 5-tab layout with proper spacing
  - [ ] Icon + label structure for each tab
  - [ ] Active state styling (green color + underline)
  - [ ] Inactive state styling (gray)
  - [ ] Proper safe area padding
  - [ ] Touch target optimization

#### Action Components  
- [ ] **CreateLobbyButton Component**:
  - [ ] Golden gradient background
  - [ ] Tent icon positioning
  - [ ] Button text styling and centering
  - [ ] Proper margins and positioning above navigation
  - [ ] Touch interaction feedback
  - [ ] Minimum 44pt touch target compliance