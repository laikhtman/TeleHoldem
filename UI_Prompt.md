Goal
- Act as a senior mobile-first UI/UX architect. Produce an exact, step-by-step plan to build and verify the TeleHoldem poker UI to production quality, grounded in proven patterns from successful apps. Your output should be actionable for engineers working in this repository.

Context
- Codebase: React + Vite + TypeScript, Tailwind CSS, shadcn/ui components, framer-motion.
- Key files for game UI today:
  - client/src/pages/poker-game.tsx
  - client/src/components/PlayerSeat.tsx
  - client/src/components/PlayingCard.tsx
  - client/src/components/ActionControls.tsx
  - client/src/components/CommunityCards.tsx
  - client/src/components/PotDisplay.tsx
  - client/src/components/HandStrengthIndicator.tsx
  - client/src/index.css (theme tokens and safe-area vars)
- Snapshot tooling for QA screenshots: scripts/snapshots.ts (Playwright).

Inspiration Baselines (do not copy; extract patterns)
- Poker UIs: PokerStars Mobile, Zynga Poker, WSOP mobile (seat readability, turn indicators, chip animations, action bars).
- Control surfaces: Apple Human Interface Guidelines (iOS touch targets, safe areas, typography), Material Design (elevation, states), Telegram Mini App best practices (inset handling, performance).

Deliverables (structure your answer using these section headers)
1) Information Architecture
- Define all views, subviews and persistent UI regions: table, seats, community cards, pot, action controls, overlays, toasts, bottom sheet, left “hand strength” panel, right “history/stats” rail.
- Provide a lightweight component tree showing ownership and render order. Reference existing file paths and propose refactors only where high value.

2) Visual System and Tokens
- Specify typography scale per breakpoint (xs/sm/md/lg) and min sizes for mobile.
- Define spacing, radii, elevation, blur, color tokens mapped to current CSS variables in client/src/index.css.
- State styles for interactive elements (hover, pressed, disabled, focus-visible).

3) Layout and Breakpoints
- Provide exact breakpoint behavior for each major region:
  - Hand Strength panel: fully hidden < md; toggle-only on md; panel open/close on md+.
  - Right rail (history/stats): hidden < lg; sticky column on lg+.
  - Table container: aspect ratios per viewport: <480px → 1.9/1, 480–767px → 1.85/1, ≥768px → 3/2. Max-h caps and safe-area-aware paddings.
- Include seat-placement algorithm guidance: ellipse parameters and scaling rules across device sizes (target 6 seats, portrait priority). Give exact formulas and constants.

4) Component Specs (APIs + behavior)
- For each major component (PlayerSeat, PlayingCard, ActionControls, CommunityCards, PotDisplay, HandStrengthIndicator, FloatingActionMenu, MobileBottomSheet):
  - Props schema (required/optional), example usage, default sizes, accessibility attributes.
  - Interaction states and keyboard shortcuts (f/c/r/a), swipe gestures.
  - Animation timings and easing (deal, flip, chip arc, focus/turn glow).
  - Error/edge-state rendering (folded, all-in, out-of-chips, offline).

5) Gestures, Haptics, and Sound
- Specify swipe regions and thresholds, draggable chips behavior on mobile, and when to trigger haptic types and sound cues.

6) Accessibility Plan
- Provide WCAG 2.1 AA checklist tailored to the app:
  - Color contrast targets and tokens to adjust.
  - Accessible names for controls, aria-live for action toasts, focus order, keyboard operability for desktop.
  - Text scaling handling and truncation rules.

7) Performance and Animations Budget
- Frame budget (60fps), max concurrent animations, transform-only constraint, image/vector strategy, motion-reduce fallback.
- Profiling steps and guardrails for framer-motion.

8) QA Strategy (authoritative and exhaustive)
- Device matrix: iPhone SE/8/12/14 Pro, small Android, iPad portrait/landscape, desktop 1280×800.
- Test phases and exact checks:
  - Layout and safe area: verify no UI obstructed by notch/home indicator; seat non-overlap; table oval proportion; control padding.
  - Action Controls: visibility logic (waiting vs in-hand), button sizes ≥48px, spacing, tap slop tolerance.
  - Turn management UX: current player highlight, timer, toasts.
  - Animations: cards, chips, community reveals; jank-free with CPU-throttle.
  - Accessibility: screen reader labels, focus order, contrast measurements.
  - Performance: memory, FPS snapshots.
- Screenshot protocol:
  - Use npm run snapshots (scripts/snapshots.ts) to capture standard breakpoints; attach expected deltas per task.
  - Describe what to visually inspect in each capture.

9) References to Working Patterns
- List concrete patterns from successful poker apps and platform guides that directly inform our UI decisions (seat glow, action bar grouping, chip stack legibility, onboarding tips). Keep it high-signal and rationale-driven.

10) Implementation Plan (sequenced and actionable)
- Provide a step-by-step plan in task-size chunks (1–2 hours each) aligned to our current repo. Include exact files to modify, Tailwind utility targets, and minimal diff sketches when necessary.
- Include validation steps after each change (what to look at in snapshots, what a11y checks to run).

11) Acceptance Criteria
- Convert the plan into binary pass/fail checks per section. These must be unambiguous and mappable to screenshots or devtools audits.

Constraints
- Prefer minimal invasive changes to current code; refactor only where it unlocks maintainability or performance.
- Use existing libraries/utilities (Tailwind, shadcn/ui, framer-motion, the safe-area variables in client/src/index.css).
- Keep mobile portrait as the primary target; ensure landscape and desktop remain elegant.

Style of your response
- Be precise, prescriptive, and repo-aware. Cite exact selectors, props, or line-anchored file paths like client/src/pages/poker-game.tsx where helpful. Provide numeric values and constants rather than generalities.
- Favor short, high-signal bullets. Avoid prose filler.
- Assume engineers will execute the plan immediately; ambiguity slows us down.

Output requirements
- A single, comprehensive document following the Deliverables section headers, ready to be copy-pasted into a ticket or design spec.
- Include a short “Day 1–3” execution schedule at the end to bootstrap work.

