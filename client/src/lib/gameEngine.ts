import { Card, Player, GameState, SUITS, RANKS, Suit, Rank, GamePhase } from '@shared/schema';

export class GameEngine {
  createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          rank,
          suit,
          id: `${rank}${suit}`
        });
      }
    }
    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  dealCards(deck: Card[], numCards: number): { dealtCards: Card[]; remainingDeck: Card[] } {
    const dealtCards = deck.slice(0, numCards);
    const remainingDeck = deck.slice(numCards);
    return { dealtCards, remainingDeck };
  }

  createInitialGameState(numPlayers: number): GameState {
    const players: Player[] = [];
    
    // Create human player
    players.push({
      id: '0',
      name: 'You',
      chips: 1000,
      hand: [],
      bet: 0,
      folded: false,
      allIn: false,
      isHuman: true,
      position: 0
    });

    // Create bot players
    for (let i = 1; i < numPlayers; i++) {
      players.push({
        id: String(i),
        name: `Bot ${i}`,
        chips: 1000,
        hand: [],
        bet: 0,
        folded: false,
        allIn: false,
        isHuman: false,
        position: i
      });
    }

    return {
      players,
      deck: this.createDeck(),
      communityCards: [],
      pot: 0,
      currentPlayerIndex: 0,
      dealerIndex: 0,
      phase: 'waiting',
      currentBet: 0,
      lastAction: null
    };
  }

  startNewHand(gameState: GameState): GameState {
    const deck = this.createDeck();
    const players = gameState.players.map(p => ({
      ...p,
      hand: [],
      bet: 0,
      folded: false,
      allIn: false
    }));

    // Deal 2 cards to each player
    let currentDeck = deck;
    const updatedPlayers = players.map(player => {
      const { dealtCards, remainingDeck } = this.dealCards(currentDeck, 2);
      currentDeck = remainingDeck;
      return { ...player, hand: dealtCards };
    });

    // Move dealer button
    const newDealerIndex = (gameState.dealerIndex + 1) % players.length;

    return {
      ...gameState,
      players: updatedPlayers,
      deck: currentDeck,
      communityCards: [],
      pot: 0,
      currentBet: 0,
      dealerIndex: newDealerIndex,
      currentPlayerIndex: (newDealerIndex + 1) % players.length,
      phase: 'pre-flop',
      lastAction: 'New hand started'
    };
  }

  dealCommunityCards(gameState: GameState, numCards: number): GameState {
    const { dealtCards, remainingDeck } = this.dealCards(gameState.deck, numCards);
    
    return {
      ...gameState,
      communityCards: [...gameState.communityCards, ...dealtCards],
      deck: remainingDeck
    };
  }

  advancePhase(gameState: GameState): GameState {
    const phaseTransitions: Record<GamePhase, { next: GamePhase; dealCards: number }> = {
      'waiting': { next: 'pre-flop', dealCards: 0 },
      'pre-flop': { next: 'flop', dealCards: 3 },
      'flop': { next: 'turn', dealCards: 1 },
      'turn': { next: 'river', dealCards: 1 },
      'river': { next: 'showdown', dealCards: 0 },
      'showdown': { next: 'waiting', dealCards: 0 }
    };

    const transition = phaseTransitions[gameState.phase];
    let newState = { ...gameState, phase: transition.next };

    if (transition.dealCards > 0) {
      newState = this.dealCommunityCards(newState, transition.dealCards);
    }

    // Reset current bet for new betting round
    newState.currentBet = 0;
    newState.players = newState.players.map(p => ({ ...p, bet: 0 }));

    return newState;
  }

  playerFold(gameState: GameState, playerIndex: number): GameState {
    const players = [...gameState.players];
    players[playerIndex] = { ...players[playerIndex], folded: true };
    
    return {
      ...gameState,
      players,
      lastAction: `${players[playerIndex].name} folds`
    };
  }

  playerCheck(gameState: GameState, playerIndex: number): GameState {
    return {
      ...gameState,
      lastAction: `${gameState.players[playerIndex].name} checks`
    };
  }

  playerBet(gameState: GameState, playerIndex: number, amount: number): GameState {
    const players = [...gameState.players];
    const player = players[playerIndex];
    
    const actualBet = Math.min(amount, player.chips);
    players[playerIndex] = {
      ...player,
      chips: player.chips - actualBet,
      bet: player.bet + actualBet,
      allIn: player.chips - actualBet === 0
    };

    return {
      ...gameState,
      players,
      pot: gameState.pot + actualBet,
      currentBet: Math.max(gameState.currentBet, players[playerIndex].bet),
      lastAction: `${player.name} bets $${actualBet}`
    };
  }

  getNextPlayerIndex(gameState: GameState): number {
    let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    let attempts = 0;
    
    // Skip folded players
    while (gameState.players[nextIndex].folded && attempts < gameState.players.length) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
      attempts++;
    }
    
    return nextIndex;
  }

  isRoundComplete(gameState: GameState): boolean {
    const activePlayers = gameState.players.filter(p => !p.folded);
    
    if (activePlayers.length <= 1) return true;
    
    // Check if all active players have matched the current bet
    const allBetsMatched = activePlayers.every(p => 
      p.bet === gameState.currentBet || p.allIn
    );
    
    return allBetsMatched;
  }

  getActivePlayers(gameState: GameState): Player[] {
    return gameState.players.filter(p => !p.folded);
  }
}

export const gameEngine = new GameEngine();
