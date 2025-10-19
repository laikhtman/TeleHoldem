import { Card, Player, GameState, SUITS, RANKS, GamePhase, Pot, ACHIEVEMENT_LIST, AchievementId } from '@shared/schema';
import { handEvaluator } from './handEvaluator';
import { achievementEngine } from './achievementEngine';

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
    const players: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
      id: String(i),
      name: i === 0 ? 'You' : `Bot ${i}`,
      chips: 1000,
      hand: [],
      bet: 0,
      folded: false,
      allIn: false,
      isHuman: i === 0,
      position: i,
      stats: {
        handsWon: 0,
        biggestPot: 0,
      },
    }));

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
      actionHistory: [],
      roundActionCount: 0,
      sessionStats: {
        handsPlayed: 0,
        handsWonByPlayer: 0,
        handDistribution: {},
      },
      achievements: Object.fromEntries(
        Object.entries(ACHIEVEMENT_LIST).map(([id, ach]) => [id, { ...ach }])
      ),
    };
  }

  postBlinds(gameState: GameState, smallBlindAmount: number, bigBlindAmount: number): GameState {
    let newState = { ...gameState };
    const players = newState.players;
    const dealerIndex = newState.dealerIndex;
    
    const smallBlindIndex = (dealerIndex + 1) % players.length;
    const bigBlindIndex = (dealerIndex + 2) % players.length;

    // Post small blind
    const sbPlayer = players[smallBlindIndex];
    const smallBlindBet = Math.min(smallBlindAmount, sbPlayer.chips);
    newState = this.playerBet(newState, smallBlindIndex, smallBlindBet, true);

    // Post big blind
    const bbPlayer = players[bigBlindIndex];
    const bigBlindBet = Math.min(bigBlindAmount, bbPlayer.chips);
    newState = this.playerBet(newState, bigBlindIndex, bigBlindBet, true);
    
    newState.currentBet = bigBlindAmount;
    newState.lastAction = `Blinds posted: $${smallBlindAmount}/$${bigBlindAmount}`;
    
    return newState;
  }

  startNewHand(gameState: GameState): GameState {
    const activePlayers = gameState.players.filter(p => p.chips > 0 || p.bet > 0);

    if (activePlayers.length < 2) {
       return { ...gameState, lastAction: "Not enough players to start a new hand." };
    }
    
    if (activePlayers.find(p => p.isHuman)?.chips === 0) {
      return { ...gameState, lastAction: "Game Over! You are out of chips." };
    }

    const players = activePlayers.map(p => ({
      ...p,
      hand: [],
      bet: 0,
      folded: false,
      allIn: false
    }));

    const deck = this.createDeck();
    let currentDeck = deck;
    const updatedPlayers = players.map(player => {
      const { dealtCards, remainingDeck } = this.dealCards(currentDeck, 2);
      currentDeck = remainingDeck;
      return { ...player, hand: dealtCards };
    });

    const newDealerIndex = (gameState.dealerIndex + 1) % updatedPlayers.length;

    return {
      ...gameState,
      players: updatedPlayers,
      deck: currentDeck,
      communityCards: [],
      pots: [{ amount: 0, eligiblePlayerIds: updatedPlayers.map(p => p.id) }],
      currentBet: 0,
      dealerIndex: newDealerIndex,
      currentPlayerIndex: (newDealerIndex + 1) % updatedPlayers.length,
      phase: 'pre-flop',
      lastAction: 'New hand started',
      sessionStats: {
        ...gameState.sessionStats,
        handsPlayed: gameState.sessionStats.handsPlayed + 1,
      },
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
    const calculatedState = this.calculatePots(gameState);

    const phaseTransitions: Record<GamePhase, { next: GamePhase; dealCards: number }> = {
      'waiting': { next: 'pre-flop', dealCards: 0 },
      'pre-flop': { next: 'flop', dealCards: 3 },
      'flop': { next: 'turn', dealCards: 1 },
      'turn': { next: 'river', dealCards: 1 },
      'river': { next: 'showdown', dealCards: 0 },
      'showdown': { next: 'waiting', dealCards: 0 }
    };

    const transition = phaseTransitions[calculatedState.phase];
    let newState = { ...calculatedState, phase: transition.next };

    if (transition.dealCards > 0) {
      newState = this.dealCommunityCards(newState, transition.dealCards);
    }

    newState.currentBet = 0;
    newState.players = newState.players.map(p => ({ ...p, bet: 0 }));
    newState.roundActionCount = 0;

    return newState;
  }

  playerFold(gameState: GameState, playerIndex: number): GameState {
    const players = [...gameState.players];
    players[playerIndex] = { ...players[playerIndex], folded: true };
    return { 
      ...gameState, 
      players, 
      lastAction: `${players[playerIndex].name} folds`,
      roundActionCount: gameState.roundActionCount + 1
    };
  }

  playerCheck(gameState: GameState, playerIndex: number): GameState {
    return { 
      ...gameState, 
      lastAction: `${gameState.players[playerIndex].name} checks`,
      roundActionCount: gameState.roundActionCount + 1
    };
  }

  playerBet(gameState: GameState, playerIndex: number, amount: number, isBlind: boolean = false): GameState {
    const players = [...gameState.players];
    const player = players[playerIndex];
    
    const actualBet = Math.min(amount, player.chips);
    const newTotalBet = player.bet + actualBet;

    let actionText = '';
    if (!isBlind) {
      if (gameState.currentBet === 0) actionText = `${player.name} bets $${actualBet}`;
      else if (newTotalBet < gameState.currentBet) actionText = `${player.name} calls $${actualBet} (all-in)`;
      else if (newTotalBet === gameState.currentBet) actionText = `${player.name} calls $${actualBet}`;
      else actionText = `${player.name} raises to $${newTotalBet}`;
    }
    
    players[playerIndex] = {
      ...player,
      chips: player.chips - actualBet,
      bet: newTotalBet,
      allIn: player.chips - actualBet === 0
    };

    return {
      ...gameState,
      players,
      currentBet: Math.max(gameState.currentBet, newTotalBet),
      lastAction: isBlind ? gameState.lastAction : actionText,
      roundActionCount: isBlind ? gameState.roundActionCount : gameState.roundActionCount + 1
    };
  }

  getNextPlayerIndex(gameState: GameState): number {
    let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    let attempts = 0;
    while ((gameState.players[nextIndex].folded || gameState.players[nextIndex].allIn) && attempts < gameState.players.length) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
      attempts++;
    }
    return nextIndex;
  }

  isRoundComplete(gameState: GameState): boolean {
    const activePlayers = gameState.players.filter(p => !p.folded && !p.allIn);
    if (activePlayers.length === 0) return true;
    
    const firstActiveBet = activePlayers[0].bet;
    const allMatched = activePlayers.every(p => p.bet === firstActiveBet);

    // Check if at least one player has acted in this round
    const hasAction = gameState.roundActionCount > 0;

    // In pre-flop, the big blind can still act if no one raised.
    if (gameState.phase === 'pre-flop') {
        const bigBlindIndex = (gameState.dealerIndex + 2) % gameState.players.length;
        const bbPlayer = gameState.players[bigBlindIndex];
        if (bbPlayer && !bbPlayer.folded && !bbPlayer.allIn && bbPlayer.bet === gameState.currentBet && gameState.currentPlayerIndex === bigBlindIndex) {
            const raises = gameState.players.some(p => p.bet > gameState.currentBet);
            if (!raises) return false;
        }
    }

    return allMatched && hasAction;
  }

  getActivePlayers(gameState: GameState): Player[] {
    return gameState.players.filter(p => !p.folded);
  }

  resolveShowdown(gameState: GameState): { winners: Player[]; winningHand: string } {
    const activePlayers = this.getActivePlayers(gameState);
    if (activePlayers.length === 0) return { winners: [], winningHand: 'No players' };
    if (activePlayers.length === 1) return { winners: [activePlayers[0]], winningHand: 'All others folded' };

    const evaluations = activePlayers.map(player => ({
      player,
      ...handEvaluator.evaluateHand(player.hand, gameState.communityCards)
    }));

    const maxValue = Math.max(...evaluations.map(e => e.value));
    const winners = evaluations.filter(e => e.value === maxValue).map(e => e.player);
    const winningHand = evaluations.find(e => e.value === maxValue)?.description || 'Best Hand';
    
    return { winners, winningHand };
  }

  calculatePots(gameState: GameState): GameState {
    const playersInHand = gameState.players.filter(p => !p.folded);
    // Create a working copy of player bets to avoid mutating original game state
    const playerBets = playersInHand.map(p => ({ id: p.id, bet: p.bet }));
    const bets = [...playerBets].sort((a, b) => a.bet - b.bet);
    const pots: Pot[] = [];
    let lastBetLevel = 0;

    for (const betInfo of bets) {
        if (betInfo.bet <= lastBetLevel) continue;

        const currentBetLevel = betInfo.bet;
        const potAmount = (currentBetLevel - lastBetLevel) * playerBets.filter(p => p.bet >= currentBetLevel).length;
        
        const contributingPlayerIds = playerBets.filter(p => p.bet > lastBetLevel).map(p => p.id);
        
        // Update working copy of bets, not original player objects
        for (const p of playerBets) {
            if (p.bet > lastBetLevel) {
                p.bet -= Math.min(p.bet, currentBetLevel - lastBetLevel);
            }
        }

        pots.push({
            amount: potAmount,
            eligiblePlayerIds: contributingPlayerIds
        });

        lastBetLevel = currentBetLevel;
    }
    
    // Consolidate pots from previous rounds
    const totalPreviousPot = gameState.pots.reduce((sum, pot) => sum + pot.amount, 0);
    
    // If no pots were created (everyone checked), create a main pot
    if (pots.length === 0) {
      pots.push({
        amount: totalPreviousPot,
        eligiblePlayerIds: playersInHand.map(p => p.id)
      });
    } else {
      // Add previous pot to the main pot
      pots[0].amount += totalPreviousPot;
    }

    return { ...gameState, pots };
  }

  awardPots(gameState: GameState): { newState: GameState, unlockedAchievements: AchievementId[] } {
    let players = [...gameState.players];
    let sessionStats = { ...gameState.sessionStats };
    let achievements = { ...gameState.achievements };
    let unlockedAchievements: AchievementId[] = [];
    
    for (const pot of gameState.pots) {
      const eligiblePlayers = players.filter(p => pot.eligiblePlayerIds.includes(p.id) && !p.folded);
      if (eligiblePlayers.length === 0) continue;

      const { winners, winningHand } = this.resolveShowdown({ ...gameState, players: eligiblePlayers });
      if (winners.length === 0) continue;

      const potShare = Math.floor(pot.amount / winners.length);
      const remainder = pot.amount % winners.length;

      winners.forEach((winner, idx) => {
        const winnerIndex = players.findIndex(p => p.id === winner.id);
        if (winnerIndex !== -1) {
          if (players[winnerIndex].isHuman) {
            sessionStats.handsWonByPlayer += 1;
            const currentCount = sessionStats.handDistribution[winningHand] || 0;
            sessionStats.handDistribution[winningHand] = currentCount + 1;
          }
          const extraChip = idx < remainder ? 1 : 0;
          const winAmount = potShare + extraChip;
          
          players[winnerIndex] = {
            ...players[winnerIndex],
            chips: players[winnerIndex].chips + winAmount,
            stats: {
              handsWon: players[winnerIndex].stats.handsWon + 1,
              biggestPot: Math.max(players[winnerIndex].stats.biggestPot, winAmount),
            }
          };

          if (players[winnerIndex].isHuman) {
            const result = achievementEngine.checkAchievements({ ...gameState, achievements, sessionStats }, winningHand, winAmount);
            achievements = result.newState.achievements;
            unlockedAchievements.push(...result.unlockedAchievements);
          }
        }
      });
    }

    return { newState: { ...gameState, players, pots: [], sessionStats, achievements }, unlockedAchievements };
  }
}

export const gameEngine = new GameEngine();