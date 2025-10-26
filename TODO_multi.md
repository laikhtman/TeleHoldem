
# Texas Hold'em Poker - Multi-Phase Development Tasks

## Project Overview
This document outlines detailed tasks for evolving the functional Texas Hold'em poker prototype into a polished, production-ready application. The tasks are organized by priority and implementation phases.

---

## 🔥 PHASE 1: CRITICAL MOBILE FIXES (IMMEDIATE PRIORITY)

### Task 1.1: Fix Hand Strength Panel Mobile Behavior
**Problem**: Left panel interferes with gameplay on mobile devices
**Priority**: CRITICAL
**Estimated Time**: 2-3 hours

**Detailed Steps**:
1. **Modify visibility logic in poker-game.tsx**:
   - Current: `${isHandStrengthCollapsed ? 'hidden md:block lg:block' : 'pointer-events-auto'}`
   - Update to: `hidden md:block` (completely hidden on mobile)
   - Ensure panel only appears on tablet landscape (≥768px) and above

2. **Update toggle button behavior**:
   - Hide toggle button on small screens (`sm:` and below)
   - Only show on `md:` breakpoint and above
   - Test button visibility across different screen sizes

3. **QA Verification**:
   - [ ] Hand strength panel completely hidden on iPhone (< 768px width)
   - [ ] Toggle button not visible on mobile phones
   - [ ] No visual interference with poker table on mobile
   - [ ] Panel appears correctly on tablet landscape

**Implementation notes (repo code)**
- poker-game layout: `client/src/pages/poker-game.tsx:922` wraps the Hand Strength panel with `div` class `hidden md:block ...`; this already hides on `< md`. Keep wrapper as `hidden md:block` and remove any conditional that could re-show it on mobile.
- Toggle button: `client/src/pages/poker-game.tsx:929` uses `Button` with `className` ``hidden md:block lg:hidden fixed ... h-12 w-12``. This meets the "tablet-only" intent. Do not render any toggle on `< md`.
- Collapse behavior: Panel container at `client/src/pages/poker-game.tsx:944` applies `${isHandStrengthCollapsed ? 'md:hidden lg:block' : ''}` to hide the panel on md when collapsed but show on lg. Keep this conditional; no mobile rendering path exists due to the parent `hidden md:block`.
- HandStrengthIndicator source: `client/src/components/HandStrengthIndicator.tsx` has no mobile-only UI; no changes needed beyond container visibility.
- Validation quick check: ensure `data-testid="button-toggle-hand-strength"` is not present on small screens via responsive classes; verify with responsive devtools.

Progress
- [x] Panel wrapper enforces `hidden md:block` (no mobile render).
- [x] Toggle button now shows on md and larger (changed class to `hidden md:block`; previously hidden on lg).
- [x] Collapse now hides panel on md and lg for consistent behavior when toggle is visible (changed `md:hidden lg:block` to `hidden`).
- [ ] Cross-device QA pending (tablet landscape/portrait, iPhone sizes).

### Task 1.2: Refine Action Controls Container
**Problem**: Action controls background and positioning needs polish
**Priority**: HIGH
**Estimated Time**: 3-4 hours

**Detailed Steps**:
1. **Adjust background opacity and blur**:
   - Current: `bg-card/60 backdrop-blur-md`
   - Test: `bg-card/80 backdrop-blur-lg` for better contrast
   - Ensure readability over table background

2. **Fine-tune mobile spacing**:
   - Review padding and margins for mobile screens
   - Add consistent `pb-[calc(0.5rem+var(--safe-area-bottom))]` for iOS
   - Ensure proper spacing from table edges

3. **Optimize button sizing**:
   - Verify all buttons meet 48px minimum height requirement
   - Check horizontal spacing between action buttons
   - Test thumb accessibility on actual devices

4. **QA Verification**:
   - [ ] Action controls clearly visible over table background
   - [ ] No visual overlap with table elements
   - [ ] All buttons ≥ 48px height for touch interaction
   - [ ] Consistent spacing across mobile orientations

**Implementation notes (repo code)**
- Container block: `client/src/pages/poker-game.tsx:1068` uses id `action-controls` with classes `bg-card/80 backdrop-blur-lg ... pb-[calc(0.75rem+var(--safe-area-bottom))]`. This already reflects the stronger blur/opacity. If further contrast is needed, tune to `bg-card/85 backdrop-blur-xl` and verify text contrast.
- Safe area padding: The same container sets bottom padding with `var(--safe-area-bottom)`; keep this and ensure it persists on all breakpoints.
- Button min heights: In `client/src/components/ActionControls.tsx`, quick-bet buttons set `className="min-h-[56px] xs:min-h-[60px] sm:min-h-[52px] ..."`; primary action buttons (Fold/Check/Call/Bet/Raise) are also large. Confirm all action `Button` usages include `min-h-[48px]` or higher.
- Swipe hint spacing: `client/src/pages/poker-game.tsx:1151` renders the swipe hint at `bottom-[calc(5rem+var(--safe-area-bottom))]`; confirm it does not overlap the controls.
- Test id for container: `action-controls` can be targeted in E2E to assert backdrop/opacity via computed styles.

Progress
- [x] Increased contrast/blur responsively: `bg-card/90 sm:/85 md:/80` and `backdrop-blur-lg sm:backdrop-blur-xl` to balance readability vs. depth across breakpoints.
- [x] Increased mobile padding for comfort: `p-4 xs:p-5 sm:p-6` and larger safe-area bottom padding on xs/sm.
- [x] Safe-area-aware padding retained (`pb-[calc(...+var(--safe-area-bottom))]` across breakpoints).
- [x] Buttons already meet ≥48px min-height in code (quick bet controls 56–60px; start button 48px).
- [ ] On-device QA for overlap and thumb reach pending.

### Task 1.3: Optimize Player Seat Scaling & Layout
**Problem**: Player seats appear cramped with small cards on mobile
**Priority**: HIGH
**Estimated Time**: 4-5 hours

**Detailed Steps**:
1. **Review player positioning algorithm**:
   - Examine `PlayerSeat.tsx` `getPosition()` trigonometric calculations
   - Consider mobile-specific radius adjustments
   - Test 6-player positioning on small screens

2. **Increase card scale for mobile**:
   - Current: `transform scale-90` on cards
   - Test: Remove scale reduction or use `scale-95` for mobile
   - Ensure cards remain distinguishable and readable

3. **Adjust text sizing**:
   - Player names: Review `text-xs xs:text-sm md:text-base`
   - Chip counts: Review `text-xs xs:text-sm md:text-base`
   - Consider increasing base mobile font sizes

4. **QA Verification**:
   - [ ] Player names clearly readable without zooming
   - [ ] Chip counts easily readable with proper contrast
   - [ ] Player cards visible and distinguishable
   - [ ] No overlap between adjacent player seats
   - [ ] Dealer button (D) clearly visible

**Implementation notes (repo code)**
- Seat polar layout: `client/src/components/PlayerSeat.tsx:80` `getPosition()` computes an ellipse using `radiusX`/`radiusY`. For small screens, reduce `bufferPercentage` from `0.12` to ~`0.08` and consider deriving `radiusX/Y` from `window.innerWidth` breakpoints to spread seats further from the center on mobile.
- Card sizing: Actual card sizes come from `client/src/components/PlayingCard.tsx:54` via `cardDimensions` per breakpoint. To increase visual weight on `< 480px`, bump the default from `90x129` to `96x138`, or set the `xs` step to `105x150`.
- Text sizes: `PlayerSeat.tsx:140` sets text sizes through state based on `window.innerWidth` thresholds. Increase mobile (`<480`) from `16px` to `17–18px` and xs from `18px` to `19px` for readability.
- Dealer badge sizing: `PlayerSeat.tsx:223` uses responsive sizes for the "D" badge; keep `xs:w-8 xs:h-8` and ensure contrast over seat backgrounds.
- Prevent overlap: Inspect `seatClasses` and add `md:max-w-[...]` caps if labels overflow; verify with 6 players in portrait.

Progress
- [x] Increased mobile card size for readability (`PlayingCard.tsx` mobile 90x129 -> 96x138; xs 100x143 -> 105x150).
- [x] Increased on-seat typography for mobile/xs (`PlayerSeat.tsx` name/chips: mobile 17px, xs 19px).
- [x] Reduced seat crowding on small screens by expanding seating ellipse (`PlayerSeat.tsx` getPosition: bufferPercentage 0.12 -> 0.08 on <480px; smaller deductions for radiusX/Y).
- [ ] Visual overlap pass on real devices.
- [ ] Adjust name wrapping/truncation if any overflow appears (post-QA).

### Task 1.4: Perfect Table Aspect Ratio & Scaling
**Problem**: Table proportions need mobile-specific optimization
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

**Detailed Steps**:
1. **Review table container sizing**:
   - Current: `max-w-[90%] xs:max-w-[92%] sm:max-w-[95%]`
   - Test different max-widths for optimal mobile viewing
   - Ensure table fills screen appropriately

2. **Adjust height constraints**:
   - Current: `max-h-[min(75vh,800px)]`
   - Consider mobile-specific height limits
   - Account for action controls and safe areas

3. **Fine-tune border radius**:
   - Current: `rounded-[93px] xs:rounded-[113px] sm:rounded-[152px]`
   - Ensure consistent oval shape across all mobile sizes
   - Test on various screen dimensions

4. **QA Verification**:
   - [ ] Table fills screen without excessive whitespace
   - [ ] Oval shape maintains proper proportions
   - [ ] No clipping or viewport overflow
   - [ ] All 6 player positions clearly visible

**Implementation notes (repo code)**
- Outer wood rim: `client/src/pages/poker-game.tsx:966` div with `wood-grain` sets `aspectRatio: '3 / 2'` and rounded radii per breakpoint (`rounded-[100px] ... lg:rounded-[220px]`). Tune aspect ratio to `'1.7 / 1'` for phones if seats clip, via conditional style when `window.innerWidth < 480`.
- Felt surface: `client/src/pages/poker-game.tsx:976` sets inner `rounded-[93px] xs:[113px] sm:[152px] md:[181px] lg:[210px]`. Increase radii slightly on small breakpoints to preserve the ellipse when container width grows.
- Max heights: Container uses `max-h-[min(75vh,800px)]`. On very small heights, consider `max-h-[min(68vh,720px)]` at `sm:` to preserve room for controls.
- Theme color: Felt color comes from `tableThemeColors[settings.tableTheme]`; ensure contrast with chips and text in lighter themes.

Progress
- [x] Added responsive aspect ratio state: `'1.7 / 1'` (<480px), `'1.8 / 1'` (>=480px and <768px), `'3 / 2'` (>=768px). File: `client/src/pages/poker-game.tsx` (state `tableAspect` + resize handler).
- [x] Applied responsive max-h caps to preserve room for controls: base `68vh`, xs `70vh`, sm `72vh`, md `75vh` with pixel caps.
- [x] Constrained table width slightly on small screens: `max-w-[92%]/[94%]/[96%]` up to md, then full width.
- [x] Slightly increased inner felt/outer rim radii on xs/sm to maintain oval proportions at new widths.
- [ ] Visual audit across iPhone SE/14 Pro, small Android, iPad landscape.

---

## 📱 PHASE 2: MOBILE UX REFINEMENTS (HIGH PRIORITY)

### Task 2.1: Safe Area Integration Audit
**Problem**: Ensure UI elements respect iOS safe areas properly
**Priority**: HIGH
**Estimated Time**: 3-4 hours

**Detailed Steps**:
1. **Audit fixed/absolute positioned elements**:
   - Header controls: Verify `top-[calc(1rem+var(--safe-area-top))]`
   - Action controls: Verify `pb-[calc(0.5rem+var(--safe-area-bottom))]`
   - Mobile menu button: Check safe area variables

2. **Test across iOS devices**:
   - iPhone with notch (12, 13, 14)
   - iPhone with Dynamic Island (14 Pro, 15 Pro)
   - iPhone SE (no notch)
   - Verify both portrait and landscape orientations

3. **Validate CSS variables**:
   - Ensure safe area CSS variables load correctly
   - Test fallback values for non-iOS devices
   - Verify consistent behavior across browsers

4. **QA Verification**:
   - [ ] No UI elements hidden behind iOS notch
   - [ ] No UI elements hidden behind home indicator
   - [ ] Consistent margins on devices with/without notches
   - [ ] Safe areas respected in both orientations

**Implementation notes (repo code)**
- CSS variables are defined in `client/src/index.css:117-120` as `--safe-area-* = env(safe-area-inset-*, 0px)`. No runtime JS is needed.
- Header controls: `client/src/pages/poker-game.tsx:905` uses `top-[calc(1rem+var(--safe-area-top))]` and right padding; keep this pattern for all fixed elements.
- Toggle (left edge): `client/src/pages/poker-game.tsx:935` positions the hand-strength toggle with `left-[calc(0.5rem+var(--safe-area-left))]` and `top-[calc(5rem+var(--safe-area-top))]`.
- Swipe hint: `client/src/pages/poker-game.tsx:1153` uses `bottom-[calc(5rem+var(--safe-area-bottom))]`.
- Bottom sheet: `client/src/components/MobileBottomSheet.tsx:60` FAB and sheet container both include safe-area offsets; verify padding via devtools on notch and non-notch iPhones.

### Task 2.2: Touch Target Optimization
**Problem**: Ensure all interactive elements are touch-friendly
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

**Detailed Steps**:
1. **Audit button minimum sizes**:
   - Action buttons: Verify `min-h-[48px]` applied consistently
   - Toggle buttons: Verify `h-11 w-11` meets requirements
   - Slider controls: Verify proper touch area

2. **Check element spacing**:
   - Minimum 8px spacing between adjacent buttons
   - Adequate spacing around interactive controls
   - Test tap accuracy without accidental triggers

3. **Mobile device testing**:
   - Test on actual devices with different screen sizes
   - Verify thumb reach and comfort
   - Check for false positive interactions

4. **QA Verification**:
   - [ ] All buttons tappable without zooming
   - [ ] No accidental taps on adjacent elements
   - [ ] Slider responds smoothly to touch
   - [ ] Toggle buttons respond consistently

**Implementation notes (repo code)**
- Global buttons: The header `Settings` button uses `className="min-h-11 min-w-11"` at `client/src/pages/poker-game.tsx:910` (~44px). `ThemeToggle` buttons enforce `min-[44px]` at `client/src/components/ThemeToggle.tsx:37` and `:57`.
- Action controls: Quick bet buttons in `client/src/components/ActionControls.tsx` specify min heights `56–60px` across mobile breakpoints. Ensure primary action row buttons also meet `>=48px` and maintain `gap-3` or more between siblings.
- Sliders and draggables: `Slider` uses larger track height via `className` overrides; draggable chips in ActionControls expose four values; confirm there’s at least 8px spacing between draggables.
- Toggle hand-strength button: `poker-game.tsx:935` uses `h-12 w-12` for ample target; remains hidden on mobile.

### Task 2.3: Typography & Contrast Mobile Optimization
**Problem**: Ensure text readability on mobile screens
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

**Detailed Steps**:
1. **Review font sizes across breakpoints**:
   - Player names, chip counts, pot display
   - Action history text sizes
   - Ensure minimum readable sizes maintained

2. **Verify contrast ratios**:
   - Test under different lighting conditions
   - Ensure backdrop blur doesn't reduce readability
   - Check against accessibility standards (4.5:1 minimum)

3. **Test text behavior**:
   - Check truncation and wrapping
   - Verify consistent font rendering
   - Test with iOS accessibility text scaling

4. **QA Verification**:
   - [ ] All text readable without zooming
   - [ ] High contrast in all lighting conditions
   - [ ] No critical information truncated
   - [ ] Consistent rendering across browsers

**Implementation notes (repo code)**
- Player seat typography: `client/src/components/PlayerSeat.tsx` derives sizes from `window.innerWidth` and inline styles; raise baseline to 17–18px on `<480` and 19px on `>=480` for `name/chips`.
- Pot/hand text: `client/src/components/PotDisplay.tsx` and `client/src/components/HandStrengthIndicator.tsx` use `Badge` and small text; verify contrast against `bg-card` and adjust tokens in `client/src/index.css` (`--muted-foreground`, `--card-foreground`) if needed.
- Contrast tokens: Tailwind CSS variables in `client/src/index.css` define `--accent`, `--muted`, etc. For dark mode, ensure `--muted-foreground` remains >= 4.5:1 against backgrounds.
- Text scaling: Test iOS "Larger Text"—ensure containers avoid clipping by allowing wrap (`break-words`) where necessary in action labels.

---

## ✨ PHASE 3: GAMEPLAY IMPROVEMENTS (HIGH PRIORITY)

### Task 3.1: Action Controls Visibility During Gameplay
**Problem**: Action buttons should replace "Start New Hand" during player turn
**Priority**: HIGH
**Estimated Time**: 3-4 hours

**Detailed Steps**:
1. **Implement turn-based UI logic**:
   - Show Fold, Check/Call, Bet/Raise buttons during human player's turn
   - Hide "Start New Hand" button during active gameplay
   - Only show "Start New Hand" between hands

2. **Add turn indicator**:
   - Clear visual indication when it's human player's turn
   - Pulsing border or highlight effect
   - Consider audio cue for turn notification

3. **Improve action button styling**:
   - Ensure proper visual hierarchy
   - Add accessibility labels and keyboard shortcuts
   - Consistent sizing and spacing

4. **QA Verification**:
   - [ ] Action buttons appear when it's player's turn
   - [ ] "Start New Hand" hidden during gameplay
   - [ ] Clear turn indication provided
   - [ ] Action buttons properly styled and accessible

**Implementation notes (repo code)**
- Visibility logic exists: `client/src/pages/poker-game.tsx:1069-1100` renders the Start button only for `phase === 'waiting'`; otherwise renders `<ActionControls />`. This already satisfies replacement during a hand.
- Turn gating: `<ActionControls disabled={gameState.currentPlayerIndex !== 0 || isProcessing || settings.isPaused} ... />` ensures buttons only enable on the human’s turn.
- Additional cue: The pot odds banner (`<PotOddsDisplay />`) shows when a call is required; retain it above controls for guidance during the player’s turn.
- Keyboard shortcuts: `client/src/components/ActionControls.tsx` defines `f/c/r/a` keys; add explicit aria-describedby on the controls container if needed.

### Task 3.2: Better Turn Management
**Problem**: Unclear whose turn it is during gameplay
**Priority**: MEDIUM
**Estimated Time**: 2-3 hours

**Detailed Steps**:
1. **Enhanced visual indicators**:
   - Pulsing glow effect for current player
   - Different styling for human vs bot turns
   - Timer indicator for turn duration

2. **Action feedback improvements**:
   - Brief animation when action is taken
   - Clear transition between players
   - Smooth camera/focus transitions

3. **State management**:
   - Ensure turn state is always accurate
   - Handle edge cases (disconnection, timeout)
   - Proper turn progression logic

4. **QA Verification**:
   - [ ] Current player clearly highlighted
   - [ ] Smooth transitions between turns
   - [ ] Turn timer visible and functional
   - [ ] No ambiguity about whose turn it is

**Implementation notes (repo code)**
- Current player highlight: `client/src/components/PlayerSeat.tsx:114` seatClasses add `animate-pulse-glow` and a gold border when `isCurrentPlayer`.
- Bot timer: `PlayerSeat.tsx:196` shows `<TurnTimer duration={800} />` for bot turns. Consider also showing a subtle timer ring for the human player on their turn to match.
- State source of truth: Turns are driven by `client/src/lib/gameEngine.ts` and `poker-game.tsx` handlers (fold/check/call/bet/raise). Validate `gameEngine.getNextPlayerIndex` progression in all phases and that `processBotActions` exits once `currentPlayerIndex === 0`.
- Announcements: `addActionHistory` in `poker-game.tsx` controls history; ensure a "Your turn" toast/aria-live fires when index changes to 0.

---

## 🎨 PHASE 4: VISUAL POLISH & ANIMATIONS (MEDIUM PRIORITY)

### Task 4.1: Enhanced Card Animations
**Problem**: Card dealing and reveal animations need polish
**Priority**: MEDIUM
**Estimated Time**: 4-5 hours

**Detailed Steps**:
1. **Smooth card dealing animation**:
   - Cards slide from deck position to player hands
   - Realistic arc trajectory and timing
   - Staggered dealing for multiple cards

2. **Card flip animation**:
   - 3D rotation effect for card reveals
   - Proper timing and easing curves
   - Community card staggered reveals (0.2s delay)

3. **Performance optimization**:
   - Use CSS transforms for GPU acceleration
   - Limit simultaneous animations
   - Test on slower mobile devices

4. **QA Verification**:
   - [ ] Smooth card dealing from deck
   - [ ] Realistic flip animations
   - [ ] Staggered flop card reveals
   - [ ] Good performance on mobile devices

**Implementation notes (repo code)**
- Dealing/flip: `client/src/components/PlayingCard.tsx` already uses framer-motion for deal and flip. Tweak `duration` (deal: 0.8s, flip: 0.4s) and `ease` to achieve smoother arcs; confirm `dealDelay` staggering set from seat position in `PlayerSeat.tsx:260`.
- Community cards: `client/src/components/CommunityCards.tsx` animates with skeleton placeholders between phases; tune `transition` timings (`0.3–0.4s`) and glow effect duration (`1.8s`) for polish.
- GPU: All movements are transforms; avoid animating `width/height/top/left` on frequently updated nodes.
- Testing: Use React Profiler/Performance tab with CPU throttling; ensure no dropped frames on mid-range phones.

### Task 4.2: Chip Movement & Betting Animations
**Problem**: Chip animations need realistic physics and timing
**Priority**: MEDIUM
**Estimated Time**: 4-6 hours

**Detailed Steps**:
1. **Chip movement animations**:
   - Chips move from player seats to pot with arc trajectory
   - Stack animation when pot is awarded
   - Realistic chip physics and collision

2. **Betting interface animations**:
   - Smooth slider value transitions
   - Chip counting animation for winnings
   - Visual feedback for betting actions

3. **Performance considerations**:
   - Efficient animation using requestAnimationFrame
   - Minimal DOM manipulation during animations
   - Graceful degradation on low-end devices

4. **QA Verification**:
   - [ ] Realistic chip movement to pot
   - [ ] Smooth betting slider animations
   - [ ] Chip stack animations for winners
   - [ ] Good performance across devices

**Implementation notes (repo code)**
- Flying chips: `client/src/components/Chip.tsx` exposes `FlyingChip` with cubic bezier path and sounds. Emitted from `poker-game.tsx` when bets occur; adjust arc peak (`-150`) and `duration` (`0.8s`) as needed and vary `delay` for multi-chip stacks.
- Pot stack: `ChipStack` displays up to 5 chips with stagger; increase count cap or add aggregation badge as already implemented.
- Draggable chips: `ActionControls.tsx` mobile quick betting provides chips; ensure drop target mapping to pot triggers `handleQuickBet` and plays consistent feedback.
- Sound sync: Verify `chip-place` and `chip-stack` sounds align with motion completion via `onAnimationComplete`.

---

## 🧠 PHASE 5: AI & GAME LOGIC ENHANCEMENTS (MEDIUM PRIORITY)

### Task 5.1: Advanced AI Personality System
**Problem**: Bot behavior is predictable and unrealistic
**Priority**: MEDIUM
**Estimated Time**: 6-8 hours

**Detailed Steps**:
1. **Implement AI personalities**:
   - Tight/loose playing styles
   - Aggressive/passive betting patterns
   - Bluffing frequency variations

2. **Positional awareness**:
   - Early position conservative play
   - Late position aggressive play
   - Button stealing behavior

3. **Dynamic difficulty**:
   - Adaptive AI based on player performance
   - Learning from player patterns
   - Balanced challenge progression

4. **Visual personality indicators**:
   - Unique animations per bot
   - Distinct betting behaviors
   - Player profile cards

5. **QA Verification**:
   - [ ] Distinct playing styles observable
   - [ ] Positional play differences clear
   - [ ] Appropriate difficulty scaling
   - [ ] Visual personality distinctions

**Implementation notes (repo code)**
- AI entry points: Bot decisions are produced in `client/src/lib/botAI.ts` and consumed by `poker-game.tsx:401+` in `processBotActions`. Introduce a `BotPersonality` type and per-bot config (tight/loose, aggression, bluff frequency) inside `botAI`.
- State plumbing: Extend `Player` in `shared/schema.ts` to include an optional `personality` field for bots, or maintain a side map keyed by `player.id` inside `botAI`.
- Contextual inputs: `botAI` currently gets state and index; incorporate position (dealerIndex, currentPlayerIndex), stack depth (chips/big blind), and table image of the human.
- Variance: Add small randomness bands to avoid determinism; gate extremes by difficulty setting from `SettingsPanel` if desired.

### Task 5.2: Advanced Game Mechanics
**Problem**: Missing tournament features and advanced gameplay
**Priority**: LOW
**Estimated Time**: 8-10 hours

**Detailed Steps**:
1. **Tournament mode**:
   - Blind level progression
   - Elimination mechanics
   - Leaderboard system

2. **Multi-table support**:
   - Table selection interface
   - Player migration between tables
   - Spectator mode

3. **Advanced statistics**:
   - Hand history with replay
   - Player performance analytics
   - Betting pattern analysis

4. **QA Verification**:
   - [ ] Tournament progression working
   - [ ] Multi-table functionality stable
   - [ ] Statistics accurate and useful

**Implementation notes (repo code)**
- Tournament scaffolding: Add a `mode` to `GameState` (`'cash' | 'tournament'`), blinds schedule, and eliminate players at 0 chips between hands in `startNewHand`.
- Multi-table: The app is single-table; abstract `PokerTable` routes on server (`server/routes.ts`) and add client-side table selection page in `client/src/pages/lobby.tsx` to simulate multiple tables.
- History/replay: Action history is collected in `poker-game.tsx:addActionHistory`. Persist recent hands in localStorage or backend via `apiRequest` and add a simple replay using the same components with a frozen state timeline.

---

## 🏗️ PHASE 6: CODE QUALITY & ARCHITECTURE (LOW PRIORITY)

### Task 6.1: Code Refactoring & Organization
**Problem**: Code could be better organized and maintainable
**Priority**: LOW
**Estimated Time**: 10-12 hours

**Detailed Steps**:
1. **Create usePokerGame hook**:
   - Extract game logic from poker-game.tsx
   - Centralize state management
   - Simplify component structure

2. **Implement Game Context**:
   - Avoid prop drilling
   - Global game state access
   - Better component isolation

3. **Type safety improvements**:
   - Stricter TypeScript types
   - Better error handling
   - Input validation

4. **Performance optimization**:
   - Memoization where appropriate
   - Lazy loading of components
   - Bundle size optimization

5. **QA Verification**:
   - [ ] Cleaner component structure
   - [ ] Reduced prop drilling
   - [ ] Better type safety
   - [ ] Improved performance metrics

**Implementation notes (repo code)**
- Custom hook: Extract game orchestration from `client/src/pages/poker-game.tsx` (state, effects, handlers, persistence) into `usePokerGame()` under `client/src/hooks/`. Return `{gameState, actions, settings, uiFlags}`.
- Context: Provide `PokerGameProvider` with the hook value to avoid prop drilling across `ActionControls`, `PlayerSeat`, `SessionStats`, etc.
- Types: Strengthen `GameState` and `Player` in `shared/schema.ts` with stricter fields and avoid `any` casts; narrow mutation payloads in `client/src/lib/queryClient.ts` usages.
- Performance: Memoize heavy derives (e.g., pot sums) and wrap child components with `memo` where props are stable; ensure framer-motion animations don’t cause unnecessary re-renders.

### Task 6.2: Testing & Quality Assurance
**Problem**: Need comprehensive testing strategy
**Priority**: LOW
**Estimated Time**: 8-10 hours

**Detailed Steps**:
1. **Unit testing setup**:
   - Test game logic functions
   - Component testing with React Testing Library
   - Mock external dependencies

2. **Integration testing**:
   - End-to-end game scenarios
   - User interaction flows
   - Mobile-specific testing

3. **Performance testing**:
   - Memory leak detection
   - Animation performance monitoring
   - Mobile device compatibility

4. **Accessibility testing**:
   - Screen reader compatibility
   - Keyboard navigation
   - Color contrast validation

5. **QA Verification**:
   - [ ] Comprehensive test coverage
   - [ ] Reliable CI/CD pipeline
   - [ ] Performance benchmarks met
   - [ ] Accessibility standards compliant

**Implementation notes (repo code)**
- Unit tests: Cover `gameEngine` pot logic (side pots, ties), `handEvaluator` rankings, and `botAI` decisions. Place under `client/src/lib/__tests__/` using Vitest/Jest.
- Component tests: Test `ActionControls` interactions (buttons, slider, draggables) and `PlayerSeat` turn/badge rendering with React Testing Library.
- E2E smoke: Use Playwright to run through a hand on `client/index.html` with a mocked backend; assert `data-testid` markers like `button-start-hand`, `player-seat-*`, `button-quick-all-in`.
- A11y: Add axe-core checks to pages; ensure `aria-label`/`aria-live` are respected on toasts and status badges.

---

## 📋 COMPREHENSIVE QA CHECKLIST

### Core Gameplay Verification
- [ ] Blinds correctly posted each hand
- [ ] Action order correct (pre-flop and post-flop)
- [ ] Betting, calling, raising work properly
- [ ] All-in scenarios handle side pots correctly
- [ ] Tied hands split pots evenly
- [ ] Zero-chip players removed from next hand
- [ ] Game ends appropriately

### Mobile UI/UX Verification
- [ ] All elements visible without zooming
- [ ] Touch targets ≥ 48px minimum
- [ ] Safe areas respected on iOS devices
- [ ] Swipe gestures work reliably
- [ ] Bottom sheet functions properly
- [ ] Action controls properly positioned
- [ ] Table scales appropriately for mobile

### Visual & Animation Verification
- [ ] Card dealing animations smooth
- [ ] Chip movement realistic and smooth
- [ ] Player turn indicators clear
- [ ] Winner celebrations appropriate
- [ ] All animations perform well on mobile
- [ ] No visual glitches or overlaps

### Accessibility Verification
- [ ] Screen reader compatible
- [ ] Keyboard navigation functional
- [ ] High contrast mode support
- [ ] Color blind friendly indicators
- [ ] Proper ARIA labels throughout

### Performance Verification
- [ ] Smooth 60fps on target devices
- [ ] No memory leaks during extended play
- [ ] Quick load times
- [ ] Efficient battery usage
- [ ] Network resilience

---

## 🎯 SUCCESS METRICS

### User Experience Goals
- [ ] 5-star visual quality rating
- [ ] Zero critical UI layout issues
- [ ] 100% accessibility compliance
- [ ] Smooth performance on target devices

### Technical Goals
- [ ] <100ms response time for actions
- [ ] <3 second initial load time
- [ ] Zero game-breaking bugs
- [ ] Clean, maintainable codebase

### Business Goals
- [ ] High user engagement and retention
- [ ] Positive user feedback
- [ ] Scalable architecture for growth
- [ ] Easy deployment and maintenance

---

## 📅 IMPLEMENTATION TIMELINE

### Week 1: Critical Mobile Fixes (Phase 1)
- Days 1-2: Hand strength panel mobile behavior
- Days 3-4: Action controls container refinement  
- Days 5-7: Player seat scaling and table optimization

### Week 2: Mobile UX Refinements (Phase 2)
- Days 1-2: Safe area integration audit
- Days 3-4: Touch target optimization
- Days 5-7: Typography and contrast improvements

### Week 3: Gameplay Improvements (Phase 3)
- Days 1-3: Action controls visibility during gameplay
- Days 4-5: Turn management improvements
- Days 6-7: Game flow enhancements

### Week 4: Visual Polish (Phase 4)
- Days 1-3: Enhanced card animations
- Days 4-7: Chip movement and betting animations

### Weeks 5-6: Advanced Features (Phase 5)
- AI personality system implementation
- Advanced game mechanics
- Testing and refinement

### Weeks 7-8: Code Quality (Phase 6)
- Refactoring and architecture improvements
- Comprehensive testing setup
- Documentation and deployment

---

## 📝 NOTES

- Each task includes detailed steps, QA verification, and time estimates
- Priority levels help focus on most impactful improvements first
- Mobile experience is prioritized based on UIUX_TODO.md analysis
- Tasks can be worked on in parallel where dependencies allow
- Regular testing on actual mobile devices is essential
- User feedback should guide priority adjustments

This comprehensive task breakdown ensures systematic improvement of the poker application from a functional prototype to a polished, production-ready game.
