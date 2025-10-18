
# Instructions for AI Development Agents (Gemini, Codex, etc.)

## 1. Primary Objective

Your primary objective is to develop a client-side Proof of Concept for a Texas Hold'em poker game based on the existing file structure. You must adhere to the modular architecture defined in this document.

## 2. Guiding Principles (Non-Negotiable)

### Strict Separation of Concerns:
- **game-engine-core.js** must NEVER contain code that interacts with the HTML DOM (e.g., `document.getElementById`, `element.innerHTML`). Its sole responsibility is game state and logic.
- **game-table-ui.js** is ONLY for DOM manipulation. It should not contain any game rules or state logic. It reads data from the GameEngine and updates the view.
- **main.js** acts as the orchestrator, connecting the engine to the UI and managing the overall flow of the game.

### Modularity:
All code should be contained within the classes defined in the module files (GameEngine, GameUI, BotAI).

### Clarity over Brevity:
Write clean, well-commented code that is easy for human developers to understand and review.

## 3. Module Responsibilities Breakdown

### GameEngine (game-engine-core.js):
- Manages the deck, players, pot, community cards, and game state (pre-flop, flop, turn, river, showdown)
- Contains all rules for shuffling, dealing, betting, and hand evaluation
- Exposes methods like `startGame()`, `addPlayer()`, and `handlePlayerAction()` to be called from main.js

### GameUI (game-table-ui.js):
- Creates and updates player elements on the screen
- Displays hole cards, community cards, and pot size
- Handles animations for dealing cards and moving chips (to be implemented)

### BotAI (ai-bot-logic.js):
- Provides a method `getAction()` that returns a decision (fold, check, bet, raise) for a bot player based on the current game state

### main.js:
- Initializes instances of GameEngine, GameUI, and BotAI
- Sets up the initial game state (adds players)
- Contains the main game loop which progresses the game through betting rounds
- Listens for user input from the control buttons (`#fold-btn`, etc.) and calls the appropriate methods in the GameEngine

## 4. Current Development Plan & Next Steps

The initial code provides a basic structure. Your next tasks are to implement the placeholder methods and create the main game loop.

### Task 1: Implement the Game Loop in main.js
The current main.js only deals the initial hand. A full game loop is required to manage betting rounds and progress the game.

**Prompt**: "In main.js, create a function `gameLoop()` that manages the flow of the game. It should check whose turn it is. If it's a bot's turn, it should use the `botAI.getAction()` method and automatically call `gameEngine.handlePlayerAction()`. If it's the human player's turn, it should wait for input from the control buttons."

### Task 2: Flesh out handlePlayerAction() in game-engine-core.js
The current method is a placeholder. It needs to be updated to handle actual game logic.

**Prompt**: "In game-engine-core.js, implement the logic for the `handlePlayerAction(action, amount)` method. It should handle 'fold', 'check', 'bet', and 'call' actions by updating the player's state (hasFolded), chips, current bet, and the total pot. After an action, it should advance `this.currentPlayerIndex` to the next active player."

### Task 3: Implement Hand Evaluation in game-engine-core.js
The `evaluateHands()` method is a placeholder. It needs a robust algorithm to determine the winning hand.

**Prompt**: "In game-engine-core.js, implement the `evaluateHands()` method. It must take a player's two hole cards and the five community cards and determine the best possible five-card poker hand. It should be able to identify Royal Flush, Straight Flush, Four of a Kind, Full House, Flush, Straight, Three of a Kind, Two Pair, One Pair, and High Card."
