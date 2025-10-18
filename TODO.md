AI Development Plan - Phase 2 & 3: Polish & Advanced Features

Project Status: The core gameplay loop is functional. A full hand can be played from start to finish. The UI reflects the game state, including player actions and winner indication.

Next Objective: Evolve the functional prototype into a polished, bug-free, and immersive user experience by adding animations, refining game logic edge cases, enhancing AI, and improving code structure.

Part 1: AI Agent Task List

Here are the specific, sequential tasks for the Gemini code agent, broken down by phase.

Phase 2.1: Initial Polish (From Previous Plan)

**Task 1: Animate Chip Movements (DONE)**

Goal: Create visual feedback for betting actions by animating chips moving from the player to the pot.

Prompt: "Create a new React component named Chip.tsx that renders a single poker chip. Then, in the PlayerSeat.tsx component, when a player's bet prop changes, render a number of Chip components and animate them moving from the player's seat to the pot's location at the center of the table. Use framer-motion for the animation. The animation should be quick (e.g., 300ms) and have an ease-out effect. The chips should disappear after reaching the pot, as the PotDisplay component is the source of truth for the pot amount."

Task 2: Implement "All-In" Logic & Side Pots (DONE)

Goal: Correctly handle the "all-in" state for players, including the creation and distribution of side pots.

Prompt: "Enhance gameEngine.ts to properly manage 'all-in' scenarios.

The GameState interface in shared/schema.ts needs to be updated to support multiple pots. Change pot: number to pots: { amount: number; eligiblePlayerIds: string[] }[].

Update all functions that reference pot to work with the new pots array structure.

In playerBet, if a player goes all-in, their allIn status must be set to true.

Create a new function, calculatePots(gameState: GameState), that is called at the end of each betting round. This function should look at all player bets and construct the main pot and any necessary side pots based on the amounts contributed by each all-in player.

Modify awardPot to awardPots. This function must iterate through each pot (starting with the last side pot), determine the winner(s) eligible for that pot using resolveShowdown, and distribute the chips accordingly."

**Task 3: Improve AI Betting Intelligence (DONE)**

Goal: Make the bot's betting behavior more realistic and less predictable.

Prompt: "In client/src/lib/botAI.ts, refine the getAction method.

The betting amount for a 'bet' or 'raise' should be a percentage of the pot (e.g., between 30% and 70%), with some randomness.

Implement a 'bluffing' probability. Give the AI a small chance (e.g., 10-15%) to make a large bet or raise even with a weak hand, especially in a late position.

Make the AI consider the number of active players. If many players are still in the hand, the AI should be more cautious with medium-strength hands and require a stronger hand to call large bets."

**Task 4: Show All Cards at Showdown (DONE)**

Goal: At the end of a hand, all players who didn't fold should reveal their cards.

Prompt: "In client/src/components/PlayerSeat.tsx, modify the logic for displaying cards. The faceDown prop for <PlayingCard /> should be determined by this logic: !player.isHuman && gameState.phase !== 'showdown'. This will ensure bot cards are hidden during the hand but are revealed automatically when the phase becomes 'showdown'."

Phase 2.2: Core Gameplay & Edge Cases

**Task 5: Handle Zero-Chip Players (DONE)**

Goal: Players who run out of chips should be marked as "out" and not included in new hands.

Prompt: "In gameEngine.ts, update the startNewHand function. Before dealing cards, filter the players array to only include players with chips > 0. If the human player has 0 chips, prevent the new hand from starting and display a 'Game Over' message."

**Task 6: Implement Correct Post-Flop Action Order (DONE)**

Goal: In post-flop rounds (Flop, Turn, River), the action must start with the first active player to the left of the dealer button.

Prompt: "In poker-game.tsx, locate the logic where the game advances to the next phase inside processBotActions. When a new phase starts, the currentPlayerIndex must be set to the first player after the dealerIndex who has not folded. Modify the loop that finds the nextPlayerIndex to start from (currentState.dealerIndex + 1) % NUM_PLAYERS."

**Task 7: Handle Split Pots on Ties (DONE)**

Goal: If multiple players have the same winning hand, the pot must be split evenly between them.

Prompt: "In gameEngine.ts, the awardPot (or awardPots) function already receives an array of winners. Ensure the logic correctly handles this by dividing the pot.amount by winners.length and distributing the chips. Account for any odd chips by giving them to the winner in the earliest position."

Task 8: Enforce Bet Sizing Rules

Goal: A raise must be at least as large as the previous bet or raise in the same betting round.

Prompt: "In poker-game.tsx, calculate a minRaiseAmount based on the game state. The minimum legal raise is the current bet amount plus the size of the last raise. Pass this minRaiseAmount to the ActionControls component. The slider's minimum value should be adjusted to this minRaiseAmount when the player chooses to raise."

Task 9: Award Pot on Uncalled Bet

Goal: If a player bets and all other players fold, they win the pot immediately without a showdown.

Prompt: "In poker-game.tsx, inside the processBotActions and handlePlayerAction functions, add a check after every action. If the number of activePlayers (non-folded) is reduced to 1, immediately end the hand, call awardPot for the single remaining player, and set the game phase to 'waiting'."

Phase 2.3: UI/UX & Visual Polish

Task 10: Animate Community Card Dealing

Goal: Animate the flop, turn, and river cards being dealt and flipped over.

Prompt: "In client/src/components/PlayingCard.tsx, add a isFlipping state. When the card is first rendered, it should be face-down. After a short delay (e.g., 100ms), set isFlipping to true. Use CSS transitions or framer-motion to create a card-flipping animation (a rotation on the Y-axis). Apply this logic within the CommunityCards.tsx component, adding a staggered delay for each card in the flop."

Task 11: Display Player Action Badges

Goal: When a player acts, a temporary badge showing their action should appear over their seat.

Prompt: "In PlayerSeat.tsx, add a component that displays the player's last action (e.g., 'Check', 'Fold', 'Raise $50'). This should be derived from the gameState.lastAction string. The badge should be visible for a few seconds (e.g., 2-3 seconds) after the action and then fade out."

Task 12: Animate Pot Total Updates

Goal: When chips are added to the pot, the number should animate instead of changing instantly.

Prompt: "Create a custom hook useAnimatedCounter(targetValue) that uses framer-motion's useSpring or a similar animation library to smoothly animate a number from its current value to a new targetValue. Apply this hook in the PotDisplay.tsx component to animate the pot amount."

Task 13: Highlight Winning Hand at Showdown

Goal: Clearly show which cards constitute the winning hand.

Prompt: "The handEvaluator.ts needs to be modified. The evaluateHand function should return not only the rank and description but also the specific 5 cards that make up the best hand. In poker-game.tsx, store this array of winning cards in state at showdown. Pass this information down to PlayerSeat.tsx and CommunityCards.tsx. The components should apply a distinct style (e.g., a bright border or a glowing effect) to the cards that are part of the winning combination."

Task 14: Create a Game Log

Goal: Provide a history of actions for the current hand.

Prompt: "In poker-game.tsx, create a new state variable handHistory: string[]. Every time lastAction is updated in the game state, append this action to the handHistory array. Create a new component GameLog.tsx that displays this array in a small, scrollable box on the side of the screen."

Task 15: Add Pre-set Bet Amount Buttons

Goal: Allow the user to quickly bet common amounts.

Prompt: "In ActionControls.tsx, add three new buttons: '1/2 Pot', '3/4 Pot', and 'Pot'. When clicked, these buttons should automatically set the bet slider's value to the corresponding percentage of the current total pot size and then trigger the onBet or onRaise function."

Phase 3.1: Advanced AI & Logic

Task 16: Implement Positional Awareness in AI

Goal: Make the AI play differently based on its position relative to the dealer button.

Prompt: "In botAI.ts, modify the getAction function. Add a parameter for the bot's position (player.position) and the dealer's position (gameState.dealerIndex). Implement logic where the AI plays 'tighter' (requires stronger hands to play) in early positions and 'looser' (plays more hands) in later positions (e.g., on the button)."

Task 17: Track Player Chip Counts

Goal: Players who are eliminated should be visually distinct.

Prompt: "In PlayerSeat.tsx, if a player's chips are 0, render their seat in a disabled or greyed-out state to indicate they are out of the game."

Task 18: Show Hand Strength Indicator (for Human Player)

Goal: Give the human player a visual clue about the strength of their current hand.

Prompt: "In poker-game.tsx, whenever the gameState updates (new hole cards or community cards), call handEvaluator.evaluateHand for the human player. Display the result (e.g., 'Two Pair', 'Flush Draw') as text near the human player's cards."

Phase 3.2: Code Health & Refactoring

Task 19: Create a usePokerGame Custom Hook

Goal: Encapsulate game logic and state management to simplify the PokerGame component.

Prompt: "Refactor poker-game.tsx. Create a new custom hook file usePokerGame.ts. Move all game-related state (gameState, isProcessing, etc.) and all handler functions (startNewHand, handleFold, processBotActions, etc.) into this hook. The hook should return the gameState and the action handlers for the component to use. The PokerGame.tsx component should then become a much simpler view layer that consumes this hook."

Task 20: Implement a Game Context Provider

Goal: Avoid prop drilling the gameState to deeply nested components.

Prompt: "Create a GameContext.tsx file. This file should create a React Context that will hold the gameState. In poker-game.tsx, wrap the main table layout in a <GameContext.Provider> and pass the gameState as its value. Refactor components like PlayerSeat.tsx and CommunityCards.tsx to consume this context using the useContext hook instead of receiving the entire gameState as props."

Part 2: Expanded QA Checklist for Human Review

Core Gameplay

[ ] Blinds: Are small and big blinds correctly posted at the start of each hand?

[ ] Action Order (Pre-flop): Does the action correctly start with the player to the left of the big blind?

[ ] Action Order (Post-flop): Does the action correctly start with the first active player to the left of the dealer?

[ ] Betting: Does a "Bet" correctly set the currentBet?

[ ] Calling: Does a "Call" correctly match the currentBet?

[ ] Raising: Does a "Raise" correctly increase the currentBet? Is the minimum raise amount enforced?

[ ] All-In: Can a player go all-in? If other players bet more, is a side pot created? Are all pots awarded correctly at the end?

[ ] Ties: If two players have the same hand (e.g., two-pair), is the pot split evenly between them?

[ ] Game End: Are players with zero chips removed from the next hand?

UI & Animations

[ ] Chip Animations: Do chips visibly move from the player to the pot on every bet/call/raise?

[ ] Card Animations: Do community cards perform a "flip" animation when revealed?

[ ] Action Badges: Does a text badge appear over a player's seat after they act? Does it fade away after a few seconds?

[ ] Pot Animation: Does the pot's dollar amount animate smoothly when it increases?

[ ] Winner Indication: Is there a clear "WINNER" badge on the winning player(s)? Do all non-folded players' cards become visible at showdown?

[ ] Winning Hand Highlight: Are the 5 cards that form the winning hand visually highlighted for the winner?

AI Behavior

[ ] Bet Sizing: Do bots bet variable amounts based on the pot size?

[ ] Bluffing: Do you ever see a bot make a large raise and then lose the showdown with a weak hand?

[ ] Positional Play: Does the bot on the dealer button seem to play more hands than the bot under the gun?