import { Card, Player, GameState, SUITS, RANKS, Suit, Rank, GamePhase } from '@shared/schema';
import { handEvaluator } from './handEvaluator';

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
      pots: [{ amount: 0, eligiblePlayerIds: players.map(p => p.id) }],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      phase: 'waiting',
      currentBet: 0,
      lastAction: null,
      actionHistory: []
    };
  }

  postBlinds(gameState: GameState, smallBlindAmount: number, bigBlindAmount: number): GameState {
    const players = [...gameState.players];
    const dealerIndex = gameState.dealerIndex;
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;

    // Post small blind
    const smallBlindBet = Math.min(smallBlindAmount, players[smallBlindIndex].chips);
    players[smallBlindIndex] = {
      ...players[smallBlindIndex],
      chips: players[smallBlindIndex].chips - smallBlindBet,
      bet: smallBlindBet,
      allIn: players[smallBlindIndex].chips - smallBlindBet === 0
    };

    // Post big blind
    const bigBlindBet = Math.min(bigBlindAmount, players[bigBlindIndex].chips);
    players[bigBlindIndex] = {
      ...players[bigBlindIndex],
      chips: players[bigBlindIndex].chips - bigBlindBet,
      bet: bigBlindBet,
      allIn: players[bigBlindIndex].chips - bigBlindBet === 0
    };

    return {
      ...gameState,
      players,
      pots: [{ ...gameState.pots[0], amount: smallBlindBet + bigBlindBet }],
      currentBet: bigBlindAmount,
      lastAction: `Blinds posted: $${smallBlindAmount}/$${bigBlindAmount}`
    };
  }

  startNewHand(gameState: GameState): GameState {
    const deck = this.createDeck();
    
    const activePlayers = gameState.players.filter(p => p.chips > 0);

    if (activePlayers.find(p => p.isHuman)?.chips === 0) {
      return {
        ...gameState,
        lastAction: "Game Over! You are out of chips."
      };
    }

    const players = activePlayers.map(p => ({
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
      pots: [{ amount: 0, eligiblePlayerIds: updatedPlayers.map(p => p.id) }],
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
    
    const amountToCall = gameState.currentBet - player.bet;
    const actualBet = Math.min(amount, player.chips);

    let actionText = '';
    if (gameState.currentBet === 0) {
      actionText = `${player.name} bets $${actualBet}`;
    } else if (actualBet === amountToCall) {
      actionText = `${player.name} calls $${actualBet}`;
    } else {
      actionText = `${player.name} raises to $${player.bet + actualBet}`;
    }
    
    players[playerIndex] = {
      ...player,
      chips: player.chips - actualBet,
      bet: player.bet + actualBet,
      allIn: player.chips - actualBet === 0
    };

    const newPots = [...gameState.pots];
    newPots[0].amount += actualBet;

    return {
      ...gameState,
      players,
      pots: newPots,
      currentBet: Math.max(gameState.currentBet, players[playerIndex].bet),
      lastAction: actionText
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

  resolveShowdown(gameState: GameState): { winners: number[]; winningHand: string } {
    const activePlayers = this.getActivePlayers(gameState);
    
    if (activePlayers.length === 0) {
      return { winners: [], winningHand: 'No players' };
    }

    if (activePlayers.length === 1) {
      const winnerIndex = gameState.players.findIndex(p => p.id === activePlayers[0].id);
      return { 
        winners: [winnerIndex], 
        winningHand: 'All others folded' 
      };
    }

    // Evaluate all active players' hands
    const evaluations = activePlayers.map((player, idx) => {
      const playerIndex = gameState.players.findIndex(p => p.id === player.id);
      const result = handEvaluator.evaluateHand(player.hand, gameState.communityCards);
      return {
        playerIndex,
        ...result
      };
    });

    // Find the highest hand value
    const maxValue = Math.max(...evaluations.map(e => e.value));
    
    // Get all players with the max value (handles ties)
    const winners = evaluations
      .filter(e => e.value === maxValue)
      .map(e => e.playerIndex);
    
    const winningHand = evaluations.find(e => e.value === maxValue)?.description || 'Best Hand';
    
    return { winners, winningHand };
  }

  calculatePots(gameState: GameState): GameState {
    // This is a simplified pot calculation. A full implementation would be more complex.
    const activePlayers = this.getActivePlayers(gameState);
    const totalPot = activePlayers.reduce((sum, player) => sum + player.bet, 0);
    
    return {
      ...gameState,
      pots: [{ amount: totalPot, eligiblePlayerIds: activePlayers.map(p => p.id) }]
    };
  }

  awardPots(gameState: GameState, winners: number[]): GameState {
    const players = [...gameState.players];
    
    gameState.pots.forEach(pot => {
      const eligibleWinners = winners.filter(winnerIndex => 
        pot.eligiblePlayerIds.includes(players[winnerIndex].id)
      );

      if (eligibleWinners.length > 0) {
        const potShare = Math.floor(pot.amount / eligibleWinners.length);
        const remainder = pot.amount % eligibleWinners.length;

        eligibleWinners.forEach((winnerIndex, idx) => {
          const extraChip = idx < remainder ? 1 : 0;
          players[winnerIndex] = {
            ...players[winnerIndex],
            chips: players[winnerIndex].chips + potShare + extraChip
          };
        });
      }
    });

    return {
      ...gameState,
      players,
      pots: []
    };
  }
}

export const gameEngine = new GameEngine();
